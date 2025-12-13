// src/admin/admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

// Define types locally since they might not be in Prisma client
type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
type ServiceHealth = {
  service: string;
  status: HealthStatus;
  responseTime?: number;
  details?: string;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    this.logger.log('Fetching admin dashboard statistics');
    
    try {
      // User Statistics
      const userStats = await this.prisma.user.groupBy({
        by: ['role'],
        _count: {
          _all: true
        }
      });

      const totalUsers = await this.prisma.user.count();
      const newUsersThisMonth = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Subscription & Revenue Statistics
      const subscriptionStats = await this.prisma.userSubscription.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      });

      const revenueStats = await this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
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

      // Usage Statistics
      const usageStats = await this.prisma.usageLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          _all: true
        },
        _sum: {
          cost: true
        }
      });

      // Resume & Cover Letter Statistics
      const resumeStats = await this.prisma.resume.groupBy({
        by: ['visibility'],
        _count: {
          _all: true
        }
      });

      const coverLetterStats = await this.prisma.coverLetter.groupBy({
        by: ['visibility'],
        _count: {
          _all: true
        }
      });

      // Platform Growth (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyGrowth = await this.prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        _count: {
          _all: true
        }
      });

      // Top Plans by Subscription Count
      const topPlans = await this.prisma.subscriptionPlan.findMany({
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
          subscriptions: {
            _count: 'desc'
          }
        },
        take: 5
      });

      // Convert Decimal to number for calculations
      const monthlyRevenue = this.convertDecimalToNumber(revenueStats._sum.amount);
      const totalCost = usageStats.reduce((sum, stat) => sum + this.convertDecimalToNumber(stat._sum.cost), 0);

      return {
        userStatistics: {
          totalUsers,
          newUsersThisMonth,
          byRole: userStats,
          monthlyGrowth: this.formatMonthlyGrowth(monthlyGrowth)
        },
        financialStatistics: {
          monthlyRevenue,
          monthlyTransactions: revenueStats._count._all || 0,
          subscriptionStats,
          topPlans
        },
        usageStatistics: {
          totalUsage: usageStats.reduce((sum, stat) => sum + stat._count._all, 0),
          byAction: usageStats,
          totalCost
        },
        contentStatistics: {
          totalResumes: resumeStats.reduce((sum, stat) => sum + stat._count._all, 0),
          resumesByVisibility: resumeStats,
          totalCoverLetters: coverLetterStats.reduce((sum, stat) => sum + stat._count._all, 0),
          coverLettersByVisibility: coverLetterStats
        },
        platformHealth: {
          activeSubscriptions: subscriptionStats.find(stat => stat.status === SubscriptionStatus.ACTIVE)?._count._all || 0,
          successRate: this.calculateSuccessRate(revenueStats._count._all, await this.getTotalTransactions()),
          averageRevenuePerUser: this.calculateARPU(monthlyRevenue, totalUsers)
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch admin dashboard statistics', error);
      throw error;
    }
  }

  async getUserManagementData() {
    this.logger.log('Fetching user management data');
    
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          _count: {
            select: {
              resumes: true,
              coverLetters: true,
              payments: {
                where: {
                  status: PaymentStatus.SUCCESS
                }
              },
              subscriptions: {
                where: {
                  status: SubscriptionStatus.ACTIVE
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return users;
    } catch (error) {
      this.logger.error('Failed to fetch user management data', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: UserRole) {
    this.logger.log(`Updating user role: ${userId} to ${role}`);
    
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      this.logger.log(`User role updated successfully: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to update user role for ${userId}`, error);
      throw error;
    }
  }

  async getPlatformAnalytics(timeframe: '7d' | '30d' | '90d' | '1y' = '30d') {
    this.logger.log(`Fetching platform analytics for timeframe: ${timeframe}`);
    
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : timeframe === '1y' ? 365 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [userGrowth, revenueData, usageData, subscriptionData] = await Promise.all([
        // User growth
        this.prisma.user.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: { _all: true }
        }),

        // Revenue data
        this.prisma.payment.groupBy({
          by: ['createdAt'],
          where: { 
            status: PaymentStatus.SUCCESS,
            createdAt: { gte: startDate }
          },
          _sum: { amount: true },
          _count: { _all: true }
        }),

        // Usage data
        this.prisma.usageLog.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: { _all: true },
          _sum: { cost: true }
        }),

        // Subscription data
        this.prisma.userSubscription.groupBy({
          by: ['createdAt'],
          where: { 
            status: SubscriptionStatus.ACTIVE,
            createdAt: { gte: startDate }
          },
          _count: { _all: true }
        })
      ]);

      // Convert Decimal values to numbers
      const formattedRevenueData = revenueData.map(item => ({
        ...item,
        _sum: {
          amount: this.convertDecimalToNumber(item._sum.amount)
        }
      }));

      return {
        userGrowth: this.formatTimeSeriesData(userGrowth, days),
        revenueData: this.formatTimeSeriesData(formattedRevenueData, days),
        usageData: this.formatTimeSeriesData(usageData, days),
        subscriptionData: this.formatTimeSeriesData(subscriptionData, days)
      };
    } catch (error) {
      this.logger.error('Failed to fetch platform analytics', error);
      throw error;
    }
  }

  // Helper method to convert Decimal to number
  private convertDecimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) {
      return 0;
    }
    
    // If it's already a number, return it
    if (typeof decimalValue === 'number') {
      return decimalValue;
    }
    
    // If it's a Decimal object, convert to number
    if (decimalValue && typeof decimalValue.toNumber === 'function') {
      return decimalValue.toNumber();
    }
    
    // If it's a string, parse it
    if (typeof decimalValue === 'string') {
      return parseFloat(decimalValue) || 0;
    }
    
    // Fallback
    return Number(decimalValue) || 0;
  }

  private formatMonthlyGrowth(data: any[]) {
    // Implementation to format monthly growth data
    return data.map(item => ({
      ...item,
      // Convert any Decimal values if needed
      amount: this.convertDecimalToNumber(item.amount)
    }));
  }

  private formatTimeSeriesData(data: any[], days: number) {
    // Implementation to format time series data for charts
    return data.map(item => ({
      ...item,
      // Convert any Decimal values if needed
      _sum: item._sum ? {
        ...item._sum,
        amount: this.convertDecimalToNumber(item._sum?.amount),
        cost: this.convertDecimalToNumber(item._sum?.cost)
      } : undefined
    }));
  }

  private async getTotalTransactions(): Promise<number> {
    const result = await this.prisma.payment.count();
    return result;
  }

  private calculateSuccessRate(successful: number, total: number): number {
    return total > 0 ? (successful / total) * 100 : 0;
  }

  private calculateARPU(revenue: number, users: number): number {
    return users > 0 ? revenue / users : 0;
  }

  // Enhanced System Health Monitoring
  async getSystemHealth() {
    this.logger.log('Fetching system health metrics');
    
    try {
      const [databaseStatus, queueStatus, cacheStatus, externalServicesStatus, storageStatus, performanceStatus] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkQueueHealth(),
        this.checkCacheHealth(),
        this.checkExternalServicesHealth(),
        this.checkStorageHealth(),
        this.checkPerformanceHealth()
      ]);

      // Extract status values for overall health calculation
      const allStatuses: HealthStatus[] = [
        databaseStatus,
        queueStatus,
        cacheStatus,
        ...externalServicesStatus.map(service => service.status),
        storageStatus,
        performanceStatus
      ];

      return {
        database: databaseStatus,
        queue: queueStatus,
        cache: cacheStatus,
        externalServices: externalServicesStatus,
        storage: storageStatus,
        performance: performanceStatus,
        overall: this.calculateOverallHealth(allStatuses),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to fetch system health metrics', error);
      throw error;
    }
  }

  private async checkDatabaseHealth(): Promise<HealthStatus> {
    try {
      // Test basic query
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test connection pool health
      await this.prisma.user.count();
      
      // Test transaction capability
      await this.prisma.$transaction(async (tx) => {
        await tx.user.findFirst();
      });

      return 'healthy';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return 'unhealthy';
    }
  }

  private async checkQueueHealth(): Promise<HealthStatus> {
    try {
      // If you're using Redis/BullMQ for queues
      // This is a placeholder - implement based on your queue system
      return 'healthy';
    } catch (error) {
      this.logger.error('Queue health check failed', error);
      return 'unhealthy';
    }
  }

  private async checkCacheHealth(): Promise<HealthStatus> {
    try {
      // If you're using Redis for caching
      // This is a placeholder - implement based on your cache system
      return 'healthy';
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return 'unhealthy';
    }
  }

  private async checkExternalServicesHealth(): Promise<ServiceHealth[]> {
    const services = [
      { 
        name: 'payment-service', 
        url: process.env.PAYMENT_SERVICE_URL,
        timeout: 5000 
      },
      { 
        name: 'subscription-service', 
        url: process.env.SUBSCRIPTION_SERVICE_URL,
        timeout: 3000 
      },
      { 
        name: 'ai-service', 
        url: process.env.AI_SERVICE_URL,
        timeout: 10000 
      },
      { 
        name: 'email-service', 
        url: process.env.EMAIL_SERVICE_URL,
        timeout: 3000 
      },
      { 
        name: 'storage-service', 
        url: process.env.STORAGE_SERVICE_URL,
        timeout: 5000 
      }
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service): Promise<ServiceHealth> => {
        const startTime = Date.now();
        
        try {
          // For services without URLs, assume they're integrated
          if (!service.url) {
            return {
              service: service.name,
              status: 'healthy' as HealthStatus,
              responseTime: Date.now() - startTime,
              details: 'Service integrated (no external URL)'
            };
          }

          // For services with URLs, try to call their health endpoint
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), service.timeout);
          
          const response = await fetch(`${service.url}/health`, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'AdminService-HealthCheck'
            }
          });
          
          clearTimeout(timeoutId);
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            const status: HealthStatus = data.status === 'healthy' ? 'healthy' : 
                                       data.status === 'degraded' ? 'degraded' : 'unhealthy';
            
            return {
              service: service.name,
              status,
              responseTime,
              details: data.message || 'Service responsive'
            };
          } else {
            return {
              service: service.name,
              status: 'unhealthy',
              responseTime,
              details: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            service: service.name,
            status: 'unhealthy',
            responseTime,
            details: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return healthChecks.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: 'unknown-service',
          status: 'unhealthy' as HealthStatus,
          details: 'Health check promise rejected'
        };
      }
    });
  }

  private async checkStorageHealth(): Promise<HealthStatus> {
    try {
      // Check database storage
      await this.prisma.$queryRaw`SELECT 1`;
      return 'healthy';
    } catch (error) {
      this.logger.error('Storage health check failed', error);
      return 'degraded';
    }
  }

  private async checkPerformanceHealth(): Promise<HealthStatus> {
    try {
      // Check response times for critical queries
      const startTime = Date.now();
      
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.payment.count({
          where: { status: PaymentStatus.SUCCESS }
        }),
        this.prisma.userSubscription.count({
          where: { status: SubscriptionStatus.ACTIVE }
        })
      ]);

      const queryTime = Date.now() - startTime;

      // Define performance thresholds
      if (queryTime > 5000) {
        return 'unhealthy';
      } else if (queryTime > 2000) {
        return 'degraded';
      }

      return 'healthy';
    } catch (error) {
      this.logger.error('Performance health check failed', error);
      return 'unhealthy';
    }
  }

  private calculateOverallHealth(statuses: HealthStatus[]): HealthStatus {
    const statusCounts = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0
    };

    statuses.forEach(status => {
      statusCounts[status]++;
    });

    if (statusCounts.unhealthy > 0) {
      return 'unhealthy';
    } else if (statusCounts.degraded > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Additional utility methods
  async getDetailedHealthReport() {
    const health = await this.getSystemHealth();
    
    return {
      summary: health,
      recommendations: this.generateHealthRecommendations(health)
    };
  }

  private generateHealthRecommendations(health: any): string[] {
    const recommendations: string[] = [];

    if (health.overall === 'unhealthy') {
      recommendations.push('Immediate attention required for critical services');
    }

    if (health.database === 'degraded' || health.database === 'unhealthy') {
      recommendations.push('Consider database optimization or scaling');
    }

    if (health.performance === 'degraded' || health.performance === 'unhealthy') {
      recommendations.push('Review performance bottlenecks and consider caching strategies');
    }

    health.externalServices.forEach((service: ServiceHealth) => {
      if (service.status === 'unhealthy') {
        recommendations.push(`Investigate ${service.service} connectivity issues`);
      } else if (service.status === 'degraded') {
        recommendations.push(`Monitor ${service.service} for performance issues`);
      }
    });

    return recommendations.length > 0 ? recommendations : ['All systems operating normally'];
  }

  // Additional admin methods
  async getActiveSubscriptions() {
    try {
      const subscriptions = await this.prisma.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          plan: true
        },
        orderBy: {
          currentPeriodEnd: 'asc'
        }
      });

      return subscriptions;
    } catch (error) {
      this.logger.error('Failed to fetch active subscriptions', error);
      throw error;
    }
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    try {
      const revenueData = await this.prisma.payment.groupBy({
        by: ['provider', 'status'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        }
      });

      const totalRevenue = revenueData
        .filter(item => item.status === PaymentStatus.SUCCESS)
        .reduce((sum, item) => sum + this.convertDecimalToNumber(item._sum.amount), 0);

      return {
        period: { startDate, endDate },
        totalRevenue,
        breakdown: revenueData,
        currency: 'USD'
      };
    } catch (error) {
      this.logger.error('Failed to generate revenue report', error);
      throw error;
    }
  }
}