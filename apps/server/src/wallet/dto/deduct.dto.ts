
import { IsInt, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { TransactionSource } from '@prisma/client';

export class DeductDto {
  @IsNotEmpty()
  userId: string;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsEnum(TransactionSource)
  source?: TransactionSource;
}