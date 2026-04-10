import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { IsNotEqualTo } from '@common/decorators/is-not-equal-to.decorator';

export class CreateDto {
  @ApiProperty({ description: 'Transaction amount', example: 150.5, minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'Amount must be a number with a maximum of 3 decimal places' })
  @IsPositive({ message: 'Amount must be greater than or equal to 1' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({ description: 'Transaction origin address', example: '0x123abc' })
  @IsString({ message: 'Origin address must be a string' })
  @IsNotEmpty({ message: 'Origin address is required' })
  originAddress: string;

  @ApiProperty({ description: 'Transaction destination address', example: '0x456def' })
  @IsString({ message: 'Destination address must be a string' })
  @IsNotEmpty({ message: 'Destination address is required' })
  @IsNotEqualTo('originAddress', { message: 'Destination address must be different from origin address' })
  destinationAddress: string;
}