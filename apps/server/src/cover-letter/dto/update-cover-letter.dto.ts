
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateCoverLetterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsObject()
  structure?: any;

  @IsOptional()
  @IsObject()
  userData?: any;

  @IsOptional()
  @IsObject()
  jobData?: any;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}