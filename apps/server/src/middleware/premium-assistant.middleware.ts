// src/middleware/premium-assistant.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { CacheService } from '../redis/cache.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

@Injectable()
export class PremiumAssistantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PremiumAssistantMiddleware.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async use(req: AuthRequest, res: Response, next: NextFunction) {
    // Skip middleware for health checks and public endpoints
    if (this.shouldSkipMiddleware(req.path)) {
      return next();
    }

    // Check if user is authenticated
    if (!req.user?.id) {
      this.logger.warn('No authenticated user for assistant access');
      // You might want to throw an error here or set default tier
      (req as any).userTier = 'FREE';
      return next();
    }

    const userId = req.user.id;

    try {
      // Check cache first for user tier
      const cacheKey = `user:${userId}:tier`;
      const cachedTier = await this.cacheService.getCachedData(cacheKey);
      
      let userTier: 'FREE' | 'PREMIUM' | 'ADMIN';
      
      if (cachedTier) {
        userTier = cachedTier;
        this.logger.debug(`Using cached tier ${userTier} for user ${userId}`);
      } else {
        // Get user from database
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
                currentPeriodEnd: { gt: new Date() },
              },
            },
          },
        });

        if (!user) {
          this.logger.error(`User ${userId} not found in database`);
          userTier = 'FREE';
        } else {
          // Determine tier
          if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            userTier = 'ADMIN';
          } else if (user.subscriptions.length > 0) {
            userTier = 'PREMIUM';
          } else {
            userTier = 'FREE';
          }

          // Cache the tier for 5 minutes
          await this.cacheService.cacheData(cacheKey, userTier, 300);
          this.logger.debug(`Cached tier ${userTier} for user ${userId}`);
        }
      }

      // Add tier to request object
      (req as any).userTier = userTier;
      
      // Add tier info to user object (for compatibility with existing code)
      if (req.user) {
        req.user.tier = userTier;
      }

      // Add premium features to request
      (req as any).premiumFeatures = {
        unlimitedMessages: userTier === 'PREMIUM' || userTier === 'ADMIN',
        advancedMemory: userTier === 'PREMIUM' || userTier === 'ADMIN',
        priorityProcessing: userTier === 'PREMIUM' || userTier === 'ADMIN',
        customModels: userTier === 'ADMIN',
        maxTokens: this.getMaxTokensByTier(userTier),
        contextSize: this.getContextSizeByTier(userTier),
      };

      this.logger.log(`User ${userId} accessing assistant as ${userTier} tier`);
      next();
    } catch (error) {
      this.logger.error(`Middleware error for user ${userId}:`, error);
      // Fallback to FREE tier on error
      (req as any).userTier = 'FREE';
      if (req.user) {
        req.user.tier = 'FREE';
      }
      next();
    }
  }

  private shouldSkipMiddleware(path: string): boolean {
    const skipPaths = [
      '/assistant/health',
      '/health',
      '/api/health',
      '/auth',
      '/public',
      '/webhooks',
      '/payments/webhook',
    ];
    
    return skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  private getMaxTokensByTier(tier: string): number {
    switch (tier) {
      case 'ADMIN':
        return 8000;
      case 'PREMIUM':
        return 4000;
      case 'FREE':
      default:
        return 1000;
    }
  }

  private getContextSizeByTier(tier: string): number {
    switch (tier) {
      case 'ADMIN':
        return 50;
      case 'PREMIUM':
        return 50;
      case 'FREE':
      default:
        return 5;
    }
  }
}