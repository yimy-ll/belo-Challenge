import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '@users/entities/user.entity';
import { TransactionStatus } from '@transactions/enums/transaction.enum';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'origin_address' })
  originAddress: string;

  @Column({ name: 'destination_address' })
  destinationAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  confirmed() {
    this.status = TransactionStatus.CONFIRMED;
  }

  rejected() {
    this.status = TransactionStatus.REJECTED;
  }

  public equalsStatus(status: TransactionStatus): boolean {
    return this.status === status;
  }
}
