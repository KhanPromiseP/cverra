import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, MaxLength, IsArray } from 'class-validator';

export enum MemoryImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Summary is too long (max 500 characters)' })
  summary?: string;

  @IsOptional()
  @IsEnum(MemoryImportance)
  importance?: MemoryImportance;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore?: number;
}