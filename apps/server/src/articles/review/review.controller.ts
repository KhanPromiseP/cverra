// src/review/review.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';

@Controller('')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService, private readonly prisma: PrismaService) {}

  /**
   * GET /articles/:articleId/reviews
   * Get reviews for an article
   */
  // apps/server/src/review/review.controller.ts

@Get('articles/:articleId/reviews')
async getArticleReviews(
  @Param('articleId') articleId: string,
  @CurrentUser() user: any,
  @Query() query: ReviewQueryDto
) {
  try {
    const userId = user?.id;
    
    // Ensure numbers
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const sortBy = query.sortBy ;
    
    const result = await this.reviewService.getArticleReviews(
      articleId,
      userId,
      page,
      limit,
      sortBy
    );

    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('Error in getArticleReviews controller:', error);
    throw error;
  }
}

/**
 * GET /reviews/:reviewId/has-voted
 * Check if current user has voted on a review
 */
@Get('reviews/:reviewId/has-voted')
@UseGuards(JwtGuard)
async hasUserVoted(
  @Param('reviewId') reviewId: string,
  @CurrentUser() user: any
) {
  if (!user?.id) {
    return { voted: false };
  }

  const vote = await this.prisma.reviewHelpfulVote.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId: user.id
      }
    }
  });

  return { voted: !!vote };
}

  /**
   * GET /articles/:articleId/reviews/summary
   * Get review summary for an article
   */
  @Get('articles/:articleId/reviews/summary')
  async getReviewSummary(@Param('articleId') articleId: string) {
    const result = await this.reviewService.getArticleReviews(articleId, undefined, 1, 1);
    
    return {
      success: true,
      summary: result.summary
    };
  }

  /**
   * POST /articles/:articleId/reviews
   * Add a review to an article
   */
  @Post('articles/:articleId/reviews')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async addReview(
    @Param('articleId') articleId: string,
    @CurrentUser() user: any,
    @Body() createReviewDto: CreateReviewDto
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      const review = await this.reviewService.addReview(
        articleId,
        user.id,
        createReviewDto
      );

      return {
        success: true,
        data: review
      };
    } catch (error) {
      if (error.message === 'You have already reviewed this article') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  /**
   * PUT /reviews/:reviewId
   * Update a review
   */
  @Put('reviews/:reviewId')
  @UseGuards(JwtGuard)
  async updateReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      const review = await this.reviewService.updateReview(
        reviewId,
        user.id,
        updateReviewDto
      );

      return {
        success: true,
        data: review
      };
    } catch (error) {
      if (error.message === 'Review not found or you do not have permission') {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /reviews/:reviewId
   * Delete a review
   */
  @Delete('reviews/:reviewId')
  @UseGuards(JwtGuard)
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      await this.reviewService.deleteReview(reviewId, user.id);

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      if (error.message === 'Review not found or you do not have permission') {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /reviews/:reviewId/helpful
   * Mark review as helpful
   */
  @Post('reviews/:reviewId/helpful')
  @UseGuards(JwtGuard)
  async markHelpful(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      await this.reviewService.markHelpful(reviewId, user.id);

      return {
        success: true,
        message: 'Marked as helpful'
      };
    } catch (error) {
      if (error.message === 'Already marked as helpful') {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /reviews/:reviewId/helpful
   * Remove helpful mark
   */
  @Delete('reviews/:reviewId/helpful')
  @UseGuards(JwtGuard)
  async unmarkHelpful(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    await this.reviewService.unmarkHelpful(reviewId, user.id);

    return {
      success: true,
      message: 'Removed helpful mark'
    };
  }

  /**
   * GET /articles/:articleId/my-review
   * Get user's review for an article
   */
  @Get('articles/:articleId/my-review')
  @UseGuards(JwtGuard)
  async getUserReview(
    @Param('articleId') articleId: string,
    @CurrentUser() user: any
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const result = await this.reviewService.getUserReview(articleId, user.id);

    return {
      success: true,
      ...result
    };
  }
}