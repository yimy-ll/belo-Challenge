import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { PaginationDto } from '@common/dto/pagination.dto';

export class FilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Transaction status', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus, { message: 'Invalid status' })
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'User ID to filter transactions' })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;
}