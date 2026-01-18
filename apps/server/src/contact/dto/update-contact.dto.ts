// contact/dto/update-contact.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateContactDto {
  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;
}