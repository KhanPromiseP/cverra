
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { PaymentsWebhookController } from './webhooks/payments.webhook.controller';

@Module({
  providers: [PaymentsService, InvoiceService, PrismaService],
  controllers: [PaymentsController, PaymentsWebhookController],
  exports: [PaymentsService, InvoiceService],
})
export class PaymentsModule {}