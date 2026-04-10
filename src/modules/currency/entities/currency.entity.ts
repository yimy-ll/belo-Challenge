import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyType } from '@/modules/currency/enum/CurrencyType';

@Entity()
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: CurrencyType })
  type: CurrencyType;

  @Column({ type: 'int' })
  precision: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Equals two currencies
   * @param other The other currency to compare
   * @returns True if the currencies are equal, false otherwise
   */
  public equals(other: Currency): boolean {
    return this.id === other.id;
  }
}
