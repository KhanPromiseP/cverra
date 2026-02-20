// src/review/dto/create-review.dto.ts
import { IsInt, Min, Max, IsString, Length } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Length(100, 2000)
  insightText: string;
}