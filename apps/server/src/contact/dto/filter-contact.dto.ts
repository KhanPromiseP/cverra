// contact/dto/filter-contact.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class FilterContactDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}