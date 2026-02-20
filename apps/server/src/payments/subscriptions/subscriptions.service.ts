// src/payments/subscriptions/subscriptions.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { addMonths, addYears, isAfter } from 'date-fns';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}
  

  async getPlans() {
    this.logger.log('Fetching active subscription plans');
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          coins: true,
          price: true,
          interval: true,
          features: true,
        },
      });
      this.logger.log(`Found ${plans.length} active subscription plans`);
      return plans;
    } catch (error) {
      this.logger.error('Failed to fetch subscription plans', error);
      throw error;
    }
  }

  async getUserSubscription(userId: string) {
    this.logger.log(`Fetching active subscription for user: ${userId}`);
    try {
      const subscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId, 
          status: 'ACTIVE' as any, // Use type assertion
          currentPeriodEnd: { gt: new Date() }
        },
        include: {
          plan: true,
        },
      });
      
      if (subscription) {
        this.logger.log(`Found active subscription for user ${userId}: ${subscription.id}`);
      } else {
        this.logger.log(`No active subscription found for user ${userId}`);
      }
      
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to fetch subscription for user ${userId}`, error);
      throw error;
    }
  }

  async subscribe(userId: string, planId: string, provider: string) {
    this.logger.log(`Starting subscription process for user ${userId}, plan ${planId}, provider ${provider}`);
    
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({ 
        where: { id: planId, isActive: true } 
      });
      
      if (!plan) {
        this.logger.warn(`Subscription plan not found or inactive: ${planId}`);
        throw new NotFoundException('Subscription plan not found');
      }

      this.logger.log(`Found plan: ${plan.name} (${plan.interval}) for ${plan.price}`);

      // Check if user already has an active subscription
      const existingSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId, 
          planId  // Check for any subscription with this plan
        },
      });
      
      // const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription) {
        this.logger.warn(`User ${userId} already has active subscription: ${existingSubscription.id}`);
        throw new BadRequestException('You already have an active subscription. Please cancel it first.');
      }

      // Calculate subscription period
      const now = new Date();
      const currentPeriodStart = now;
      const currentPeriodEnd = plan.interval === 'MONTHLY' 
        ? addMonths(now, 1)
        : addYears(now, 1);

      this.logger.log(`Subscription period: ${currentPeriodStart} to ${currentPeriodEnd}`);

      // Use PaymentsService to initiate payment
      const paymentResult = await this.payments.initiate({
        userId,
        amount: Number(plan.price),
        provider,
        currency: 'USD',
        metadata: { 
          planId, 
          type: 'SUBSCRIPTION',
          interval: plan.interval,
          coins: plan.coins
        },
      });

      this.logger.log(`Payment initiated: ${paymentResult.payment.id}`);

      // Create subscription record (initially inactive)
      const subscription = await this.prisma.userSubscription.create({
        data: {
          userId,
          planId,
          status: 'PENDING' as any, // Use type assertion
          currentPeriodStart,
          amount: 0,
          // currentPeriodEnd,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
        },
      });

      this.logger.log(`Subscription record created: ${subscription.id}`);

      // Link payment to subscription
      await this.prisma.payment.update({
        where: { id: paymentResult.payment.id },
        data: { 
          subscriptionId: subscription.id,
          metadata: {
            ...(paymentResult.payment.metadata as Record<string, any>),
            subscriptionId: subscription.id,
            planName: plan.name,
            interval: plan.interval
          }
        },
      });

      this.logger.log(`Payment ${paymentResult.payment.id} linked to subscription ${subscription.id}`);

      // If there's a redirect URL, return it for frontend redirection
      if (paymentResult.initiation.redirectUrl) {
        this.logger.log(`Redirect required for payment ${paymentResult.payment.id}`);
        return {
          status: 'redirect_required',
          redirectUrl: paymentResult.initiation.redirectUrl,
          paymentId: paymentResult.payment.id,
          subscriptionId: subscription.id,
        };
      }

      // For providers that don't require redirect (like MOCK), process immediately
      if (paymentResult.initiation.provider === 'MOCK') {
        this.logger.log(`Processing MOCK payment immediately for ${paymentResult.payment.id}`);
        await this.processSuccessfulSubscription(paymentResult.payment.id);
        return { 
          status: 'success', 
          coinsGranted: plan.coins,
          subscriptionId: subscription.id,
          plan: plan.name
        };
      }

      this.logger.log(`Subscription pending payment verification: ${subscription.id}`);
      return { 
        status: 'pending', 
        paymentId: paymentResult.payment.id,
        subscriptionId: subscription.id 
      };

    } catch (error) {
      this.logger.error(`Subscription failed for user ${userId}, plan ${planId}`, error);
      throw error;
    }
  }

//   async processSuccessfulSubscription(paymentId: string) {
//   this.logger.log(`Processing successful subscription for payment: ${paymentId}`);
  
//   return await this.prisma.$transaction(async (tx) => {
//     // Get payment with subscription details
//     const payment = await tx.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         userSubscription: {
//           include: { plan: true }
//         }
//       }
//     });

//     if (!payment || !payment.userSubscription) {
//       this.logger.error(`Payment or subscription not found for payment ID: ${paymentId}`);
//       throw new NotFoundException('Payment or subscription not found');
//     }

//     const { userSubscription, userSubscription: { plan } } = payment;

//     this.logger.log(`Activating subscription ${userSubscription.id} for user ${payment.userId}`);

//     // Update wallet with subscription coins
//     const wallet = await tx.wallet.upsert({
//       where: { userId: payment.userId },
//       update: { balance: { increment: plan.coins } },
//       create: { userId: payment.userId, balance: plan.coins },
//     });

//     this.logger.log(`Wallet updated for user ${payment.userId}, new balance: ${wallet.balance}`);

//     // Create wallet transaction WITH SOURCE FIELD
//     await tx.walletTransaction.create({
//       data: {
//         walletId: wallet.id,
//         userId: payment.userId,
//         amount: plan.coins,
//         type: 'CREDIT',
//         source: 'SUBSCRIPTION', // ADD THIS LINE
//         description: `Subscription: ${plan.name} (${plan.interval})`,
//         metadata: { 
//           planId: plan.id, 
//           paymentId: payment.id,
//           subscriptionId: userSubscription.id,
//           interval: plan.interval
//         },
//       },
//     });

//     this.logger.log(`Wallet transaction created for ${plan.coins} coins`);

//     // Calculate new period dates
//     const newPeriodStart = new Date();
//     const newPeriodEnd = plan.interval === 'MONTHLY' 
//       ? addMonths(newPeriodStart, 1)
//       : addYears(newPeriodStart, 1);

//     // Activate subscription
//     await tx.userSubscription.update({
//       where: { id: userSubscription.id },
//       data: { 
//         status: 'ACTIVE' as any, // Use type assertion
//         currentPeriodStart: newPeriodStart,
//         currentPeriodEnd: newPeriodEnd
//       },
//     });

//     this.logger.log(`Subscription activated: ${userSubscription.id}, period: ${newPeriodStart} to ${newPeriodEnd}`);

//     // Update payment status
//     await tx.payment.update({
//       where: { id: paymentId },
//       data: { 
//         status: 'SUCCESS', 
//         coinsGranted: plan.coins 
//       },
//     });

//     this.logger.log(`Payment ${paymentId} marked as SUCCESS`);

//     return {
//       subscriptionId: userSubscription.id,
//       coinsGranted: plan.coins,
//       periodEnd: newPeriodEnd
//     };
//   });
// }



  async cancelSubscription(userId: string, subscriptionId: string) {
    this.logger.log(`Canceling subscription ${subscriptionId} for user ${userId}`);
    
    try {
      const subscription = await this.prisma.userSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });
      
      if (!subscription || subscription.userId !== userId) {
        this.logger.warn(`Subscription not found or access denied: ${subscriptionId} for user ${userId}`);
        throw new NotFoundException('Subscription not found');
      }

      // Use string literal with type assertion
      if (subscription.status !== 'ACTIVE') {
        this.logger.warn(`Cannot cancel non-active subscription: ${subscriptionId} with status ${subscription.status}`);
        throw new BadRequestException('Only active subscriptions can be canceled');
      }

      // Set to cancel at period end (soft cancel)
      // Use string literals with type assertions
      const newStatus = isAfter(new Date(), subscription.currentPeriodEnd) 
        ? 'EXPIRED' as any 
        : 'ACTIVE' as any;
      
      await this.prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: { 
          cancelAtPeriodEnd: true,
          status: newStatus
        },
      });

      this.logger.log(`Subscription ${subscriptionId} set to cancel at period end. New status: ${newStatus}`);

      return { 
        status: 'canceled',
        message: 'Subscription will be canceled at the end of the current billing period',
        periodEnd: subscription.currentPeriodEnd
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription ${subscriptionId} for user ${userId}`, error);
      throw error;
    }
  }

//   async handleSubscriptionRenewal(subscriptionId: string) {
//   this.logger.log(`Processing subscription renewal for: ${subscriptionId}`);
  
//   try {
//     const subscription = await this.prisma.userSubscription.findUnique({
//       where: { id: subscriptionId },
//       include: { plan: true }
//     });

//     // Use string literal with type assertion
//     if (!subscription || subscription.status !== 'ACTIVE') {
//       this.logger.warn(`Active subscription not found for renewal: ${subscriptionId}`);
//       throw new NotFoundException('Active subscription not found');
//     }

//     // Check if it's time to renew
//     if (isAfter(new Date(), subscription.currentPeriodEnd)) {
//       this.logger.log(`Subscription ${subscriptionId} is due for renewal`);

//       if (subscription.cancelAtPeriodEnd) {
//         // Cancel the subscription
//         await this.prisma.userSubscription.update({
//           where: { id: subscriptionId },
//           data: { status: 'EXPIRED' as any } // Use type assertion
//         });
        
//         this.logger.log(`Subscription ${subscriptionId} expired due to cancellation`);
//         return { status: 'expired' };
//       } else {
//         // Renew the subscription
//         const newPeriodEnd = subscription.plan.interval === 'MONTHLY'
//           ? addMonths(subscription.currentPeriodEnd, 1)
//           : addYears(subscription.currentPeriodEnd, 1);

//         await this.prisma.userSubscription.update({
//           where: { id: subscriptionId },
//           data: {
//             currentPeriodStart: subscription.currentPeriodEnd,
//             currentPeriodEnd: newPeriodEnd,
//           }
//         });

//         this.logger.log(`Subscription ${subscriptionId} renewed, new period end: ${newPeriodEnd}`);

//         // Add coins for new period
//         const wallet = await this.prisma.wallet.upsert({
//           where: { userId: subscription.userId },
//           update: { balance: { increment: subscription.plan.coins } },
//           create: { userId: subscription.userId, balance: subscription.plan.coins },
//         });

//         await this.prisma.walletTransaction.create({
//           data: {
//             walletId: wallet.id,
//             userId: subscription.userId,
//             amount: subscription.plan.coins,
//             type: 'CREDIT',
//             source: 'SUBSCRIPTION', // ADD THIS LINE
//             description: `Subscription renewal: ${subscription.plan.name}`,
//             metadata: { 
//               subscriptionId: subscription.id,
//               planId: subscription.plan.id
//             },
//           },
//         });

//         this.logger.log(`Added ${subscription.plan.coins} coins to user ${subscription.userId} for renewal`);

//         return { 
//           status: 'renewed', 
//           coinsGranted: subscription.plan.coins,
//           periodEnd: newPeriodEnd 
//         };
//       }
//     }

//     this.logger.log(`Subscription ${subscriptionId} not due for renewal yet`);
//     return { status: 'not_due' };
//   } catch (error) {
//     this.logger.error(`Failed to process renewal for subscription ${subscriptionId}`, error);
//     throw error;
//   }
// }


async processSuccessfulSubscription(paymentId: string) {
  this.logger.log(`Processing successful subscription for payment: ${paymentId}`);
  
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
      this.logger.error(`Payment or subscription not found for payment ID: ${paymentId}`);
      throw new NotFoundException('Payment or subscription not found');
    }

    const { userSubscription, userSubscription: { plan } } = payment;

    this.logger.log(`Activating subscription ${userSubscription.id} for user ${payment.userId}`);

    // Update wallet with subscription coins
    const wallet = await tx.wallet.upsert({
      where: { userId: payment.userId },
      update: { balance: { increment: plan.coins } },
      create: { userId: payment.userId, balance: plan.coins },
    });

    this.logger.log(`Wallet updated for user ${payment.userId}, new balance: ${wallet.balance}`);

    // Create wallet transaction WITH SOURCE FIELD
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: payment.userId,
        amount: plan.coins,
        type: 'CREDIT',
        source: 'SUBSCRIPTION',
        description: `Subscription: ${plan.name} (${plan.interval})`,
        metadata: { 
          planId: plan.id, 
          paymentId: payment.id,
          subscriptionId: userSubscription.id,
          interval: plan.interval
        },
      },
    });

    this.logger.log(`Wallet transaction created for ${plan.coins} coins`);

    // Calculate new period dates
    const newPeriodStart = new Date();
    const newPeriodEnd = plan.interval === 'MONTHLY' 
      ? addMonths(newPeriodStart, 1)
      : addYears(newPeriodStart, 1);

    // Activate subscription
    await tx.userSubscription.update({
      where: { id: userSubscription.id },
      data: { 
        status: 'ACTIVE' as any,
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd
      },
    });

    this.logger.log(`Subscription activated: ${userSubscription.id}, period: ${newPeriodStart} to ${newPeriodEnd}`);

    // ========== GRANT PREMIUM ACCESS TO ALL ARTICLES ==========
    // Get ALL premium articles (not just published ones for admin? Check your requirements)
    const premiumArticles = await tx.article.findMany({
      where: { 
        accessType: 'PREMIUM',
        // You might want to include all premium articles, not just published
        // status: 'PUBLISHED' // Comment this out if you want to grant access to all
      },
      select: { id: true }
    });

    this.logger.log(`Found ${premiumArticles.length} premium articles to grant access to`);

    // Delete any existing premium access records for this user (cleanup)
    const deleted = await tx.premiumAccess.deleteMany({
      where: { 
        userId: payment.userId,
        articleId: { in: premiumArticles.map(a => a.id) }
      }
    });
    
    if (deleted.count > 0) {
      this.logger.log(`Deleted ${deleted.count} existing premium access records for user ${payment.userId}`);
    }

    // Create NEW PremiumAccess records in batch
    if (premiumArticles.length > 0) {
      const premiumAccessData = premiumArticles.map(article => ({
        userId: payment.userId,
        articleId: article.id,
        amountPaid: Number(plan.price), // Store the subscription price
        accessUntil: newPeriodEnd, // Access until subscription ends
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = await tx.premiumAccess.createMany({
        data: premiumAccessData,
        skipDuplicates: false, // We want fresh records
      });

      this.logger.log(`Created ${result.count} PremiumAccess records for user ${payment.userId}`);
      
      // Log the first few article IDs for debugging
      if (premiumArticles.length > 0) {
        this.logger.debug(`First 5 article IDs: ${premiumArticles.slice(0, 5).map(a => a.id).join(', ')}`);
      }
    } else {
      this.logger.warn(`No premium articles found to grant access to!`);
    }

    // Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'SUCCESS', 
        coinsGranted: plan.coins 
      },
    });

    this.logger.log(`Payment ${paymentId} marked as SUCCESS`);

    return {
      subscriptionId: userSubscription.id,
      coinsGranted: plan.coins,
      periodEnd: newPeriodEnd,
      articlesGranted: premiumArticles.length
    };
  });
}


async checkUserPremiumAccess(userId: string, articleId: string): Promise<boolean> {
  this.logger.log(`Checking premium access for user ${userId} to article ${articleId}`);
  
  const access = await this.prisma.premiumAccess.findFirst({
    where: {
      userId,
      articleId,
      accessUntil: { gt: new Date() }
    }
  });
  
  return !!access;
}

async getUserPremiumArticles(userId: string): Promise<string[]> {
  this.logger.log(`Fetching premium articles for user ${userId}`);
  
  const accesses = await this.prisma.premiumAccess.findMany({
    where: {
      userId,
      accessUntil: { gt: new Date() }
    },
    select: { articleId: true }
  });
  
  return accesses.map(a => a.articleId);
}


async expirePremiumAccess(userId: string) {
  this.logger.log(`Expiring premium access for user ${userId}`);
  
  await this.prisma.premiumAccess.updateMany({
    where: { 
      userId,
      accessUntil: { gt: new Date() }
    },
    data: { accessUntil: new Date() }
  });
}

  // Add a method to get subscription by ID (useful for webhooks and admin)
  async getSubscriptionById(subscriptionId: string) {
    this.logger.log(`Fetching subscription by ID: ${subscriptionId}`);
    
    try {
      const subscription = await this.prisma.userSubscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found: ${subscriptionId}`);
        throw new NotFoundException('Subscription not found');
      }

      return subscription;
    } catch (error) {
      this.logger.error(`Failed to fetch subscription ${subscriptionId}`, error);
      throw error;
    }
  }
}