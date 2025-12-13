// src/payments/subscriptions/dto/subscription-plan.dto.ts
import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, IsArray, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  coins: number;

  @IsEnum(['MONTHLY', 'YEARLY'])
  interval: 'MONTHLY' | 'YEARLY';

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  coins?: number;

  @IsEnum(['MONTHLY', 'YEARLY'])
  @IsOptional()
  interval?: 'MONTHLY' | 'YEARLY';

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}