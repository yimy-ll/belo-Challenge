import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from '@transactions/transactions.service';
import { TransactionsController } from '@transactions/transactions.controller';
import { Transaction } from '@transactions/entities/transaction.entity';
import { AccountsModule } from '@accounts/accounts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), AccountsModule],
  providers: [TransactionsService],
  controllers: [TransactionsController]
})
export class TransactionsModule { }
