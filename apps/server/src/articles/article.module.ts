// article.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaModule } from '../../../../tools/prisma/prisma.module';
import { CategoryService } from './category.service';
import { RecommendationService } from './recommendation.service';
import { TranslationService } from './translation.service';
import { EngagementService } from './engagement.service';
import { NotificationModule } from '../notification/notification.module';
import { UploadModule } from './upload.module';

import { AttachUserMiddleware } from '../middleware/attach-user.middleware';
import { ArticleResponseTransformer } from './article-response.transformer';
import { RecommendationNotificationService } from './recommendation-notification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { StorageModule } from '../storage/storage.module'; // Import if needed

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    UploadModule,
    NotificationModule,
    ConfigModule, // Add ConfigModule
    StorageModule, // Add if needed
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    CategoryService,
    RecommendationService,
    TranslationService,
    EngagementService,
    ArticleResponseTransformer,
    RecommendationNotificationService,
    UserService,
    AttachUserMiddleware,
    ConfigService, // Add ConfigService
  ],
  exports: [ArticleService, RecommendationService],
})
export class ArticleModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AttachUserMiddleware)
      .forRoutes('articles/:identifier');
  }
}