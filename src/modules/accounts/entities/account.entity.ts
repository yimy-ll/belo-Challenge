import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Currency } from '@currency/entities/currency.entity';
@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', scale: 2, default: 0 })
  frozenBalance: number;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @Column({ name: 'currency_id' })
  currencyId: string;

  @Column({ unique: true, nullable: true })
  address: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  public equalsCurrency(other: Account): boolean {
    return this.currency.equals(other.currency);
  }

  public balanceIsEnough(amount: number): boolean {
    return Number(this.balance) - Number(this.frozenBalance) >= amount;
  }

  public credit(amount: number) {
    this.balance = Number(this.balance) + amount;
  }

  public debit(amount: number) {
    this.balance = Number(this.balance) - amount;
  }

  public freezeBalance(amount: number) {
    this.frozenBalance = Number(this.frozenBalance) + amount;
  }

  public unfreezeBalance(amount: number) {
    this.frozenBalance = Number(this.frozenBalance) - amount;
  }
}
