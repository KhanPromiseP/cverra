import { Controller, Post, Req, Res, Headers, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from '../payments.service';

@Controller('payments/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  
  constructor(private payments: PaymentsService) {}

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