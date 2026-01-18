// src/payments/drivers/stripe.driver.ts
import { IPaymentDriver, PaymentInitiationResult } from './payment.interface';

export class StripeDriver implements IPaymentDriver {
  private stripe: any;
  private webhookSecret: string;

  constructor(opts: { apiKey: string; webhookSecret: string }) {
    // Use dynamic import to avoid startup issues if Stripe not installed
    const Stripe = require('stripe').default;
    this.stripe = new Stripe(opts.apiKey, { 
      apiVersion: '2023-10-16',
      timeout: 10000 // Add timeout
    });
    this.webhookSecret = opts.webhookSecret;
  }

  async initiatePayment(payload: {
    userId: string;
    amount: number;
    currency?: string;
    metadata?: any;
  }): Promise<PaymentInitiationResult> {
    const { userId, amount, currency = 'usd', metadata } = payload;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: metadata?.description || 'Career Coins Purchase',
                description: metadata?.details || 'Virtual currency for career services',
              },
              unit_amount: Math.round(amount * 100),
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
          ...(metadata || {}),
        },
        // Add customer email if available
        customer_email: metadata?.email || undefined,
      });

      return {
        provider: 'STRIPE',
        providerRef: session.id,
        redirectUrl: session.url,
        clientSecret: session.payment_intent,
        meta: session,
      };
    } catch (error) {
      console.error('Stripe payment initiation failed:', error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  async verifyPayment(providerRef: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    providerRef?: string;
    metadata?: any;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(providerRef, {
        expand: ['payment_intent'],
      });

      let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
      
      if (session.payment_status === 'paid') {
        status = 'SUCCESS';
      } else if (session.payment_status === 'unpaid' || session.status === 'expired') {
        status = 'FAILED';
      }

      // Extract payment method details
      const paymentMethodDetails = await this.extractPaymentMethod(session);

      return {
        status,
        providerRef,
        metadata: {
          ...session,
          paymentMethod: paymentMethodDetails
        },
      };
    } catch (error) {
      console.error('Stripe verification failed:', error);
      throw new Error(`Stripe verification error: ${error.message}`);
    }
  }

  private async extractPaymentMethod(session: any) {
    try {
      if (session.payment_intent) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id
        );
        
        if (paymentIntent.payment_method) {
          const paymentMethod = await this.stripe.paymentMethods.retrieve(
            paymentIntent.payment_method
          );
          
          if (paymentMethod.card) {
            return {
              displayName: `${paymentMethod.card.brand.toUpperCase()} ****${paymentMethod.card.last4}`,
              method: 'CARD',
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              country: paymentMethod.card.country,
            };
          }
        }
      }
      
      return {
        displayName: 'Credit/Debit Card',
        method: 'CARD',
      };
    } catch (error) {
      return {
        displayName: 'Credit/Debit Card',
        method: 'CARD',
      };
    }
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>) {
    const signature = headers['stripe-signature'] as string;
    if (!signature) {
      console.warn('Missing Stripe signature header');
      return false;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody, 
        signature, 
        this.webhookSecret
      );
      return !!event;
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return false;
    }
  }
}