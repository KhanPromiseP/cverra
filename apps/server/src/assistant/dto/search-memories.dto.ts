import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';

export enum MemorySortBy {
  RELEVANCE = 'relevance',
  IMPORTANCE = 'importance',
  RECENT = 'recent',
  OLDEST = 'oldest',
}

export class SearchMemoriesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  contextType?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(MemorySortBy)
  sortBy?: MemorySortBy = MemorySortBy.RECENT;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  dateFrom?: Date;

  @IsOptional()
  dateTo?: Date;
}