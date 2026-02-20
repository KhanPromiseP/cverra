// src/dtos/review.dto.ts
export interface CreateReviewDto {
  rating: number;
  insightText: string;
}

export interface UpdateReviewDto {
  rating?: number;
  insightText?: string;
}

export interface ReviewResponse {
  id: string;
  articleId: string;
  userId: string;
  rating: number;
  insightText: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    picture?: string;
    username: string;
  };
  isHelpful?: boolean;
  isOwn?: boolean;
}

export interface ReviewSummary {
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