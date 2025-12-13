// src/payments/drivers/stripe.driver.ts
import { IPaymentDriver, PaymentInitiationResult } from './payment.interface';

// Dynamic import or require for Stripe
let Stripe: any;
try {
  Stripe = require('stripe').default;
} catch (error) {
  console.warn('Stripe package not installed');
}

export class StripeDriver implements IPaymentDriver {
  private stripe: any;
  private webhookSecret: string;

  constructor(opts: { apiKey: string; webhookSecret: string }) {
    if (!Stripe) {
      throw new Error('Stripe package is not installed. Please run: npm install stripe');
    }
    this.stripe = new Stripe(opts.apiKey, { apiVersion: '2023-10-16' });
    this.webhookSecret = opts.webhookSecret;
  }

  async initiatePayment(payload: {
    userId: string;
    amount: number;
    currency?: string;
    metadata?: any;
  }): Promise<PaymentInitiationResult> {
    const { userId, amount, currency = 'usd', metadata } = payload;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Subscription Payment',
              description: metadata?.description || 'Payment for subscription',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        ...metadata,
      },
    });

    return {
      provider: 'STRIPE',
      providerRef: session.id,
      redirectUrl: session.url,
      clientSecret: session.payment_intent as string,
      meta: session,
    };
  }

  async verifyPayment(providerRef: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    providerRef?: string;
    metadata?: any;
  }> {
    const session = await this.stripe.checkout.sessions.retrieve(providerRef, {
      expand: ['payment_intent'],
    });

    let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
    
    if (session.payment_status === 'paid') {
      status = 'SUCCESS';
    } else if (session.payment_status === 'unpaid' || session.status === 'expired') {
      status = 'FAILED';
    }

    return {
      status,
      providerRef,
      metadata: session,
    };
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>) {
    const signature = headers['stripe-signature'] as string;
    if (!signature) return false;

    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch (err) {
      return false;
    }
  }
}