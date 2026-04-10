import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyService } from '@currency/currency.service';
import { Currency } from '@currency/entities/currency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  providers: [CurrencyService],
  exports: [CurrencyService]
})
export class CurrencyModule { }
