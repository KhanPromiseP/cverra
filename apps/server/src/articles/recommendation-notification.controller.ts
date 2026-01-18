// articles/recommendation-notification.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  UseGuards,
  Query,
  Request,
  BadRequestException
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RecommendationNotificationService } from './recommendation-notification.service';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Controller('notifications/recommendations')
export class RecommendationNotificationController {
  constructor(
    private readonly recommendationNotificationService: RecommendationNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('trigger/all')
  @UseGuards(JwtGuard, AdminGuard)
  async triggerAllNotifications() {
    try {
      const results = await Promise.allSettled([
        this.recommendationNotificationService.sendPersonalizedRecommendations(),
        this.recommendationNotificationService.sendNewArticlesNotifications(),
        this.recommendationNotificationService.sendTrendingArticlesNotifications(),
      ]);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `Triggered all notification jobs. Successful: ${successful}, Failed: ${failed}`,
        results: results.map((r, i) => ({
          job: ['recommendations', 'new-articles', 'trending'][i],
          status: r.status,
          value: r.status === 'fulfilled' ? r.value : r.reason?.message,
        })),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to trigger notifications: ${error.message}`);
    }
  }

  @Post('trigger/manual')
  @UseGuards(JwtGuard)
  async triggerManualNotification(
    @Request() req: any,
    @Query('type') type: string,
  ) {
    const userId = req.user.id;
    const validTypes = ['recommendations', 'new', 'trending', 'digest'];
    
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    return this.recommendationNotificationService.triggerManualNotifications(
      userId,
      type as any
    );
  }

  @Get('test/preferences')
  @UseGuards(JwtGuard)
  async testUserPreferences(@Request() req: any) {
    const userId = req.user.id;
    
    const profile = await this.prisma.userReadingProfile.findUnique({
      where: { userId },
      include: {
        favoriteCategories: true,
      },
    });

    return {
      success: true,
      data: {
        notifyNewArticles: profile?.notifyNewArticles ?? true,
        notifyTrending: profile?.notifyTrending ?? true,
        notifyPersonalized: profile?.notifyPersonalized ?? true,
        digestFrequency: profile?.digestFrequency ?? 'weekly',
        favoriteCategories: profile?.favoriteCategories?.map(c => c.name) || [],
        favoriteTags: profile?.favoriteTags || [],
      },
    };
  }
}