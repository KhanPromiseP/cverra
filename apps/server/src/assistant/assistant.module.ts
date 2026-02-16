
import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './services/assistant.service';
import { GroqService } from './services/groq.service';
import { ContextBuilderService } from './services/context-builder.service';
import { MemoryService } from './services/memory.service';
import { RedisModule } from '../redis/redis.module'; 
import { CacheService } from '../redis/cache.service'; 
@Module({
  imports: [
    RedisModule, 
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    GroqService,
    ContextBuilderService,
    MemoryService,
    CacheService, 
  ],
  exports: [AssistantService],
})
export class AssistantModule {}