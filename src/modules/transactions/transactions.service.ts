import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transaction } from '@transactions/entities/transaction.entity';
import { CreateDto } from '@/modules/transactions/dto/create.dto';
import { FilterDto } from '@/modules/transactions/dto/filter.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { TransactionFilterSpecification } from '@transactions/specifications/transaction.specifications';
import { PaginationDto } from '@common/dto/pagination.dto';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { AccountsService } from '@accounts/accounts.service';
import { Account } from '@accounts/entities/account.entity';
import { TransactionDto } from '@transactions/dto/transaction.dto';
import { TransactionMapper } from './mappers/transaction.mapper';
import { TransactionNotPendingException } from './exceptions/transaction-not-pending.exception';
import { RedlockService } from '../redis/redlock.service';
import { ExecutionError } from 'redlock';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly accountsService: AccountsService,
    private readonly configService: ConfigService,
    private readonly redlockService: RedlockService,
  ) { }

  async create(createDto: CreateDto): Promise<Transaction> {
    const lock = await this.createLockTransaction(createDto.originAddress);
    try {
      const [originAccount, destinationAccount] = await this.accountsService.verifyAccountsForTransaction(
        createDto.originAddress,
        createDto.destinationAddress,
      );
      const pendingThreshold = Number(this.configService.get('TRANSACTION_PENDING_THRESHOLD', '50000'));

      let transaction = TransactionMapper.toEntityFromCreateDto(createDto, originAccount.userId, pendingThreshold);

      const updateOriginAccount = await this.accountsService.freezeBalance(originAccount, transaction.amount);

      if (transaction.equalsStatus(TransactionStatus.PENDING)) {
        return await this.transactionRepository.save(transaction);
      }

      return await this.processTransactions(updateOriginAccount, destinationAccount, transaction);
    } finally {
      await this.redlockService.releaseLock(lock);
    }
  }

  async findAll(filterDto: FilterDto, paginationDto: PaginationDto): Promise<PaginatedResponseDto<TransactionDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');
    new TransactionFilterSpecification(filterDto).apply(queryBuilder);

    const data = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await queryBuilder.getCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async approve(transactionId: string): Promise<Transaction> {
    const lock = await this.createLockTransaction(transactionId);
    try {
      let transaction = await this.findOneByStatus(transactionId, TransactionStatus.PENDING);

      if (!transaction) throw new TransactionNotPendingException();

      const [originAccount, destinationAccount] = await this.accountsService.verifyAccountsForTransaction(
        transaction.originAddress,
        transaction.destinationAddress,
      );

      return await this.processTransactions(originAccount, destinationAccount, transaction);
    } finally {
      await this.redlockService.releaseLock(lock);
    }
  }

  async reject(transactionId: string): Promise<Transaction> {
    const lock = await this.createLockTransaction(transactionId);
    try {
      let transaction = await this.findOneByStatus(transactionId, TransactionStatus.PENDING);

      if (!transaction) throw new TransactionNotPendingException();

      const { originAddress } = transaction;

      const originAccount = await this.accountsService.findByAddress(originAddress);

      return await this.rejectTransaction(transaction, originAccount);
    } finally {
      await this.redlockService.releaseLock(lock);
    }
  }

  private async processTransactions(accountOrigin: Account, accountDestination: Account, transaction: Transaction) {
    return await this.transactionRepository.manager.transaction(async (manager) => {
      const { amount } = transaction;
      try {
        await this.accountsService.executeTransaction(accountOrigin, accountDestination, amount, manager);
        transaction.confirmed();
        return await manager.save(transaction);
      } catch (error) {
        return await this.rejectTransaction(transaction, accountOrigin, manager);
      }
    });
  }

  private async rejectTransaction(transaction: Transaction, originAccount: Account, manager?: EntityManager) {
    const { amount } = transaction;

    await this.accountsService.unfreezeBalance(originAccount, amount, manager);

    transaction.rejected();
    return manager ? await manager.save(transaction) : await this.transactionRepository.save(transaction);
  }

  private async findOneByStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    return this.transactionRepository.findOneBy({ id, status });
  }

  async createLockTransaction(originAddress: string): Promise<Lock> {
    const lockKey = `lock:account:${originAddress}`;
    try {
      return await this.redlockService.acquireLock(lockKey);
    } catch (error) {
      throw new ConflictException('La cuenta de origen está procesando otra transacción concurrente, intente nuevamente');
    }
  }
}
