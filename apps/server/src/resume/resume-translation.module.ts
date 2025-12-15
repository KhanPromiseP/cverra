// translation/translation.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../../../tools/prisma/prisma.module';
import { ResumeTranslationController } from './resume-translation.controller';
import { ResumeTranslationService } from './resume-translation.service';
// import { TranslationQueueService } from './translation-queue.service';
// import { TranslationCacheService } from './translation-cache.service';
// import { TranslationWebhookService } from './translation-webhook.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 60000,
        maxRedirects: 5,
      }),
    }),
    PrismaModule,
  ],
  controllers: [ResumeTranslationController],
  providers: [
    ResumeTranslationService,
    // TranslationQueueService,
    // TranslationCacheService,
    // TranslationWebhookService,
  ],
  exports: [ResumeTranslationService],
})
export class ResumeTranslationModule {}