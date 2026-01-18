// article.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Add this import
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaModule } from '../../../../tools/prisma/prisma.module';
import { CategoryService } from './category.service';
import { RecommendationService } from './recommendation.service';
import { TranslationService } from './translation.service';
import { EngagementService } from './engagement.service';
import { NotificationModule } from '../notification/notification.module';
import { UploadModule } from './upload.module';

import { ArticleResponseTransformer } from './article-response.transformer';
import { RecommendationNotificationService } from './recommendation-notification.service';

@Module({
  imports: [
    HttpModule, // Add this line - it provides HttpService
    PrismaModule,
    UploadModule,
    NotificationModule,
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    CategoryService,
    RecommendationService,
    TranslationService,
    EngagementService,
    ArticleResponseTransformer, // Add this
    RecommendationNotificationService,
  ],
  exports: [ArticleService, RecommendationService],
})
export class ArticleModule {}