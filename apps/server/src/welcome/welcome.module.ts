// src/welcome/welcome.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { ScheduleModule } from '@nestjs/schedule';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule, 
    ScheduleModule.forRoot(),
    NotificationModule
  ],
  controllers: [WelcomeController],
  providers: [WelcomeService],
  exports: [WelcomeService],
})
export class WelcomeModule {}