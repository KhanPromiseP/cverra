import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  planId: string;

  @IsString()
  provider: string; // e.g. MOCK, STRIPE, TRANZAK
}
