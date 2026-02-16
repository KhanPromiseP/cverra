import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  
  // Cache TTLs (in seconds)
  private readonly TTL = {
    USER_CONTEXT: 3600, // 1 hour
    ARTICLE_CONTEXT: 1800, // 30 minutes
    MEMORY_CONTEXT: 7200, // 2 hours
    RATE_LIMIT: 60, // 1 minute
  };

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    this.logger.log('Redis CacheService initialized');
  }

  // User context caching
  async cacheUserContext(userId: string, context: any): Promise<void> {
    try {
      const key = `user:${userId}:context`;
      await this.redis.setex(
        key,
        this.TTL.USER_CONTEXT,
        JSON.stringify(context)
      );
      this.logger.debug(`Cached context for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to cache user context: ${error.message}`);
    }
  }

  async getUserContext(userId: string): Promise<any> {
    try {
      const key = `user:${userId}:context`;
      const data = await this.redis.get(key);
      
      if (data) {
        await this.redis.expire(key, this.TTL.USER_CONTEXT); // Refresh TTL
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get user context: ${error.message}`);
      return null;
    }
  }

  // Assistant conversation caching
  async cacheConversationContext(conversationId: string, context: any): Promise<void> {
    try {
      const key = `conversation:${conversationId}:context`;
      await this.redis.setex(
        key,
        this.TTL.MEMORY_CONTEXT,
        JSON.stringify(context)
      );
    } catch (error) {
      this.logger.error(`Failed to cache conversation context: ${error.message}`);
    }
  }

  async getConversationContext(conversationId: string): Promise<any> {
    try {
      const key = `conversation:${conversationId}:context`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get conversation context: ${error.message}`);
      return null;
    }
  }

  // Rate limiting
  async checkRateLimit(userId: string, action: string, limit: number): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    try {
      const key = `ratelimit:${userId}:${action}:${Math.floor(Date.now() / 60000)}`; // Minute-based
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, this.TTL.RATE_LIMIT);
      }

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        reset: Date.now() + this.TTL.RATE_LIMIT * 1000,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`);
      return { allowed: true, remaining: limit, reset: 0 }; // Fail open
    }
  }

  // Article recommendations cache
  async cacheArticleRecommendations(userId: string, articles: any[]): Promise<void> {
    try {
      const key = `recommendations:${userId}:articles`;
      await this.redis.setex(
        key,
        this.TTL.ARTICLE_CONTEXT,
        JSON.stringify(articles)
      );
    } catch (error) {
      this.logger.error(`Failed to cache recommendations: ${error.message}`);
    }
  }

  async getArticleRecommendations(userId: string): Promise<any[]> {
    try {
      const key = `recommendations:${userId}:articles`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this.logger.error(`Failed to get recommendations: ${error.message}`);
      return [];
    }
  }

  // Memory search cache
  async cacheMemorySearch(userId: string, query: string, results: any[]): Promise<void> {
    try {
      const key = `memory:search:${userId}:${Buffer.from(query).toString('base64')}`;
      await this.redis.setex(
        key,
        this.TTL.MEMORY_CONTEXT,
        JSON.stringify(results)
      );
    } catch (error) {
      this.logger.error(`Failed to cache memory search: ${error.message}`);
    }
  }

  async getMemorySearch(userId: string, query: string): Promise<any[]> {
    try {
      const key = `memory:search:${userId}:${Buffer.from(query).toString('base64')}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this.logger.error(`Failed to get cached memory search: ${error.message}`);
      return [];
    }
  }


  async getCachedData(key: string): Promise<any> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get cached data: ${error.message}`);
      return null;
    }
  }

  async cacheData(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Failed to cache data: ${error.message}`);
    }
  }

  async incrementCounter(key: string, ttl: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, ttl);
      }
      return count;
    } catch (error) {
      this.logger.error(`Failed to increment counter: ${error.message}`);
      return 0;
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache pattern ${pattern}: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      return false;
    }
  }
}