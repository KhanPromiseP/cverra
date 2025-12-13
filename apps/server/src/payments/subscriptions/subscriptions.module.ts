
import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AdminSubscriptionService } from './admin-subscription.service';
import { AdminSubscriptionController } from './admin-subscription.controller';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { PaymentsModule } from '../payments.module';

@Module({
  imports: [PaymentsModule],
  providers: [SubscriptionsService, AdminSubscriptionService, PrismaService],
  controllers: [SubscriptionsController, AdminSubscriptionController],
  exports: [SubscriptionsService, AdminSubscriptionService],
})
export class SubscriptionsModule {}