import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Module({
  providers: [UsageService, PrismaService],
  exports: [UsageService],
})
export class UsageModule {}
