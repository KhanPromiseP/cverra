// src/payments/webhooks/payments.webhook.controller.ts
import { Controller, Post, Req, Res, Headers, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from '../payments.service';

@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);
  constructor(private payments: PaymentsService) {}

  @Post('tranzak')
  async tranzak(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const payload = req.body;

      // OPTIONAL: verify signature using registered driver
      const driver = (this.payments as any).getDriver?.('TRANZAK');
      if (driver && typeof driver.verifyWebhookSignature === 'function') {
        const ok = driver.verifyWebhookSignature(rawBody, headers);
        if (!ok) {
          this.logger.warn('Invalid tranzak webhook signature');
          return res.status(400).send('Invalid signature');
        }
      }

      const providerRef = payload.reference || payload.transaction_id || payload.id;
      await this.payments.handleWebhook('TRANZAK', providerRef, payload);

      return res.status(200).json({ ok: true });
    } catch (err) {
      this.logger.error('Tranzak webhook processing error', err);
      return res.status(500).send('error');
    }
  }

  @Post('stripe')
  async stripe(@Req() req: Request, @Res() res: Response, @Headers() headers: any) {
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const payload = req.body;
      const sig = headers['stripe-signature'];

      // Verify signature using Stripe driver
      const driver = (this.payments as any).getDriver?.('STRIPE');
      if (driver && typeof driver.verifyWebhookSignature === 'function') {
        const ok = driver.verifyWebhookSignature(rawBody, { 'stripe-signature': sig });
        if (!ok) {
          this.logger.warn('Invalid Stripe webhook signature');
          return res.status(400).send('Invalid signature');
        }
      }

      const event = payload;
      const providerRef = event.data?.object?.id;

      await this.payments.handleWebhook('STRIPE', providerRef, event);

      return res.status(200).json({ received: true });
    } catch (err) {
      this.logger.error('Stripe webhook error', err);
      return res.status(500).send('Webhook error');
    }
  }
}