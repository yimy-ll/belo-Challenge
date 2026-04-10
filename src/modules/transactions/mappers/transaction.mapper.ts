import { Transaction } from '@transactions/entities/transaction.entity';
import { TransactionDto } from '@transactions/dto/transaction.dto';
import { CreateDto } from '../dto/create.dto';
import { TransactionStatus } from '../enums/transaction.enum';

export class TransactionMapper {
  static toDto(entity: Transaction): TransactionDto {
    const dto = new TransactionDto();
    dto.id = entity.id;
    dto.amount = entity.amount;
    dto.status = entity.status;
    dto.originAddress = entity.originAddress;
    dto.destinationAddress = entity.destinationAddress;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static toEntityFromCreateDto(createDto: CreateDto, userId: string, pendingThreshold: number): Transaction {
    const entity = new Transaction();
    entity.amount = createDto.amount;
    entity.originAddress = createDto.originAddress;
    entity.destinationAddress = createDto.destinationAddress;
    entity.status = createDto.amount > pendingThreshold ? TransactionStatus.PENDING : TransactionStatus.CONFIRMED;
    entity.userId = userId;
    return entity;
  }

  static toEntity(dto: TransactionDto): Transaction {
    const entity = new Transaction();
    entity.amount = dto.amount;
    entity.status = dto.status;
    entity.originAddress = dto.originAddress;
    entity.destinationAddress = dto.destinationAddress;
    return entity;
  }

  static toDtoList(entities: Transaction[]): TransactionDto[] {
    return entities.map((entity) => TransactionMapper.toDto(entity));
  }
}
