// src/modules/assistant/services/cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LifeDashboardService } from './life-dashboard.service';
import { EmotionalIntelligenceService } from './emotional.service';
import { GoalService } from './goal.service';
import { IdentityService } from './identity.service';
import { SecondBrainService } from './second-brain.service';
import { MemoryService } from './memory.service';
import { MessageBufferService } from './message-buffer.service';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';

@Injectable()
export class AssistantCronService {
  private readonly logger = new Logger(AssistantCronService.name);
  
  // Track running jobs to prevent overlaps
  private runningJobs: Map<string, boolean> = new Map();

  constructor(
    private lifeDashboard: LifeDashboardService,
    private emotional: EmotionalIntelligenceService,
    private goalService: GoalService,
    private identityService: IdentityService,
    private secondBrain: SecondBrainService,
    private memoryService: MemoryService,
    private messageBuffer: MessageBufferService,
    private prisma: PrismaService,
  ) {}

  /**
   * Every Monday at 8 AM - Generate weekly summaries for all active users
   */
  @Cron('0 8 * * 1')
  async generateWeeklySummaries() {
    const jobId = 'weekly-summaries';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Weekly summaries job already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🚀 Running weekly summary generation');
    const startTime = Date.now();
    
    try {
      await this.lifeDashboard.generateWeeklySummaries();
      this.logger.log(`✅ Weekly summaries completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Weekly summary generation failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every 6 hours - Deep pattern detection from stored data
   */
  @Cron('0 */6 * * *')
  async deepPatternDetection() {
    const jobId = 'deep-pattern-detection';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Deep pattern detection already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🔍 Starting deep pattern detection...');
    const startTime = Date.now();
    
    try {
      const activeUsers = await this.getActiveUsers(24); // Active in last 24 hours
      
      let successCount = 0;
      for (const userId of activeUsers) {
        try {
          // Analyze emotional patterns from stored snapshots
          await this.emotional.detectEmotionalPatterns(userId);
          
          // Evolve identity based on conversations
          await this.identityService.evolveIdentity(userId);
          
          successCount++;
          
          if (successCount % 10 === 0) {
            this.logger.debug(`Progress: ${successCount}/${activeUsers.length} users processed`);
          }
        } catch (error) {
          this.logger.error(`❌ Deep analysis failed for user ${userId}:`, error);
        }
      }
      
      this.logger.log(`✅ Deep pattern detection completed for ${successCount}/${activeUsers.length} users in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Deep pattern detection failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every 6 hours - Stalled goal detection
   */
  @Cron('0 */6 * * *')
  async detectStalledGoals() {
    const jobId = 'stalled-goals';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Stalled goal detection already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🎯 Running stalled goal detection');
    const startTime = Date.now();
    
    try {
      const stalledGoals = await this.prisma.assistantGoal.findMany({
        where: { 
          status: 'ACTIVE',
          stalledSince: null,
          mentionCount: { gte: 3 },
          progress: 0,
          lastMentioned: { 
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Not mentioned in 7 days
          },
        },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        },
      });

      this.logger.log(`Found ${stalledGoals.length} stalled goals`);

      for (const goal of stalledGoals) {
        try {
          // Mark as stalled
          await this.prisma.assistantGoal.update({
            where: { id: goal.id },
            data: {
              stalledSince: new Date(),
              stallReason: 'no_progress_7_days',
            },
          });

          // Generate accountability nudge
          const nudge = await this.goalService.generateAccountabilityNudge(goal.userId);
          
          if (nudge) {
            // Store nudge for next conversation
            await this.prisma.assistantMemory.create({
              data: {
                userId: goal.userId,
                topic: 'accountability_nudge',
                summary: nudge,
                keyPoints: [nudge],
                contextType: 'personal_development',
                importance: 'MEDIUM',
                source: 'system',
                tags: ['accountability', 'goal', 'nudge', goal.category?.toLowerCase() || 'general'],
                lastAccessed: new Date(),
                relevanceScore: 0.8,
                conversationId: null,
                relatedIds: [goal.id],
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                metadata: {
                  generatedBy: 'cron',
                  generatedAt: new Date().toISOString(),
                  type: 'accountability_nudge',
                  goalId: goal.id,
                  goalDescription: goal.description,
                },
              },
            });
            
            this.logger.debug(`📝 Stored accountability nudge for user ${goal.userId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to process stalled goal ${goal.id}:`, error);
        }
      }
      
      this.logger.log(`✅ Stalled goal detection completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Stalled goal detection failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every hour - Process stale message buffers
   */
  @Cron('0 * * * *')
  async processStaleBuffers() {
    const jobId = 'stale-buffers';
    if (this.runningJobs.get(jobId)) {
      return; // Silent skip for frequent jobs
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('📦 Processing stale message buffers');
    const startTime = Date.now();
    
    try {
      await this.messageBuffer.cleanOldBuffers();
      this.logger.log(`✅ Buffer cleanup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Buffer cleanup failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every 12 hours - Discover connections in Second Brain
   */
  @Cron('0 */12 * * *')
  async discoverBrainConnections() {
    const jobId = 'brain-connections';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Brain connection discovery already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🧠 Discovering Second Brain connections');
    const startTime = Date.now();
    
    try {
      const activeUsers = await this.getActiveUsers(48); // Active in last 48 hours
      
      let totalConnections = 0;
      let processedCount = 0;
      
      for (const userId of activeUsers) {
        try {
          const count = await this.secondBrain.discoverConnections(userId);
          totalConnections += count;
          processedCount++;
          
          if (count > 0) {
            this.logger.debug(`Found ${count} connections for user ${userId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Connection discovery failed for user ${userId}:`, error);
        }
      }
      
      this.logger.log(`✅ Discovered ${totalConnections} connections for ${processedCount}/${activeUsers.length} users in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Brain connection discovery failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every day at 2 AM - Generate and evolve user identities
   */
  @Cron('0 2 * * *')
  async evolveUserIdentities() {
    const jobId = 'evolve-identities';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Identity evolution already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🆔 Evolving user identities');
    const startTime = Date.now();
    
    try {
      const activeUsers = await this.getActiveUsers(168); // Active in last 7 days
      
      let evolvedCount = 0;
      for (const userId of activeUsers) {
        try {
          const evolved = await this.identityService.evolveIdentity(userId);
          if (evolved) evolvedCount++;
        } catch (error) {
          this.logger.error(`❌ Identity evolution failed for user ${userId}:`, error);
        }
      }
      
      this.logger.log(`✅ Evolved ${evolvedCount} identities in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Identity evolution failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every day at 3 AM - Clean up expired data
   */
  @Cron('0 3 * * *')
  async cleanupExpiredData() {
    const jobId = 'cleanup';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Cleanup already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('🧹 Running daily cleanup');
    const startTime = Date.now();
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old emotional snapshots (keep patterns)
      const deletedSnapshots = await this.prisma.assistantEmotionalSnapshot.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isPattern: false,
        },
      });
      
      this.logger.log(`🗑️ Cleaned up ${deletedSnapshots.count} old emotional snapshots`);

      // Archive old brain items
      const archivedItems = await this.prisma.assistantBrainItem.updateMany({
        where: {
          updatedAt: { lt: thirtyDaysAgo },
          status: 'ACTIVE',
          type: { not: 'PROJECT' },
        },
        data: {
          status: 'ARCHIVED',
        },
      });
      
      this.logger.log(`📦 Archived ${archivedItems.count} old brain items`);

      // Delete expired nudges
      const deletedNudges = await this.prisma.assistantMemory.deleteMany({
        where: {
          topic: 'accountability_nudge',
          expiresAt: { lt: new Date() },
        },
      });
      
      this.logger.log(`🗑️ Deleted ${deletedNudges.count} expired nudges`);

      // Clean up old message buffers
      await this.messageBuffer.cleanOldBuffers();

      this.logger.log(`✅ Cleanup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Cleanup failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Every 4 hours - Generate micro-plans for stalled goals
   */
  @Cron('0 */4 * * *')
  async generateMicroPlans() {
    const jobId = 'micro-plans';
    if (this.runningJobs.get(jobId)) {
      this.logger.warn('⚠️ Micro-plan generation already running, skipping');
      return;
    }
    
    this.runningJobs.set(jobId, true);
    this.logger.log('📋 Generating micro-plans for stalled goals');
    const startTime = Date.now();
    
    try {
      // Get goals that have been stalled for at least 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const stalledGoals = await this.prisma.assistantGoal.findMany({
        where: {
          status: 'ACTIVE',
          stalledSince: { 
            not: null,
            lt: sevenDaysAgo, // Stalled for more than 7 days
          },
        },
        take: 50, // Limit to 50 per run
      });

      // Filter in memory for metadata conditions
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const goalsNeedingPlans = stalledGoals.filter(goal => {
        const metadata = goal.metadata as any;
        return !metadata?.microPlan || 
               (metadata?.planCreatedAt && new Date(metadata.planCreatedAt) < thirtyDaysAgo);
      });

      this.logger.log(`Found ${goalsNeedingPlans.length} stalled goals needing micro-plans`);

      for (const goal of goalsNeedingPlans) {
        try {
          const plan = await this.goalService.createMicroPlan(goal.userId, goal.id);
          if (plan) {
            this.logger.debug(`✅ Generated micro-plan for goal ${goal.id}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to generate micro-plan for goal ${goal.id}:`, error);
        }
      }
      
      this.logger.log(`✅ Micro-plan generation completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error('❌ Micro-plan generation failed:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Helper method to get active users within a time period
   */
  private async getActiveUsers(hours: number): Promise<string[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // ✅ FIX: Use raw query for maximum compatibility
      const result = await this.prisma.$queryRaw<Array<{ userid: string }>>`
        SELECT DISTINCT "userId" as userid
        FROM "assistant_messages"
        WHERE "createdAt" >= ${since}
        AND "role" = 'user'
      `;
      
      const userIds = result.map(r => r.userid);
      this.logger.debug(`Found ${userIds.length} active users in last ${hours}h`);
      
      return userIds;
    } catch (error) {
      this.logger.error('Failed to get active users:', error);
      return [];
    }
  }

  /**
   * Helper method to log memory usage (optional)
   */
  private logMemoryUsage() {
    const used = process.memoryUsage();
    this.logger.debug('Memory usage:', {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    });
  }
}