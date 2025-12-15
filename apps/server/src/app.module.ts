import path from "node:path";
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_PIPE } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ZodValidationPipe } from "nestjs-zod";

import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config/config.module";
import { ContributorsModule } from "./contributors/contributors.module";
import { DatabaseModule } from "./database/database.module";
import { FeatureModule } from "./feature/feature.module";
import { HealthModule } from "./health/health.module";
import { MailModule } from "./mail/mail.module";
import { PrinterModule } from "./printer/printer.module";
import { ResumeModule } from "./resume/resume.module";
import { StorageModule } from "./storage/storage.module";
import { TranslationModule } from "./translation/translation.module";
import { UserModule } from "./user/user.module";

import { OpenAiController } from './controllers/openai.controller';
import { CoverLetterModule } from './cover-letter/cover-letter.module';


import { PrismaService } from './../../../tools/prisma/prisma.service';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { SubscriptionsModule } from './payments/subscriptions/subscriptions.module';
import { UsageModule } from './usage/usage.module';

import { AdminModule } from './admin/admin.module';

import { ArticleModule } from './articles/article.module';
import { ResumeTranslationModule } from "./resume/resume-translation.module";




@Module({
  controllers: [OpenAiController], 

  
  imports: [
    HttpModule,
    // Core Modules
    ConfigModule,
    DatabaseModule,
    MailModule,
    HealthModule,
    AdminModule,

    ResumeTranslationModule,

  // Payments & Subscriptions
    PaymentsModule,
    SubscriptionsModule, 
    WalletModule,
    UsageModule,

    // Feature Modules
    AuthModule.register(),
    UserModule,
    ResumeModule,
    StorageModule,
    PrinterModule,
    FeatureModule,
    TranslationModule,
    ContributorsModule,
    
    // Cover Letter Module
    CoverLetterModule,

    // Article Module 
    ArticleModule,

    // Artboard static files
    ServeStaticModule.forRoot({
      serveRoot: "/artboard",
      rootPath: path.join(__dirname, "..", "artboard"),
    }),

    // Client static files - serve for all non-API routes
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "..", "client"),
      serveStaticOptions: {
        index: false,
      },
      renderPath: /^(?!\/api).*/,
    }),
  ],
  providers: [
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}