import { SelectQueryBuilder } from 'typeorm';
import { Transaction } from '@transactions/entities/transaction.entity';

import { FilterDto } from '@transactions/dto/filter.dto';

export class TransactionFilterSpecification {
  constructor(private readonly filterDto: FilterDto) { }

  apply(queryBuilder: SelectQueryBuilder<Transaction>): SelectQueryBuilder<Transaction> {
    const { status, userId } = this.filterDto;

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('transaction.userId = :userId', { userId });
    }

    return queryBuilder;
  }
}
