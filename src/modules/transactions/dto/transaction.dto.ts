import { TransactionStatus } from "@transactions/enums/transaction.enum";

export class TransactionDto {
  id: string;
  amount: number;
  status: TransactionStatus;
  originAddress: string;
  destinationAddress: string;
  createdAt: Date;
  updatedAt: Date;
}