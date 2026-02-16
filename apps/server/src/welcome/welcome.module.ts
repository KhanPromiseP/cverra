// src/welcome/welcome.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { ScheduleModule } from '@nestjs/schedule';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';
import { NotificationModule } from '../notification/notification.module';
import { I18nService } from '../i18n/i18n.service';
import { UserModule } from '../user/user.module'; 

@Module({
  imports: [
    PrismaModule, 
    ScheduleModule.forRoot(),
    NotificationModule,
    UserModule
  ],
  controllers: [WelcomeController],
  providers: [WelcomeService, I18nService,],
  exports: [WelcomeService],
})
export class WelcomeModule {}