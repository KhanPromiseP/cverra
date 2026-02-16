// import path from "node:path";
// import { Module } from '@nestjs/common';
// import { HttpModule } from '@nestjs/axios';
// import { APP_PIPE } from "@nestjs/core";
// import { ServeStaticModule } from "@nestjs/serve-static";
// import { ZodValidationPipe } from "nestjs-zod";

// import { AuthModule } from "./auth/auth.module";
// import { ConfigModule } from "./config/config.module";
// import { ContributorsModule } from "./contributors/contributors.module";
// import { DatabaseModule } from "./database/database.module";
// import { FeatureModule } from "./feature/feature.module";
// import { HealthModule } from "./health/health.module";
// import { MailModule } from "./mail/mail.module";
// import { PrinterModule } from "./printer/printer.module";
// import { ResumeModule } from "./resume/resume.module";
// import { StorageModule } from "./storage/storage.module";
// import { TranslationModule } from "./translation/translation.module";
// import { UserModule } from "./user/user.module";

// import { OpenAiController } from './controllers/openai.controller';
// import { CoverLetterModule } from './cover-letter/cover-letter.module';


// import { PrismaService } from './../../../tools/prisma/prisma.service';
// import { WalletModule } from './wallet/wallet.module';
// import { PaymentsModule } from '../src/payments/payments.module';
// import { SubscriptionsModule } from './payments/subscriptions/subscriptions.module';
// import { UsageModule } from './usage/usage.module';

// import { AdminModule } from './admin/admin.module';

// import { ArticleModule } from './articles/article.module';
// import { ResumeTranslationModule } from "./resume/resume-translation.module";




// @Module({
//   controllers: [OpenAiController], 

  
//   imports: [
//     HttpModule,
//     // Core Modules
//     ConfigModule,
//     DatabaseModule,
//     MailModule,
//     HealthModule,
//     AdminModule,

//     ResumeTranslationModule,

//   // Payments & Subscriptions
//     PaymentsModule,
//     SubscriptionsModule, 
//     WalletModule,
//     UsageModule,

//     // Feature Modules
//     AuthModule.register(),
//     UserModule,
//     ResumeModule,
//     StorageModule,
//     PrinterModule,
//     FeatureModule,
//     TranslationModule,
//     ContributorsModule,
    
//     // Cover Letter Module
//     CoverLetterModule,

//     // Article Module 
//     ArticleModule,

//     // Artboard static files
//     ServeStaticModule.forRoot({
//       serveRoot: "/artboard",
//       rootPath: path.join(__dirname, "..", "artboard"),
//     }),

//     // Client static files - serve for all non-API routes
//     ServeStaticModule.forRoot({
//       rootPath: path.join(__dirname, "..", "client"),
//       serveStaticOptions: {
//         index: false,
//       },
//       renderPath: /^(?!\/api).*/,
//     }),
//   ],
//   providers: [
//     PrismaService,
//     {
//       provide: APP_PIPE,
//       useClass: ZodValidationPipe,
//     },
//   ],
// })
// export class AppModule {}


import path from "node:path";
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'; // ADD MiddlewareConsumer
import { HttpModule } from '@nestjs/axios';
import { APP_PIPE } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ZodValidationPipe } from "nestjs-zod";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler'; // ADD THIS
import { APP_GUARD } from '@nestjs/core'; // ADD THIS

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
import { NotificationModule } from './notification/notification.module';
import { WelcomeModule } from './welcome/welcome.module';
import { ContactModule } from './contact/contact.module';
import { AssistantModule } from './assistant/assistant.module';

// ADD THESE NEW IMPORTS
import { RedisModule } from './redis/redis.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PremiumAssistantMiddleware } from './middleware/premium-assistant.middleware';

@Module({
  controllers: [OpenAiController], 
  
  imports: [
    // Core Infrastructure Modules - ADD THESE FIRST
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    ScheduleModule.forRoot(),
    
    // ADD Rate Limiting Module
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    
    // ADD Redis Module BEFORE other modules that depend on it
    RedisModule,
    
    ConfigModule,
    DatabaseModule,
    HttpModule,
    
    // Business Logic Modules
    AuthModule.register(),
    UserModule,
    AdminModule,
    MailModule,
    HealthModule,
    StorageModule,
    PrinterModule,
    FeatureModule,
    TranslationModule,
    ContributorsModule,
    
    // Content & Commerce Modules
    ResumeModule,
    ResumeTranslationModule,
    CoverLetterModule,
    ArticleModule,
    
    // Payments & Monetization Modules
    PaymentsModule,
    SubscriptionsModule,
    WalletModule,
    UsageModule,
    
    // Notification System Module
    NotificationModule,

    // bonus
    WelcomeModule,

    // contact
    ContactModule,

    // assistant - This module depends on Redis, so it should come after RedisModule
    AssistantModule,
    
    // Static File Serving (should be last)
    ServeStaticModule.forRoot({
      serveRoot: "/artboard",
      rootPath: path.join(__dirname, "..", "artboard"),
    }),
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
    // ADD Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule { // ADD implements NestModule
  configure(consumer: MiddlewareConsumer) {
    // Apply PremiumAssistantMiddleware to all assistant routes
    consumer
      .apply(PremiumAssistantMiddleware)
      .forRoutes('assistant'); // Apply to all /assistant/* routes
      
    //can also apply it more specifically:
    // .forRoutes(
    //   { path: 'assistant/message', method: RequestMethod.POST },
    //   { path: 'assistant/conversations', method: RequestMethod.GET },
    //   { path: 'assistant/memories', method: RequestMethod.GET },
    // );
  }
}