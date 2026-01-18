// src/payments/payments.service.ts
import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { IPaymentDriver } from './drivers/payment.interface';
import { MockDriver } from './drivers/mock.driver';
import { TranzakDriver } from './drivers/tranzak.driver';
import { StripeDriver } from './drivers/stripe.driver';
import { Prisma, TransactionType, SubscriptionStatus, PaymentStatus } from '@prisma/client';


@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private drivers: Record<string, IPaymentDriver> = {};

  constructor(
    private prisma: PrismaService,
  ) {
    this.initializeDrivers();
  }

  private initializeDrivers() {
    // Always initialize MOCK driver (for testing)
    this.drivers['MOCK'] = new MockDriver();
    
    // Initialize Tranzak driver
    if (process.env.TRANZAK_APP_ID && process.env.TRANZAK_APP_KEY) {
      try {
        this.drivers['TRANZAK'] = new TranzakDriver({
          appId: process.env.TRANZAK_APP_ID,
          appKey: process.env.TRANZAK_APP_KEY,
          baseUrl: process.env.TRANZAK_BASE_URL || 'https://api.tranzak.com',
          callbackUrl: process.env.TRANZAK_CALLBACK_URL || `${process.env.APP_URL}/payments/callback`,
          webhookSecret: process.env.TRANZAK_WEBHOOK_SECRET,
        });
        this.logger.log('Tranzak driver initialized');
      } catch (error) {
        this.logger.warn('Tranzak driver initialization failed:', error);
      }
    }
    
    // Initialize Stripe driver with better error handling
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Check if Stripe package is installed
        try {
          require('stripe');
        } catch (e) {
          this.logger.error('Stripe package not installed. Run: npm install stripe');
          throw new Error('Stripe package not installed');
        }
        
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          this.logger.warn('STRIPE_WEBHOOK_SECRET not set. Webhook verification will fail.');
        }
        
        this.drivers['STRIPE'] = new StripeDriver({
          apiKey: process.env.STRIPE_SECRET_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        });
        this.logger.log('Stripe driver initialized successfully');
      } catch (error) {
        this.logger.error('Stripe driver initialization failed:', error);
        // Don't fail the entire app if Stripe fails
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not found. Stripe payments disabled.');
    }
    
    this.logger.log(`Available payment drivers: ${Object.keys(this.drivers).join(', ')}`);
  }


  private getDriver(provider: string): IPaymentDriver {
    const normalizedProvider = provider.toUpperCase();
    const driver = this.drivers[normalizedProvider];
    
    if (!driver) {
      const availableDrivers = Object.keys(this.drivers).join(', ');
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}. Available providers: ${availableDrivers}`
      );
    }
    
    return driver;
  }

  async initiate({
    userId,
    amount,
    provider = 'MOCK',
    currency = process.env.DEFAULT_CURRENCY || 'USD',
    metadata,
  }: {
    userId: string;
    amount: number;
    provider?: string;
    currency?: string;
    metadata?: any;
  }) {
    const driver = this.getDriver(provider);
    
    // Log payment initiation
    this.logger.log(`Initiating payment: ${provider}, amount: ${amount}, currency: ${currency}, user: ${userId}`);

    const initiation = await driver.initiatePayment({ userId, amount, currency, metadata });

    const record = await this.prisma.payment.create({
      data: {
        userId,
        provider: provider.toUpperCase() as any,
        providerRef: initiation.providerRef,
        amount: new Prisma.Decimal(amount),
        currency,
        status: PaymentStatus.PENDING,
        metadata: initiation.meta || metadata || {},
      },
    });

    this.logger.log(`Payment record created: ${record.id}`);

    return { payment: record, initiation };
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.userId !== userId)
      throw new BadRequestException('Payment not found');
    return payment;
  }
  
  async verify(provider: string, providerRef: string) {
  // STEP 1: Check payment status WITHOUT transaction first
  const existingPayment = await this.prisma.payment.findFirst({ 
    where: { providerRef }
  });

  // If payment already succeeded, return immediately
  if (existingPayment?.status === PaymentStatus.SUCCESS) {
    this.logger.log(`Payment ${providerRef} already processed, skipping duplicate`);
    return { 
      status: 'SUCCESS',
      paymentId: existingPayment.id,
      amount: existingPayment.amount,
      coinsGranted: existingPayment.coinsGranted,
      transactionId: providerRef,
      message: 'Payment already processed successfully'
    };
  }

  // STEP 2: Make external API call OUTSIDE transaction
  const driver = this.getDriver(provider);
  const result = await driver.verifyPayment(providerRef);

  // STEP 3: Only use transaction for database operations
  return await this.prisma.$transaction(async (tx) => {
    // Re-check payment status inside transaction (for race conditions)
    const currentPayment = await tx.payment.findFirst({
      where: { providerRef },
      include: { 
        userSubscription: {
          include: {
            plan: true
          }
        }
      }
    });
    
    if (!currentPayment) throw new BadRequestException('Payment record not found');

    // Check again if already processed (race condition protection)
    if (currentPayment.status === PaymentStatus.SUCCESS) {
      this.logger.log(`Payment ${providerRef} already processed in transaction`);
      return {
        status: 'SUCCESS',
        paymentId: currentPayment.id,
        amount: currentPayment.amount,
        coinsGranted: currentPayment.coinsGranted,
        transactionId: providerRef,
        message: 'Payment already processed'
      };
    }

    // If already processing, return pending
    if (currentPayment.status === PaymentStatus.PROCESSING) {
      this.logger.log(`Payment ${providerRef} is being processed by another request`);
      return {
        status: 'PENDING', 
        message: 'Payment processing in progress...'
      };
    }

    // Mark as processing to prevent other requests
    await tx.payment.update({
      where: { id: currentPayment.id },
      data: { status: PaymentStatus.PROCESSING }
    });

    if (result.status === PaymentStatus.SUCCESS) {
      let coins = 0;
      
      if (currentPayment.userSubscription) {
        coins = currentPayment.userSubscription.plan.coins;
      } else {
        const coinsPerDollar = 10;
        coins = Math.round(Number(currentPayment.amount) * coinsPerDollar);
      }
      
      // Check if coins were already granted (final safety check)
      const walletTransactions = await tx.walletTransaction.count({
        where: {
          userId: currentPayment.userId,
          metadata: {
            path: ['paymentId'],
            equals: currentPayment.id
          }
        }
      });

      if (walletTransactions > 0) {
        this.logger.warn(`Payment ${currentPayment.id} already has ${walletTransactions} wallet transactions, skipping coin grant`);
        
        // Still update payment status
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: { status: PaymentStatus.SUCCESS }
        });

        return {
          status: 'SUCCESS',
          paymentId: currentPayment.id,
          amount: currentPayment.amount,
          coinsGranted: currentPayment.coinsGranted,
          transactionId: providerRef,
          message: 'Payment already processed (duplicate prevented)'
        };
      }

      // Process the payment
      if (currentPayment.userSubscription) {
        const wallet = await tx.wallet.upsert({
          where: { userId: currentPayment.userId },
          update: { balance: { increment: coins } },
          create: { userId: currentPayment.userId, balance: coins },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: currentPayment.userId,
            amount: coins,
            type: 'CREDIT' as TransactionType,
            source: 'SUBSCRIPTION',
            description: `Subscription: ${currentPayment.userSubscription.plan.name} - ${coins} coins`,
            metadata: { 
              paymentId: currentPayment.id,
              subscriptionId: currentPayment.userSubscription.id,
              planId: currentPayment.userSubscription.plan.id,
              provider: currentPayment.provider,
              processedAt: new Date().toISOString(),
              idempotencyKey: providerRef
            },
          },
        });

        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            coinsGranted: coins,
            metadata: {
              ...(typeof currentPayment.metadata === 'object' && currentPayment.metadata !== null ? currentPayment.metadata : {}),
              verify: result.metadata,
              processedAt: new Date().toISOString(),
              processedBy: 'verify'
            },
          },
        });

        // Activate subscription outside transaction if it takes too long
        await this.activateSubscriptionPayment(currentPayment.id, coins, provider, result.metadata);
        
      } else {
        // One-time purchase logic
        const wallet = await tx.wallet.upsert({
          where: { userId: currentPayment.userId },
          update: { balance: { increment: coins } },
          create: { userId: currentPayment.userId, balance: coins },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: currentPayment.userId,
            amount: coins,
            type: 'CREDIT' as TransactionType,
            source: 'ONE_TIME_PURCHASE',
            description: `Coin purchase: ${coins} coins for $${currentPayment.amount}`,
            metadata: { 
              paymentId: currentPayment.id,
              provider: currentPayment.provider,
              processedAt: new Date().toISOString(),
              idempotencyKey: providerRef
            },
          },
        });

        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            coinsGranted: coins,
            metadata: {
              ...(typeof currentPayment.metadata === 'object' && currentPayment.metadata !== null ? currentPayment.metadata : {}),
              verify: result.metadata,
              processedAt: new Date().toISOString(),
              processedBy: 'verify'
            },
          },
        });
      }
      
      this.logger.log(`Payment ${providerRef} processed successfully: ${coins} coins granted`);
      
      return { 
        status: 'SUCCESS',
        paymentId: currentPayment.id,
        amount: currentPayment.amount,
        coinsGranted: coins,
        transactionId: providerRef,
        message: currentPayment.userSubscription ? 'Subscription activated successfully' : 'Payment completed successfully'
      };
      
    } else if (result.status === PaymentStatus.FAILED) {
      await tx.payment.update({
        where: { id: currentPayment.id },
        data: { 
          status: PaymentStatus.FAILED,
          metadata: {
            ...(typeof currentPayment.metadata === 'object' && currentPayment.metadata !== null ? currentPayment.metadata : {}),
            verify: result.metadata,
          },
        },
      });
      
      return { 
        status: 'FAILED',
        message: 'Payment failed',
        transactionId: providerRef
      };
      
    } else {
      // Reset processing status if still pending
      await tx.payment.update({
        where: { id: currentPayment.id },
        data: { status: PaymentStatus.PENDING }
      });
      
      return { 
        status: 'PENDING',
        message: 'Payment is being processed...',
        transactionId: providerRef
      };
    }
  }, {
    // Increase transaction timeout
    timeout: 30000, // 30 seconds
    maxWait: 10000  // 10 seconds max wait
  });
}

      async handleWebhook(provider: string, providerRef: string | undefined, payload: any) {
      if (!providerRef) throw new BadRequestException('Missing providerRef in webhook');

      return await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({ 
          where: { providerRef },
          include: { userSubscription: true }
        });
        
        if (!payment) {
          this.logger.warn(`Webhook for unknown providerRef: ${providerRef}`);
          throw new BadRequestException('Unknown payment record');
        }

        // Check if already processed
        if (payment.status === PaymentStatus.SUCCESS) {
          this.logger.log(`Webhook: Payment ${providerRef} already processed, skipping`);
          return { ok: true, message: 'already_processed' };
        }

        // Check if processing
        if (payment.status === PaymentStatus.PROCESSING) {
          this.logger.log(`Webhook: Payment ${providerRef} is being processed, skipping`);
          return { ok: true, message: 'processing_in_progress' };
        }

        // Mark as processing
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PROCESSING }
        });

        const rawStatus = payload?.status || payload?.state || payload?.transaction_status || '';
        const normalized = /success/i.test(rawStatus) ? PaymentStatus.SUCCESS : 
                          /fail/i.test(rawStatus) ? PaymentStatus.FAILED : 
                          PaymentStatus.PENDING;

        if (normalized === PaymentStatus.SUCCESS) {
          // Check for existing wallet transactions
          const existingTransactions = await tx.walletTransaction.count({
            where: {
              userId: payment.userId,
              metadata: {
                path: ['paymentId'],
                equals: payment.id
              }
            }
          });

          if (existingTransactions > 0) {
            this.logger.warn(`Webhook: Payment ${payment.id} already has transactions, skipping`);
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.SUCCESS }
            });
            return { ok: true, message: 'already_processed' };
          }

          let coins = 0;
          
          if (payment.userSubscription) {
            const subscriptionWithPlan = await tx.userSubscription.findUnique({
              where: { id: payment.userSubscription.id },
              include: { plan: true }
            });
            coins = subscriptionWithPlan?.plan.coins || 0;
          } else {
            const coinsPerDollar = 10;
            coins = Math.round(Number(payment.amount) * coinsPerDollar);
          }

          // Process payment (your existing webhook logic)
          if (payment.userSubscription) {
            await this.activateSubscriptionPayment(payment.id, coins, provider, payload);
          } else {
            const wallet = await tx.wallet.upsert({
              where: { userId: payment.userId },
              update: { balance: { increment: coins } },
              create: { userId: payment.userId, balance: coins },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId: payment.userId,
                amount: coins,
                type: 'CREDIT' as TransactionType,
                source: 'ONE_TIME_PURCHASE',
                description: `Webhook ${provider}`,
                metadata: { 
                  providerPayload: payload,
                  provider: provider,
                  paymentId: payment.id,
                  processedAt: new Date().toISOString(),
                  processedBy: 'webhook',
                  idempotencyKey: providerRef
                },
              },
            });

            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.SUCCESS,
                coinsGranted: coins,
                metadata: {
                  ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
                  webhook: payload,
                  processedAt: new Date().toISOString(),
                  processedBy: 'webhook'
                },
              },
            });
          }
          
          this.logger.log(`Webhook processed: ${providerRef}, ${coins} coins granted`);
        } else if (normalized === PaymentStatus.FAILED) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              metadata: {
                ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
                webhook: payload,
              },
            },
          });
        } else {
          // Reset to pending if webhook says pending
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.PENDING }
          });
        }

        return { ok: true };
      });
    }

    private async activateSubscriptionPayment(paymentId: string, coins: number, provider: string, payload: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get payment with subscription details
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            userSubscription: {
              include: { plan: true }
            }
          }
        });

        if (!payment || !payment.userSubscription) {
          throw new NotFoundException('Payment or subscription not found');
        }

        const { userSubscription, userSubscription: { plan } } = payment;

        // Use the plan's coin amount directly
        const subscriptionCoins = plan.coins;

        // Activate subscription
        await tx.userSubscription.update({
          where: { id: userSubscription.id },
          data: { 
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: plan.interval === 'MONTHLY' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
        });

        this.logger.log(`Subscription activated: ${userSubscription.id}, ${subscriptionCoins} coins granted`);
      }, {
        timeout: 15000, // 15 seconds for subscription activation
        maxWait: 5000
      });
    } catch (error) {
      this.logger.error(`Failed to activate subscription for payment ${paymentId}:`, error);
      // Don't throw - the payment is already successful, this is just subscription activation
    }
  }
}