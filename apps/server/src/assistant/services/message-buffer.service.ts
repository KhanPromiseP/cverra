
import { Injectable, Logger } from '@nestjs/common';
import { GoalService } from './goal.service';
import { MemoryService } from './memory.service';

export interface BufferedMessage {  
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  intent?: string | null;
}

@Injectable()
export class MessageBufferService {
  private readonly logger = new Logger(MessageBufferService.name);
  
  // Buffer messages by user
  private buffers: Map<string, BufferedMessage[]> = new Map();
  private readonly BATCH_SIZE = 5; // Process after 5 messages
  private readonly MAX_BUFFER_AGE = 30 * 60 * 1000; // 30 minutes

  constructor(
    private goalService: GoalService,
    private memoryService: MemoryService,
  ) {}

  /**
   * Add message to buffer
   */
  async addMessage(message: BufferedMessage): Promise<void> {
    const userBuffer = this.buffers.get(message.userId) || [];
    userBuffer.push(message);
    this.buffers.set(message.userId, userBuffer);

    this.logger.debug(`User ${message.userId} buffer: ${userBuffer.length} messages`);

    // Check if we should process this batch
    if (userBuffer.length >= this.BATCH_SIZE) {
      await this.processBatch(message.userId);
    }
  }

  /**
   * Process batch of messages for a user
   */
  
/**
 * Process batch of messages for a user
 */
private async processBatch(userId: string): Promise<void> {
  const buffer = this.buffers.get(userId);
  if (!buffer || buffer.length === 0) return;

  this.logger.log(`Processing batch of ${buffer.length} messages for user ${userId}`);

  // Extract user messages only (not assistant responses)
  const userMessages = buffer.filter(m => m.role === 'user');
  
  if (userMessages.length === 0) return;

  try {
    // Group by conversation
    const byConversation = new Map<string, BufferedMessage[]>();
    
    for (const msg of buffer) {
      const list = byConversation.get(msg.conversationId) || [];
      list.push(msg);
      byConversation.set(msg.conversationId, list);
    }

    // Run batch processing in parallel
    await Promise.all([
      this.batchGoalDetection(userId, userMessages),
      this.batchMemoryCreation(userId, buffer), // Pass full buffer for context
    ]);

  } catch (error) {
    this.logger.error('Failed to process batch:', error);
  } finally {
    // Clear the buffer even if there was an error
    this.buffers.delete(userId);
  }
}

/**
 * Batch memory creation - ONE API call per conversation
 */
private async batchMemoryCreation(userId: string, messages: BufferedMessage[]): Promise<void> {
  try {
    // Group by conversation
    const byConversation = new Map<string, BufferedMessage[]>();
    
    for (const msg of messages) {
      const list = byConversation.get(msg.conversationId) || [];
      list.push(msg);
      byConversation.set(msg.conversationId, list);
    }

    // Create one memory per conversation batch
    for (const [convId, convMessages] of byConversation.entries()) {
      if (convMessages.length >= 3) { // Skip short conversations
        const topic = this.extractTopic(convMessages);
        await this.memoryService.createMemoryFromBatch(
          userId,
          convId,
          convMessages,
          topic
        );
        this.logger.debug(`Created memory for conversation ${convId} with topic: ${topic}`);
      }
    }
  } catch (error) {
    this.logger.error('Batch memory creation failed:', error);
  }
}

  /**
   * Batch goal detection - ONE API call for multiple messages
   */
  private async batchGoalDetection(userId: string, messages: BufferedMessage[]): Promise<void> {
    try {
      const combinedContent = messages.map(m => m.content).join('\n');
      
      // Single API call for all messages
      await this.goalService.detectGoalsFromBatch(userId, combinedContent, messages);
      
      this.logger.debug(`Batch goal detection completed for ${messages.length} messages`);
    } catch (error) {
      this.logger.error('Batch goal detection failed:', error);
    }
  }

  

  /**
   * Extract topic from messages
   */
  private extractTopic(messages: BufferedMessage[]): string {
    // Simple extraction - can be enhanced with AI later
    const words = messages
      .map(m => m.content.toLowerCase())
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 5);
    
    return words.join(' ') || 'conversation';
  }

  /**
   * Clean old buffers (called by cron)
   */
  async cleanOldBuffers(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, buffer] of this.buffers.entries()) {
      const oldestMessage = buffer[0]?.timestamp;
      if (oldestMessage && (now - oldestMessage.getTime()) > this.MAX_BUFFER_AGE) {
        await this.processBatch(userId); // Force process
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned ${cleanedCount} stale buffers`);
    }
  }
}