// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const host = configService.get('REDIS_HOST', 'localhost');
        const port = configService.get('REDIS_PORT', 6379);
        const password = configService.get('REDIS_PASSWORD');
        const db = configService.get('REDIS_DB', 0);
        
        // Build config object conditionally
        const redisConfig: any = {
          host,
          port,
          db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        };
        
        // Only add password if it's actually set and not empty
        if (password && password.trim() !== '') {
          redisConfig.password = password;
        }
        
        const client = new Redis(redisConfig);

        client.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        client.on('connect', () => {
          console.log(`Redis Client Connected to ${host}:${port}${password ? ' (with password)' : ''}`);
        });

        client.on('ready', () => {
          console.log('Redis Client Ready');
        });

        return client;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class RedisModule {}