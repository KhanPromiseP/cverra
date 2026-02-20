// src/articles/review/review.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewSortBy } from './dto/review-query.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get reviews for an article with pagination
   */
  async getArticleReviews(
    articleId: string,
    userId?: string,
    page = 1,
    limit = 10,
    sortBy: ReviewSortBy = ReviewSortBy.RECENT
  ) {
    const skip = (page - 1) * limit;
    
    // Build orderBy based on sort
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === ReviewSortBy.HELPFUL) {
      orderBy = { helpfulCount: 'desc' };
    }

    // Get reviews
    const reviews = await this.prisma.articleReview.findMany({
      where: {
        articleId,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
            username: true
            // Remove isVerified - not in your schema
          }
        }
        // Remove helpfulVotes include - we'll handle differently
      },
      orderBy,
      skip,
      take: limit
    });

    // If user is logged in, check which reviews they've marked as helpful
    let helpfulVotes: Set<string> = new Set();
    if (userId) {
      const votes = await this.prisma.reviewHelpfulVote.findMany({
        where: {
          userId,
          reviewId: {
            in: reviews.map(r => r.id)
          }
        },
        select: {
          reviewId: true
        }
      });
      helpfulVotes = new Set(votes.map(v => v.reviewId));
    }

    // Transform to include isHelpful flag
    const transformedReviews = reviews.map(review => ({
      ...review,
      isHelpful: userId ? helpfulVotes.has(review.id) : false,
      isOwn: userId ? review.userId === userId : false
    }));

    // Get total count
    const total = await this.prisma.articleReview.count({
      where: {
        articleId,
        status: 'APPROVED'
      }
    });

    // Get rating distribution
    const ratingDistribution = await this.prisma.articleReview.groupBy({
      by: ['rating'],
      where: {
        articleId,
        status: 'APPROVED'
      },
      _count: true
    });

    // Format distribution
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratingDistribution.forEach(item => {
      distribution[item.rating as keyof typeof distribution] = item._count;
    });

    // Calculate average rating
    const avgResult = await this.prisma.articleReview.aggregate({
      where: {
        articleId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      }
    });

    return {
      reviews: transformedReviews,
      summary: {
        averageRating: avgResult._avg.rating || 0,
        totalReviews: total,
        ratingDistribution: distribution
      },
      meta: {
        total,
        page,
        limit,
        hasMore: skip + reviews.length < total
      }
    };
  }

  /**
   * Add a review to an article
   */
  async addReview(articleId: string, userId: string, data: CreateReviewDto) {
    // Check if user already reviewed
    const existing = await this.prisma.articleReview.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId
        }
      }
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this article');
    }

    // Create review
    const review = await this.prisma.articleReview.create({
      data: {
        articleId,
        userId,
        rating: data.rating,
        insightText: data.insightText,
        status: 'APPROVED' // For free articles
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
            username: true
          }
        }
      }
    });

    // Update article review stats
    await this.updateArticleStats(articleId);

    return review;
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, userId: string, data: UpdateReviewDto) {
    // Check ownership
    const review = await this.prisma.articleReview.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission');
    }

    // Update review
    const updated = await this.prisma.articleReview.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        insightText: data.insightText,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
            username: true
          }
        }
      }
    });

    // Update article stats
    await this.updateArticleStats(review.articleId);

    return updated;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.articleReview.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission');
    }

    const articleId = review.articleId;

    await this.prisma.articleReview.delete({
      where: { id: reviewId }
    });

    // Update article stats
    await this.updateArticleStats(articleId);

    return { success: true };
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string, userId: string) {
    // Check if already voted
    const existing = await this.prisma.reviewHelpfulVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId
        }
      }
    });

    if (existing) {
      throw new ConflictException('Already marked as helpful');
    }

    // Create vote and increment count in transaction
    await this.prisma.$transaction([
      this.prisma.reviewHelpfulVote.create({
        data: {
          reviewId,
          userId
        }
      }),
      this.prisma.articleReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1
          }
        }
      })
    ]);

    return { success: true };
  }

  /**
   * Remove helpful mark
   */
  async unmarkHelpful(reviewId: string, userId: string) {
    // Delete vote and decrement count in transaction
    await this.prisma.$transaction([
      this.prisma.reviewHelpfulVote.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId
          }
        }
      }),
      this.prisma.articleReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1
          }
        }
      })
    ]);

    return { success: true };
  }

  /**
   * Get user's review for an article
   */
  async getUserReview(articleId: string, userId: string) {
    const review = await this.prisma.articleReview.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
            username: true
          }
        }
      }
    });

    return {
      exists: !!review,
      review
    };
  }

  /**
   * Update article review statistics
   */
  private async updateArticleStats(articleId: string) {
    const [count, avg] = await Promise.all([
      this.prisma.articleReview.count({
        where: {
          articleId,
          status: 'APPROVED'
        }
      }),
      this.prisma.articleReview.aggregate({
        where: {
          articleId,
          status: 'APPROVED'
        },
        _avg: {
          rating: true
        }
      })
    ]);

    await this.prisma.article.update({
      where: { id: articleId },
      data: {
        reviewCount: count,
        averageRating: avg._avg.rating || 0
      }
    });
  }
}