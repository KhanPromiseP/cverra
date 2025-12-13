// src/payments/subscriptions/admin-subscription.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './dto/subscription-plan.dto';
import { Prisma, TransactionType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class AdminSubscriptionService {
  private readonly logger = new Logger(AdminSubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPlan(createPlanDto: CreateSubscriptionPlanDto) {
    this.logger.log(`Creating new subscription plan: ${createPlanDto.name}`);
    
    try {
      // Check if plan with same name already exists
      const existingPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { 
          name: createPlanDto.name,
          isActive: true 
        }
      });

      if (existingPlan) {
        throw new BadRequestException('A subscription plan with this name already exists');
      }

      const plan = await this.prisma.subscriptionPlan.create({
        data: {
          ...createPlanDto,
          price: new Prisma.Decimal(createPlanDto.price),
          features: createPlanDto.features || [],
        },
      });

      this.logger.log(`Subscription plan created successfully: ${plan.id}`);
      return plan;
    } catch (error) {
      this.logger.error(`Failed to create subscription plan: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllPlans() {
    this.logger.log('Fetching all subscription plans');
    
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        orderBy: [
          { isActive: 'desc' },
          { price: 'asc' }
        ],
        include: {
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: SubscriptionStatus.ACTIVE
                }
              }
            }
          }
        }
      });

      this.logger.log(`Found ${plans.length} subscription plans`);
      return plans;
    } catch (error) {
      this.logger.error('Failed to fetch subscription plans', error);
      throw error;
    }
  }

  async getPlanById(planId: string) {
    this.logger.log(`Fetching subscription plan: ${planId}`);
    
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          subscriptions: {
            where: {
              status: SubscriptionStatus.ACTIVE
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: SubscriptionStatus.ACTIVE
                }
              }
            }
          }
        }
      });

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      return plan;
    } catch (error) {
      this.logger.error(`Failed to fetch subscription plan ${planId}`, error);
      throw error;
    }
  }

  async updatePlan(planId: string, updatePlanDto: UpdateSubscriptionPlanDto) {
    this.logger.log(`Updating subscription plan: ${planId}`);
    
    try {
      const existingPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!existingPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      // Prevent updating price if there are active subscriptions
      if (updatePlanDto.price !== undefined && updatePlanDto.price !== Number(existingPlan.price)) {
        const activeSubscriptions = await this.prisma.userSubscription.count({
          where: {
            planId,
            status: SubscriptionStatus.ACTIVE
          }
        });

        if (activeSubscriptions > 0) {
          throw new BadRequestException('Cannot update price for a plan with active subscriptions');
        }
      }

      const updatedPlan = await this.prisma.subscriptionPlan.update({
        where: { id: planId },
        data: {
          ...updatePlanDto,
          ...(updatePlanDto.price && { price: new Prisma.Decimal(updatePlanDto.price) }),
        },
      });

      this.logger.log(`Subscription plan updated successfully: ${planId}`);
      return updatedPlan;
    } catch (error) {
      this.logger.error(`Failed to update subscription plan ${planId}`, error);
      throw error;
    }
  }

  async deletePlan(planId: string) {
    this.logger.log(`Deleting subscription plan: ${planId}`);
    
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: SubscriptionStatus.ACTIVE
                }
              }
            }
          }
        }
      });

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      if (plan._count.subscriptions > 0) {
        throw new BadRequestException('Cannot delete plan with active subscriptions. Deactivate it instead.');
      }

      await this.prisma.subscriptionPlan.delete({
        where: { id: planId }
      });

      this.logger.log(`Subscription plan deleted successfully: ${planId}`);
      return { message: 'Subscription plan deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete subscription plan ${planId}`, error);
      throw error;
    }
  }

  async togglePlanStatus(planId: string) {
    this.logger.log(`Toggling status for subscription plan: ${planId}`);
    
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      const updatedPlan = await this.prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: !plan.isActive }
      });

      this.logger.log(`Subscription plan status toggled to: ${updatedPlan.isActive}`);
      return updatedPlan;
    } catch (error) {
      this.logger.error(`Failed to toggle plan status ${planId}`, error);
      throw error;
    }
  }

  async getPlanAnalytics(planId: string) {
    this.logger.log(`Fetching analytics for subscription plan: ${planId}`);
    
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      const analytics = await this.prisma.userSubscription.groupBy({
        by: ['status'],
        where: { planId },
        _count: {
          _all: true
        }
      });

      const revenueData = await this.prisma.payment.groupBy({
        by: ['status'],
        where: {
          userSubscription: {
            planId: planId
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        }
      });

      return {
        plan,
        subscriptionStats: analytics,
        revenueStats: revenueData,
        totalActiveSubscriptions: analytics.find(stat => stat.status === SubscriptionStatus.ACTIVE)?._count._all || 0
      };
    } catch (error) {
      this.logger.error(`Failed to fetch analytics for plan ${planId}`, error);
      throw error;
    }
  }

  async getSubscriptionStats() {
    this.logger.log('Fetching overall subscription statistics');
    
    try {
      const totalStats = await this.prisma.userSubscription.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      });

      const planStats = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: SubscriptionStatus.ACTIVE
                }
              }
            }
          }
        },
        orderBy: {
          price: 'asc'
        }
      });

      const monthlyRevenue = await this.prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          userSubscription: {
            isNot: null
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        }
      });

      return {
        totalStats,
        planStats,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        monthlyTransactions: monthlyRevenue._count._all || 0
      };
    } catch (error) {
      this.logger.error('Failed to fetch subscription statistics', error);
      throw error;
    }
  }

  async getAllSubscriptions(filters?: {
    status?: SubscriptionStatus;
    planId?: string;
    userId?: string;
  }) {
    this.logger.log('Fetching all subscriptions with filters', filters);
    
    try {
      const where: Prisma.UserSubscriptionWhereInput = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.planId) {
        where.planId = filters.planId;
      }
      
      if (filters?.userId) {
        where.userId = filters.userId;
      }

      const subscriptions = await this.prisma.userSubscription.findMany({
        where,
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      this.logger.log(`Found ${subscriptions.length} subscriptions`);
      return subscriptions;
    } catch (error) {
      this.logger.error('Failed to fetch subscriptions', error);
      throw error;
    }
  }

  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
    this.logger.log(`Updating subscription ${subscriptionId} status to: ${status}`);
    
    try {
      const subscription = await this.prisma.userSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const updatedSubscription = await this.prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: { status: status as SubscriptionStatus }
      });

      this.logger.log(`Subscription status updated successfully: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to update subscription status ${subscriptionId}`, error);
      throw error;
    }
  }
}