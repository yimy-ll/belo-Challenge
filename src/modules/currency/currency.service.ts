import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '@currency/entities/currency.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) { }

  /**
   * Busca y retorna una moneda (Currency) a través de su código único.
   * Por ejemplo: 'USD', 'ARS', 'BTC', 'ETH'.
   * 
   * @param code El código identificador de la moneda.
   * @returns Entidad Currency correspondiente al código solicitado o null si no se encuentra.
   */
  async findByCode(code: string): Promise<Currency | null> {
    return this.currencyRepository.findOne({ where: { code } });
  }
}
