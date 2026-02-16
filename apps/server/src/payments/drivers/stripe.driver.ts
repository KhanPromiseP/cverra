// src/payments/drivers/stripe.driver.ts
import { IPaymentDriver, PaymentInitiationResult } from './payment.interface';

export class StripeDriver implements IPaymentDriver {
  private stripe: any;
  private webhookSecret: string;

  constructor(opts: { apiKey: string; webhookSecret: string }) {
    // Validate required configuration
    if (!opts.apiKey) {
      throw new Error('Stripe API key is required');
    }
    
    if (!opts.apiKey.startsWith('sk_live_') && !opts.apiKey.startsWith('sk_test_')) {
      throw new Error('Invalid Stripe API key format. Must start with sk_live_ or sk_test_');
    }

    if (!opts.webhookSecret) {
      console.warn('Stripe webhook secret is not configured. Webhook verification will fail.');
    }

    try {
      const Stripe = require('stripe').default;
      this.stripe = new Stripe(opts.apiKey, {
        apiVersion: '2026-01-28.clover',
        timeout: 30000,
        maxNetworkRetries: 2,
      });
      this.webhookSecret = opts.webhookSecret;
      
      console.log('Stripe driver initialized in', 
        opts.apiKey.startsWith('sk_live_') ? 'LIVE mode' : 'TEST mode');
    } catch (error) {
      console.error('Failed to initialize Stripe driver:', error);
      throw new Error('Stripe driver initialization failed');
    }
  }

  async initiatePayment(payload: {
    userId: string;
    amount: number;
    currency?: string;
    metadata?: any;
  }): Promise<PaymentInitiationResult> {
    const { userId, amount, currency = 'usd', metadata } = payload;

    // Validate amount
    if (amount < 0.5) {
      throw new Error('Stripe: Amount must be at least 0.50 USD');
    }

    // Get frontend URL - required for production
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL environment variable is required for Stripe payments');
    }

    console.log('Stripe payment initiation:', {
      userId,
      amount,
      currency,
      mode: this.stripe?.apiKey?.startsWith('sk_live_') ? 'LIVE' : 'TEST'
    });

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: metadata?.coins ? `${metadata.coins} Coins` : 'Coin Purchase',
                description: metadata?.description || 'Purchase coins for your account',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/payment/cancel`,
        client_reference_id: userId,
        metadata: {
          userId,
          type: metadata?.type || 'COIN_PURCHASE',
          coins: metadata?.coins?.toString() || Math.floor(amount * 10).toString(),
          ...metadata,
        },
        customer_email: metadata?.email || undefined,
      });

      console.log('Stripe session created:', {
        sessionId: session.id,
        url: session.url,
        payment_status: session.payment_status
      });

      if (!session.url) {
        throw new Error('Stripe did not return a redirect URL');
      }

      return {
        provider: 'STRIPE',
        providerRef: session.id,
        redirectUrl: session.url,
        clientSecret: session.payment_intent?.id || null,
        meta: {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          created: session.created
        }
      };
    } catch (error: any) {
      console.error('Stripe payment initiation failed:', {
        type: error.type,
        code: error.code,
        message: error.message,
        param: error.param,
        statusCode: error.statusCode
      });

      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async verifyPayment(providerRef: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    providerRef?: string;
    metadata?: any;
  }> {
    if (!providerRef) {
      throw new Error('Stripe session ID is required');
    }

    try {
      console.log('Verifying Stripe payment:', providerRef);

      const session = await this.stripe.checkout.sessions.retrieve(providerRef, {
        expand: ['payment_intent', 'payment_intent.payment_method'],
      });

      let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
      
      if (session.payment_status === 'paid') {
        status = 'SUCCESS';
      } else if (
        session.payment_status === 'unpaid' || 
        session.status === 'expired' || 
        session.status === 'complete'
      ) {
        status = 'FAILED';
      }

      // Extract payment method details
      const paymentMethodDetails = await this.extractPaymentMethod(session);

      return {
        status,
        providerRef,
        metadata: {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          payment_method: paymentMethodDetails,
          metadata: session.metadata
        },
      };
    } catch (error: any) {
      console.error('Stripe verification failed:', {
        providerRef,
        error: error.message
      });

      throw new Error(`Stripe verification failed: ${error.message}`);
    }
  }

  private async extractPaymentMethod(session: any) {
    try {
      if (!session.payment_intent) {
        return {
          displayName: 'Card',
          method: 'CARD',
        };
      }

      const paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent.id;

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.payment_method) {
        return {
          displayName: 'Card',
          method: 'CARD',
        };
      }

      const paymentMethodId = typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method.id;

      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.card) {
        return {
          displayName: `${paymentMethod.card.brand.toUpperCase()} ****${paymentMethod.card.last4}`,
          method: 'CARD',
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          country: paymentMethod.card.country,
          funding: paymentMethod.card.funding,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        };
      }

      if (paymentMethod.type === 'link') {
        return {
          displayName: 'Link',
          method: 'LINK',
          email: paymentMethod.link?.email
        };
      }

      return {
        displayName: 'Card',
        method: 'CARD',
      };
    } catch (error) {
      console.error('Failed to extract payment method:', error);
      return {
        displayName: 'Card',
        method: 'CARD',
      };
    }
  }

  verifyWebhookSignature(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ) {
    if (!this.webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    const signature = headers['stripe-signature'];
    if (!signature) {
      throw new Error('Missing Stripe signature header');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      console.log('Stripe webhook verified:', {
        type: event.type,
        id: event.id,
        created: event.created
      });

      return event;
    } catch (error: any) {
      console.error('Stripe webhook signature verification failed:', {
        message: error.message,
        type: error.type
      });
      throw new Error(`Stripe webhook verification failed: ${error.message}`);
    }
  }
}