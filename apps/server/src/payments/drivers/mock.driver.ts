// src/payments/drivers/mock.driver.ts
import { IPaymentDriver, PaymentInitiationResult } from './payment.interface';

export class MockDriver implements IPaymentDriver {
  async initiatePayment(payload: {
    userId: string;
    amount: number;
    currency?: string;
    metadata?: any;
  }): Promise<PaymentInitiationResult> {
    return {
      provider: 'MOCK',
      providerRef: `mock-${Date.now()}`,
      redirectUrl: undefined,
      clientSecret: undefined,
      meta: { mock: true },
    };
  }

  // Fix: ensure status is one of the allowed literal types
  async verifyPayment(providerRef: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    providerRef?: string;
    metadata?: any;
  }> {
    // Example: randomly simulate success or failure
    const statuses: ('SUCCESS' | 'FAILED' | 'PENDING')[] = ['SUCCESS', 'FAILED', 'PENDING'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      status, // ✅ now matches the literal type
      providerRef,
      metadata: { mock: true },
    };
  }
}
