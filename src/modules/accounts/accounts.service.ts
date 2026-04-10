import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '@accounts/entities/account.entity';
import { InsufficientFundsException } from '@accounts/exceptions/insufficient-funds.exception';
import { AccountNotFoundException } from '@accounts/exceptions/account-not-found.exception';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) { }

  async findByAddress(address: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({ where: { address }, relations: ['currency'] });
    if (!account) throw new AccountNotFoundException(address);
    return account;
  }

  async verifyAccountsForTransaction(originAddress: string, destinationAddress: string): Promise<[Account, Account]> {
    const [originAccount, destinationAccount] = await Promise.all([
      this.findByAddress(originAddress),
      this.findByAddress(destinationAddress),
    ]);

    return [originAccount, destinationAccount];
  }

  async executeTransaction(originAccount: Account, destinationAccount: Account, amount: number, manager?: EntityManager) {
    const numericAmount = Number(amount);
    await this.unfreezeBalance(originAccount, numericAmount, manager);
    await this.debitBalance(originAccount, numericAmount, manager);
    await this.creditBalance(destinationAccount, numericAmount, manager);
  }

  async freezeBalance(account: Account, amount: number) {
    const numericAmount = Number(amount);
    if (!account.balanceIsEnough(numericAmount)) throw new InsufficientFundsException();
    account.freezeBalance(numericAmount);
    return await this.accountsRepository.save(account);
  }

  async unfreezeBalance(account: Account, amount: number, manager?: EntityManager) {
    account.unfreezeBalance(Number(amount));
    return manager ? await manager.save(account) : await this.accountsRepository.save(account);
  }

  private async creditBalance(account: Account, amount: number, manager?: EntityManager) {
    account.credit(Number(amount));
    return manager ? await manager.save(account) : await this.accountsRepository.save(account);
  }

  private async debitBalance(account: Account, amount: number, manager?: EntityManager) {
    const numericAmount = Number(amount);
    if (!account.balanceIsEnough(numericAmount)) throw new InsufficientFundsException();
    account.debit(numericAmount);
    return manager ? await manager.save(account) : await this.accountsRepository.save(account);
  }
}
