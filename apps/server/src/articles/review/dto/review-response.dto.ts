// src/review/dto/review-response.dto.ts
export class ReviewUserDto {
  id: string;
  name: string;
  picture?: string;
  username: string;
  isVerified?: boolean;
}

export class ReviewDto {
  id: string;
  articleId: string;
  userId: string;
  rating: number;
  insightText: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: ReviewUserDto;
  isHelpful?: boolean;
  isOwn?: boolean;
}

export class ReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ReviewMetaDto {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class ReviewListResponseDto {
  reviews: ReviewDto[];
  summary: ReviewSummaryDto;
  meta: ReviewMetaDto;
}

export class ReviewResponseDto {
  success: boolean;
  data?: ReviewDto;
  message?: string;
}

export class UserReviewResponseDto {
  exists: boolean;
  review?: ReviewDto;
}