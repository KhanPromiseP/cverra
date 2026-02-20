// src/services/reviewApi.ts
import { apiClient } from './api-client';

export interface Review {
  id: string;
  articleId: string;
  userId: string;
  rating: number; // 1-5
  insightText: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    picture?: string;
    username: string;
    // Remove isVerified if not in your User model
  };
  isHelpful?: boolean; // For current user
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

export interface CreateReviewDto {
  rating: number;
  insightText: string;
}

class ReviewApi {
  /**
   * Get reviews for an article
   */
  async getArticleReviews(articleId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'helpful';
}): Promise<{
  reviews: Review[];
  summary: ReviewSummary;
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}> {
  console.log('📡 ReviewApi - Making request for article:', articleId, 'params:', params);
  
  const response = await apiClient.get(`/articles/${articleId}/reviews`, { params });
  
  console.log('📥 ReviewApi - Raw response data:', response.data);
  
  // Log the first review's isHelpful if it exists
  if (response.data?.reviews?.length > 0) {
    console.log('📥 ReviewApi - First review isHelpful:', response.data.reviews[0].isHelpful);
    console.log('📥 ReviewApi - All reviews isHelpful values:', 
      response.data.reviews.map((r: any) => ({ id: r.id, isHelpful: r.isHelpful })));
  } else {
    console.log('📥 ReviewApi - No reviews in response');
  }
  
  return response.data;
}

  /**
   * Get review summary for an article
   */
  async getReviewSummary(articleId: string): Promise<ReviewSummary> {
    const response = await apiClient.get(`/articles/${articleId}/reviews/summary`);
    return response.data;
  }

  /**
   * Check if user has voted on a review
   */
  async hasUserVoted(reviewId: string): Promise<{ voted: boolean }> {
    const response = await apiClient.get(`/reviews/${reviewId}/has-voted`);
    return response.data;
  }

  /**
   * Add a review to an article
   */
  async addReview(articleId: string, data: CreateReviewDto): Promise<{ success: boolean; data: Review }> {
    const response = await apiClient.post(`/articles/${articleId}/reviews`, data);
    return response.data;
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, data: Partial<CreateReviewDto>): Promise<{ success: boolean; data: Review }> {
    const response = await apiClient.put(`/reviews/${reviewId}`, data);
    return response.data;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  }

  /**
   * Remove helpful mark
   */
  async unmarkHelpful(reviewId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/reviews/${reviewId}/helpful`);
    return response.data;
  }

  /**
   * Get user's review for an article
   */
  async getUserReview(articleId: string): Promise<{ exists: boolean; review?: Review }> {
    const response = await apiClient.get(`/articles/${articleId}/my-review`);
    return response.data;
  }
}

export default new ReviewApi();