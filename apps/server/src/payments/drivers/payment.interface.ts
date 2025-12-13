export interface PaymentInitiationResult {
  provider: string;
  providerRef?: string;
  redirectUrl?: string;
  clientSecret?: string;
  meta?: any;
}

export interface IPaymentDriver {
  initiatePayment(payload: {
    userId: string;
    amount: number; // decimals handled by PaymentsService
    currency?: string;
    metadata?: any;
  }): Promise<PaymentInitiationResult>;

  verifyPayment(providerRef: string): Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING'; providerRef?: string; metadata?: any }>;

  // optional: verify webhook signature
  verifyWebhookSignature?(rawBody: string, headers: Record<string, string | string[] | undefined>): boolean;
}
