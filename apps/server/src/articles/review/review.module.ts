// src/review/review.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../../tools/prisma/prisma.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService]
})
export class ReviewModule {}