import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './services/assistant.service';
import { GroqService } from './services/groq.service';
import { ContextBuilderService } from './services/context-builder.service';
import { MemoryService } from './services/memory.service';
import { RedisModule } from '../redis/redis.module'; 
import { CacheService } from '../redis/cache.service'; 
import { AssistantCronService } from './services/cron.service';
import { GoalService } from './services/goal.service';
import { EmotionalIntelligenceService } from './services/emotional.service';
import { IdentityService } from './services/identity.service';
import { DecisionEngineService } from './services/decision.service';
import { SecondBrainService } from './services/second-brain.service';
import { FutureSimulationService } from './services/future-simulation.service';
import { LifeDashboardService } from './services/life-dashboard.service';
import { IdentityFramerService } from './services/identity-framer.service';
import { ArticleSelectorService } from './services/article-selector.service';
import { ContextSelectorService } from './services/context-selector.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { IntentService } from './services/intent.service';
import { ResponseValidatorService } from './services/response-validator.service';
import { MessageBufferService } from './services/message-buffer.service';

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
    AssistantCronService,
    GoalService,
    EmotionalIntelligenceService,
    IdentityService,
    DecisionEngineService,
    SecondBrainService,
    FutureSimulationService,
    LifeDashboardService,
    IdentityFramerService,
    ArticleSelectorService,
    ContextSelectorService,
    PromptBuilderService,
    IntentService,
    ResponseValidatorService,
    MessageBufferService,
  ],
  exports: [AssistantService, GroqService], // Export GroqService so MemoryService can use it
})
export class AssistantModule {}