
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Sse,
  MessageEvent,
  Req,
  Logger,
  BadRequestException,
  NotFoundException,
  ValidationPipe ,
  UsePipes,
  Delete, 
  Patch,
  Res,
  HttpStatus 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AssistantService } from './services/assistant.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PrismaService } from '../../../../tools/prisma/prisma.service'; 
import { CreateConversationDto, SearchMemoriesDto, SendMessageDto } from './dto';
import { 
  ClearConversationDto,
  DeleteConversationDto,
  RestoreConversationDto,
  ArchiveConversationDto,
  StarConversationDto,
  PinConversationDto,
  UpdateConversationTitleDto,
  ExportConversationDto,
  GetConversationsDto,
  GetConversationAnalyticsDto,
  EmptyTrashDto
} from './dto/conversation-management.dto';
import { Observable, interval, map } from 'rxjs';

// Define extended request interface like in payments controller
interface AuthRequest extends Request {
  user: { 
    id: string; 
    email: string;
    name?: string;
    role?: string;
    tier?: 'FREE' | 'PREMIUM' | 'ADMIN'; // Added tier from middleware
    [key: string]: any;
  };
}

@Controller('assistant')
@UseGuards(JwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(
  private readonly assistantService: AssistantService,
  private readonly prisma: PrismaService, // Add this
) {}

  @Post('conversations')
  async createConversation(
    @Req() req: AuthRequest,
    @Body() dto: CreateConversationDto,
    
  ) {
    this.logger.log('Create conversation request:', {
      userId: req.user.id,
      mode: dto.mode,
      tier: req.user.tier || 'FREE',
    });

    try {
      const conversation = await this.assistantService.createConversation(
        req.user.id, 
        dto.mode,
      );

      this.logger.log('Conversation created successfully:', {
        conversationId: conversation.id,
        mode: conversation.mode,
      });

      return {
        success: true,
        data: conversation,
        message: 'Conversation created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create conversation:', error);
      throw new BadRequestException(
        error.message || 'Failed to create conversation'
      );
    }
  }

  // GetConversations method to support pagination
@Get('conversations')
async getConversations(
  @Req() req: AuthRequest,
  @Query() query: GetConversationsDto,
) {
  this.logger.log('Get conversations request:', {
    userId: req.user.id,
    tier: req.user.tier || 'FREE',
    filter: query.filter,
    limit: query.limit,
    offset: query.offset,
  });

  try {
    let where: any = { userId: req.user.id, isDeleted: false };
    
    // Apply filters if specified
    if (query.filter) {
      switch (query.filter) {
        case 'active':
          where.active = true;
          where.isArchived = false;
          break;
        case 'archived':
          where.isArchived = true;
          break;
        case 'starred':
          where.isStarred = true;
          break;
        case 'pinned':
          where.isPinned = true;
          break;
        // 'all' is default
      }
    }

    // Set default values if not provided
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const [conversations, total] = await Promise.all([
      this.prisma.assistantConversation.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              messages: {
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
      this.prisma.assistantConversation.count({ where }),
    ]);

    // Apply tier-based limit
    const tierLimit = req.user.tier === 'FREE' ? 10 : 50;
    const limitedConversations = conversations.slice(0, tierLimit);
    const limitedTotal = Math.min(total, tierLimit);

    return {
      success: true,
      data: {
        conversations: limitedConversations,
        pagination: {
          total: limitedTotal,
          limit,
          offset,
          hasMore: limitedTotal > offset + limit,
        },
      },
      count: limitedConversations.length,
      message: 'Conversations retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get conversations:', error);
    throw new BadRequestException(
      error.message || 'Failed to retrieve conversations'
    );
  }
}

  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Req() req: AuthRequest,
    @Param('id') conversationId: string,
  ) {
    this.logger.log('Get conversation messages request:', {
      userId: req.user.id,
      conversationId,
      tier: req.user.tier || 'FREE',
    });

    try {
      const messages = await this.assistantService.getConversationMessages(
        conversationId, 
        req.user.id,
        req.user.tier,
      );

      if (!messages || messages.length === 0) {
        this.logger.warn('No messages found for conversation:', { conversationId });
      }

      return {
        success: true,
        data: messages,
        count: messages.length,
        message: 'Messages retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get conversation messages:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to retrieve messages'
      );
    }
  }

  @Post('message')
  async sendMessage(
    @Req() req: AuthRequest,
    @Body() dto: SendMessageDto,
  ) {
    this.logger.log('Send message request:', {
      userId: req.user.id,
      contentLength: dto.content?.length || 0,
      mode: dto.mode,
      contextIds: dto.contextIds?.length || 0,
      tier: req.user.tier || 'FREE',
    });

    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (dto.content.length > 5000) {
      throw new BadRequestException('Message content too long (max 5000 characters)');
    }

    try {
      const response = await this.assistantService.sendMessage(
        req.user.id, 
        dto, 
        req.user.tier,
      );

      this.logger.log('Message sent successfully:', {
        messageId: response.messageId,
        conversationId: response.conversationId,
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime,
        memoryCreated: response.memoryCreated,
        tier: req.user.tier,
      });

      return {
        success: true,
        data: response,
        message: 'Message sent successfully',
      };
    } catch (error) {
      this.logger.error('Failed to send message:', {
        error: error.message,
        userId: req.user.id,
        contentLength: dto.content?.length,
      });
      
      if (error.message.includes('Rate limit exceeded') || 
          error.message.includes('Daily message limit reached')) {
        throw error; // Let rate limit errors pass through with original status
      }
      
      throw new BadRequestException(
        error.message || 'Failed to send message'
      );
    }
  }

  @Get('memories')
  async getMemories(@Req() req: AuthRequest) {
    this.logger.log('Get memories request:', {
      userId: req.user.id,
      tier: req.user.tier || 'FREE',
    });

    try {
      const memories = await this.assistantService.getMemories(
        req.user.id,
        req.user.tier,
      );

      return {
        success: true,
        data: memories,
        count: memories.length,
        message: 'Memories retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get memories:', error);
      throw new BadRequestException(
        error.message || 'Failed to retrieve memories'
      );
    }
  }

  @Get('analytics')
  async getAnalytics(@Req() req: AuthRequest) {
    this.logger.log('Get analytics request:', {
      userId: req.user.id,
      tier: req.user.tier || 'FREE',
    });

    try {
      const analytics = await this.assistantService.getUserAnalytics(req.user.id);

      if (!analytics) {
        throw new NotFoundException('Analytics not found for user');
      }

      return {
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get analytics:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to retrieve analytics'
      );
    }
  }

  @Get('health')
  async healthCheck() {
    this.logger.log('Health check request');

    try {
      const health = await this.assistantService.healthCheck();
      
      this.logger.log('Health check completed:', {
        database: health.database,
        redis: health.redis,
        groq: health.groq,
        cacheStats: health.cacheStats,
      });

      return {
        success: true,
        data: health,
        message: 'Health check completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  async getAssistantStatus(@Req() req: AuthRequest) {
    this.logger.log('Assistant status request:', {
      userId: req.user.id,
      tier: req.user.tier || 'FREE',
    });

    try {
      const [conversations, memories, analytics] = await Promise.all([
        this.assistantService.getConversations(req.user.id, req.user.tier),
        this.assistantService.getMemories(req.user.id, req.user.tier),
        this.assistantService.getUserAnalytics(req.user.id),
      ]);

      const status = {
        user: {
          id: req.user.id,
          tier: req.user.tier || 'FREE',
          features: this.getFeaturesByTier(req.user.tier),
        },
        usage: {
          conversations: conversations.length,
          memories: memories.length,
          totalMessages: analytics?.totalMessages || 0,
          totalTokens: analytics?.totalTokens || 0,
        },
        limits: this.getLimitsByTier(req.user.tier),
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: status,
        message: 'Assistant status retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get assistant status:', error);
      throw new BadRequestException(
        error.message || 'Failed to retrieve assistant status'
      );
    }
  }

   @Get('memories/search')
  async searchMemories(
    @Req() req: AuthRequest,
    @Query() searchDto: SearchMemoriesDto, // Query validation
  ) {
    this.logger.log('Search memories request:', {
      userId: req.user.id,
      query: searchDto.query,
      tier: req.user.tier || 'FREE',
    });

    try {
      // You'll need to add this method to your service
      const memories = await this.assistantService.searchMemories(
        req.user.id,
        searchDto,
        req.user.tier,
      );

      return {
        success: true,
        data: memories,
        count: memories.length,
        message: 'Memories search completed',
      };
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw new BadRequestException(
        error.message || 'Failed to search memories'
      );
    }
  }

  // Server-Sent Events for real-time updates
  @Sse('updates')
  sse(@Req() req: AuthRequest): Observable<MessageEvent> {
    this.logger.log('SSE connection established:', { userId: req.user.id });

    return new Observable<MessageEvent>((subscriber) => {
      // Send initial connection event
      subscriber.next({
        data: {
          event: 'connected',
          userId: req.user.id,
          timestamp: new Date().toISOString(),
          tier: req.user.tier || 'FREE',
        },
      });

      // Send heartbeat every 30 seconds
      const intervalId = setInterval(() => {
        subscriber.next({
          data: {
            event: 'heartbeat',
            timestamp: new Date().toISOString(),
            message: 'Assistant is connected',
          },
        });
      }, 30000);

      // Cleanup on disconnect
      return () => {
        clearInterval(intervalId);
        this.logger.log('SSE connection closed:', { userId: req.user.id });
      };
    });
  }

  // Stream messages for real-time AI responses
  @Post('message/stream')
  async sendMessageStream(
    @Req() req: AuthRequest,
    @Body() dto: SendMessageDto,
  ): Promise<Observable<MessageEvent>> {
    this.logger.log('Stream message request:', {
      userId: req.user.id,
      contentLength: dto.content?.length || 0,
      tier: req.user.tier || 'FREE',
    });

    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    return new Observable<MessageEvent>((subscriber) => {
      // Implementation would use Groq's streaming API
      // This is a placeholder - you'd need to implement the actual streaming
      
      subscriber.next({
        data: {
          event: 'start',
          timestamp: new Date().toISOString(),
          message: 'Starting stream response...',
        },
      });

      // Simulate streaming response
      const words = dto.content.split(' ');
      let index = 0;
      
      const intervalId = setInterval(() => {
        if (index < words.length) {
          subscriber.next({
            data: {
              event: 'chunk',
              chunk: words[index] + ' ',
              index,
              total: words.length,
            },
          });
          index++;
        } else {
          subscriber.next({
            data: {
              event: 'complete',
              timestamp: new Date().toISOString(),
              message: 'Stream completed',
            },
          });
          subscriber.complete();
          clearInterval(intervalId);
        }
      }, 100);

      // Cleanup
      return () => {
        clearInterval(intervalId);
        this.logger.log('Stream connection closed:', { userId: req.user.id });
      };
    });
  }

  // Get conversation statistics
  @Get('conversations/:id/stats')
  async getConversationStats(
    @Req() req: AuthRequest,
    @Param('id') conversationId: string,
  ) {
    this.logger.log('Get conversation stats request:', {
      userId: req.user.id,
      conversationId,
    });

    try {
      const messages = await this.assistantService.getConversationMessages(
        conversationId, 
        req.user.id,
        req.user.tier,
      );

      if (!messages || messages.length === 0) {
        throw new NotFoundException('Conversation not found or no messages');
      }

      const stats = {
        totalMessages: messages.length,
        userMessages: messages.filter((m: any) => m.role === 'user').length,
        assistantMessages: messages.filter((m: any) => m.role === 'assistant').length,
        firstMessage: messages[0]?.createdAt,
        lastMessage: messages[messages.length - 1]?.createdAt,
        estimatedTokens: messages.reduce((sum: number, msg: any) => sum + (msg.tokens || 0), 0),
        topics: this.extractTopics(messages),
      };

      return {
        success: true,
        data: stats,
        message: 'Conversation statistics retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get conversation stats:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.message || 'Failed to retrieve conversation statistics'
      );
    }
  }

 // clear Conversation method
@Post('conversations/:id/clear')
async clearConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
) {
  this.logger.log('Clear conversation request:', {
    userId: req.user.id,
    conversationId,
  });

  try {
    const result = await this.assistantService.clearConversationMessages(
      conversationId,
      req.user.id,
    );

    this.logger.log('Conversation cleared:', { 
      conversationId,
      clearedMessages: result.clearedMessages,
    });

    return {
      success: true,
      message: 'Conversation cleared successfully',
      data: { 
        conversationId,
        clearedMessages: result.clearedMessages 
      },
    };
  } catch (error) {
    this.logger.error('Failed to clear conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to clear conversation'
    );
  }
}

// Delete conversation (soft or hard)
@Delete('conversations/:id/delete')
async deleteConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: DeleteConversationDto,
) {
  this.logger.log('Delete conversation request:', {
    userId: req.user.id,
    conversationId,
    permanent: dto.permanent,
  });

  try {
    let result;
    
    if (dto.permanent) {
      result = await this.assistantService.hardDeleteConversation(
        conversationId,
        req.user.id,
      );
    } else {
      result = await this.assistantService.softDeleteConversation(
        conversationId,
        req.user.id,
      );
    }

    return {
      success: true,
      message: dto.permanent 
        ? 'Conversation permanently deleted' 
        : 'Conversation moved to trash',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to delete conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to delete conversation'
    );
  }
}


// Get single conversation with details
@Get('conversations/:id')
async getConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
) {
  this.logger.log('Get conversation request:', {
    userId: req.user.id,
    conversationId,
  });

  try {
    const conversation = await this.assistantService.getConversation(
      conversationId,
      req.user.id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      success: true,
      data: conversation,
      message: 'Conversation retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to retrieve conversation'
    );
  }
}



// Restore conversation from trash
@Post('conversations/:id/restore')
async restoreConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: RestoreConversationDto,
) {
  this.logger.log('Restore conversation request:', {
    userId: req.user.id,
    conversationId,
  });

  try {
    const result = await this.assistantService.restoreConversation(
      conversationId,
      req.user.id,
    );

    return {
      success: true,
      message: 'Conversation restored successfully',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to restore conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to restore conversation'
    );
  }
}

// Archive/Unarchive conversation
@Patch('conversations/:id/archive')
async archiveConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: ArchiveConversationDto,
) {
  this.logger.log('Archive conversation request:', {
    userId: req.user.id,
    conversationId,
    archive: dto.archive,
  });

  try {
    let result;
    
    if (dto.archive) {
      result = await this.assistantService.archiveConversation(
        conversationId,
        req.user.id,
      );
    } else {
      result = await this.assistantService.unarchiveConversation(
        conversationId,
        req.user.id,
      );
    }

    return {
      success: true,
      message: dto.archive 
        ? 'Conversation archived' 
        : 'Conversation unarchived',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to archive conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to archive conversation'
    );
  }
}

// Star/Unstar conversation
@Patch('conversations/:id/star')
async starConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: StarConversationDto,
) {
  this.logger.log('Star conversation request:', {
    userId: req.user.id,
    conversationId,
    star: dto.star,
  });

  try {
    const result = await this.assistantService.toggleStarConversation(
      conversationId,
      req.user.id,
      dto.star,
    );

    return {
      success: true,
      message: dto.star 
        ? 'Conversation starred' 
        : 'Conversation unstarred',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to star conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to star conversation'
    );
  }
}

// Pin/Unpin conversation
@Patch('conversations/:id/pin')
async pinConversation(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: PinConversationDto,
) {
  this.logger.log('Pin conversation request:', {
    userId: req.user.id,
    conversationId,
    pin: dto.pin,
  });

  try {
    const result = await this.assistantService.togglePinConversation(
      conversationId,
      req.user.id,
      dto.pin,
    );

    return {
      success: true,
      message: dto.pin 
        ? 'Conversation pinned' 
        : 'Conversation unpinned',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to pin conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to pin conversation'
    );
  }
}

// Update conversation title
@Patch('conversations/:id/title')
async updateConversationTitle(
  @Req() req: AuthRequest,
  @Param('id') conversationId: string,
  @Body() dto: UpdateConversationTitleDto,
) {
  this.logger.log('Update conversation title:', {
    userId: req.user.id,
    conversationId,
    title: dto.title,
  });

  try {
    const result = await this.assistantService.updateConversationTitle(
      conversationId,
      req.user.id,
      dto.title,
    );

    return {
      success: true,
      message: 'Conversation title updated',
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to update conversation title:', error);
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to update conversation title'
    );
  }
}

// Get deleted conversations (trash)
@Get('conversations/trash')
async getTrash(
  @Req() req: AuthRequest,
  @Query() query: GetConversationsDto,
) {
  this.logger.log('Get trash request:', {
    userId: req.user.id,
  });

  try {
    const result = await this.assistantService.getDeletedConversations(
      req.user.id,
      query.limit,
      query.offset,
    );

    return {
      success: true,
      data: result,
      message: 'Trash retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get trash:', error);
    throw new BadRequestException(
      error.message || 'Failed to retrieve deleted conversations'
    );
  }
}

// Empty trash
@Delete('conversations/trash/empty')
async emptyTrash(
  @Req() req: AuthRequest,
  @Body() dto: EmptyTrashDto,
) {
  this.logger.log('Empty trash request:', {
    userId: req.user.id,
    confirm: dto.confirm,
  });

  if (!dto.confirm) {
    throw new BadRequestException(
      'Please confirm you want to empty the trash'
    );
  }

  try {
    const result = await this.assistantService.emptyTrash(req.user.id);

    return {
      success: true,
      message: `Trash emptied successfully. ${result.deletedCount} items permanently deleted.`,
      data: result,
    };
  } catch (error) {
    this.logger.error('Failed to empty trash:', error);
    throw new BadRequestException(
      error.message || 'Failed to empty trash'
    );
  }
}

// Get conversation analytics
@Get('conversations/analytics')
async getConversationAnalytics(
  @Req() req: AuthRequest,
  @Query() query: GetConversationAnalyticsDto,
) {
  this.logger.log('Get conversation analytics:', {
    userId: req.user.id,
    timeframe: query.timeframe,
  });

  try {
    const analytics = await this.assistantService.getConversationAnalytics(
      req.user.id,
      query.timeframe,
    );

    return {
      success: true,
      data: analytics,
      message: 'Conversation analytics retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get analytics:', error);
    throw new BadRequestException(
      error.message || 'Failed to retrieve conversation analytics'
    );
  }
}

// Get conversations with filtering (enhanced version)
@Get('conversations/filter')
async getFilteredConversations(
  @Req() req: AuthRequest,
  @Query() query: GetConversationsDto,
) {
  this.logger.log('Get filtered conversations request:', {
    userId: req.user.id,
    filter: query.filter,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  });

  try {
    let where: any = { userId: req.user.id };

    switch (query.filter) {
      case 'active':
        where.isDeleted = false;
        where.active = true;
        where.isArchived = false;
        break;
      case 'archived':
        where.isDeleted = false;
        where.isArchived = true;
        break;
      case 'deleted':
        where.isDeleted = true;
        break;
      case 'starred':
        where.isDeleted = false;
        where.isStarred = true;
        break;
      case 'pinned':
        where.isDeleted = false;
        where.isPinned = true;
        break;
      case 'all':
      default:
        where.isDeleted = false;
        break;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Set defaults
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const [conversations, total] = await Promise.all([
      this.prisma.assistantConversation.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              messages: {
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
      this.prisma.assistantConversation.count({ where }),
    ]);

    return {
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit,
        },
      },
      message: 'Conversations retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get filtered conversations:', error);
    throw new BadRequestException(
      error.message || 'Failed to retrieve conversations'
    );
  }
}



// Add this private method for content type detection
private getContentType(format?: string): string {
  const actualFormat = format || 'json';
  switch (actualFormat) {
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    default:
      return 'application/octet-stream';
  }
}


  // Helper methods
  private getFeaturesByTier(tier?: string) {
    switch (tier) {
      case 'ADMIN':
        return {
          unlimitedMessages: true,
          advancedMemory: true,
          priorityProcessing: true,
          customModels: true,
          maxTokens: 8000,
          contextSize: 50,
          streaming: true,
          fileUploads: true,
          customInstructions: true,
        };
      case 'PREMIUM':
        return {
          unlimitedMessages: true,
          advancedMemory: true,
          priorityProcessing: true,
          customModels: false,
          maxTokens: 4000,
          contextSize: 10,
          streaming: true,
          fileUploads: true,
          customInstructions: true,
        };
      case 'FREE':
      default:
        return {
          unlimitedMessages: false,
          advancedMemory: false,
          priorityProcessing: false,
          customModels: false,
          maxTokens: 1000,
          contextSize: 5,
          streaming: false,
          fileUploads: false,
          customInstructions: false,
        };
    }
  }

  private getLimitsByTier(tier?: string) {
    switch (tier) {
      case 'ADMIN':
        return {
          dailyMessages: 'Unlimited',
          rateLimit: 'Unlimited',
          memoryStorage: 'Unlimited',
          conversationHistory: 'Unlimited',
          fileSize: '100MB',
        };
      case 'PREMIUM':
        return {
          dailyMessages: 'Unlimited',
          rateLimit: '100/min',
          memoryStorage: '1000 memories',
          conversationHistory: '500 messages/conv',
          fileSize: '50MB',
        };
      case 'FREE':
      default:
        return {
          dailyMessages: '10/day',
          rateLimit: '5/min',
          memoryStorage: '10 memories',
          conversationHistory: '50 messages/conv',
          fileSize: '10MB',
        };
    }
  }
  
@Get('user-info')
async getUserInfo(
  @Req() req: AuthRequest,
) {
  this.logger.log('Get user info request:', {
    userId: req.user.id,
    tier: req.user.tier || 'FREE',
  });

  try {
    const tier = req.user.tier || 'FREE';
    let rateLimitInfo = null;
    let dailyUsage = 0;
    
    if (tier === 'FREE') {
      // Get today's message count across ALL modes
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const cacheKey = `ratelimit:daily:${req.user.id}:${startOfDay.toISOString().split('T')[0]}`;
      
      try {
        const cachedCount = await this.assistantService['cacheService'].getCachedData(cacheKey);
        dailyUsage = cachedCount ? parseInt(cachedCount) || 0 : 0;
        
        // Set resetTime to midnight
        const resetTime = new Date();
        resetTime.setHours(24, 0, 0, 0);
        
        rateLimitInfo = {
          remaining: Math.max(0, 10 - dailyUsage),
          limit: 10,
          resetTime: resetTime.toISOString(),
          usage: dailyUsage,
        };
      } catch (cacheError) {
        this.logger.warn('Failed to get rate limit info:', cacheError);
        // Set default for FREE users with midnight reset
        const resetTime = new Date();
        resetTime.setHours(24, 0, 0, 0);
        
        rateLimitInfo = {
          remaining: 10,
          limit: 10,
          resetTime: resetTime.toISOString(),
          usage: 0,
        };
      }
    }

    // Get total conversations and messages for status
    const [totalConversations, totalMessages] = await Promise.all([
      this.prisma.assistantConversation.count({
        where: { userId: req.user.id, isDeleted: false },
      }),
      this.prisma.assistantMessage.count({
        where: {
          conversation: { userId: req.user.id, isDeleted: false },
          isDeleted: false,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        userId: req.user.id,
        userTier: tier,
        userEmail: req.user.email,
        userName: req.user.name || req.user.email?.split('@')[0] || 'User',
        features: this.getFeaturesByTier(tier),
        rateLimitInfo,
        analytics: {
          dailyUsage,
          totalConversations,
          totalMessages,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'User info retrieved successfully',
    };
  } catch (error) {
    this.logger.error('Failed to get user info:', error);
    
    // Fallback response with midnight reset
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0);
    
    return {
      success: true,
      data: {
        userId: req.user.id,
        userTier: 'FREE',
        userEmail: req.user.email,
        userName: req.user.name || req.user.email?.split('@')[0] || 'User',
        features: this.getFeaturesByTier('FREE'),
        rateLimitInfo: {
          remaining: 10,
          limit: 10,
          resetTime: resetTime.toISOString(),
          usage: 0,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'Using fallback user info',
    };
  }
}

// Update getRateLimit method
@Get('rate-limit')
async getRateLimit(
  @Req() req: AuthRequest,
) {
  this.logger.log('Get rate limit request:', {
    userId: req.user.id,
    tier: req.user.tier || 'FREE',
  });

  try {
    const tier = req.user.tier || 'FREE';
    
    if (tier === 'FREE') {
      // Get today's message count
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const cacheKey = `ratelimit:daily:${req.user.id}:${startOfDay.toISOString().split('T')[0]}`;
      
      let dailyUsage = 0;
      try {
        // Use getCachedData to get the count
        const cachedCount = await this.assistantService['cacheService'].getCachedData(cacheKey);
        dailyUsage = cachedCount ? parseInt(cachedCount) || 0 : 0;
      } catch (cacheError) {
        this.logger.warn('Failed to get daily usage from cache:', cacheError);
      }

      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0); // Reset at midnight

      return {
        success: true,
        data: {
          remaining: Math.max(0, 10 - dailyUsage),
          limit: 10,
          usage: dailyUsage,
          resetTime: resetTime.toISOString(),
          resetInHours: Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60)),
          tier: 'FREE',
          isLimited: dailyUsage >= 10,
        },
        message: 'Rate limit retrieved successfully',
      };
    } else {
      // Premium/Admin users have no limits
      return {
        success: true,
        data: {
          remaining: 9999, // High number instead of MAX_SAFE_INTEGER
          limit: 9999,
          usage: 0,
          tier: tier,
          isLimited: false,
          unlimited: true,
        },
        message: 'No rate limits for premium tier',
      };
    }
  } catch (error) {
    this.logger.error('Failed to get rate limit:', error);
    
    // Fallback for FREE users
    return {
      success: true,
      data: {
        remaining: 10,
        limit: 10,
        usage: 0,
        tier: 'FREE',
        isLimited: false,
      },
      message: 'Using default rate limit',
    };
  }
}

  private extractTopics(messages: any[]): string[] {
    const topics = new Set<string>();
    
    messages.forEach((msg, index) => {
      if (index < 3 && msg.content) {
        const words = msg.content.split(/\s+/);
        if (words.length > 3) {
          const potentialTopic = words.slice(0, 3).join(' ');
          topics.add(potentialTopic);
        }
      }
    });

    return Array.from(topics).slice(0, 5); // Return max 5 topics
  }

 @Get('latest-conversation')
async getLatestConversation(@Req() req: AuthRequest) {
  try {
    // Get the LATEST conversation that ACTUALLY HAS MESSAGES
    const conversationWithMessages = await this.prisma.assistantConversation.findFirst({
      where: {
        userId: req.user.id,
        isDeleted: false,
        messages: { 
          some: { 
            isDeleted: false 
          } 
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    // If no conversation with messages, return null
    if (!conversationWithMessages) {
      return {
        success: true,
        data: null,
        message: 'No previous conversations found',
      };
    }

    // Return simple, clean data
    return {
      success: true,
      data: {
        id: conversationWithMessages.id,
        title: conversationWithMessages.title,
        mode: conversationWithMessages.mode,
        messages: conversationWithMessages.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      },
    };
  } catch (error) {
    console.error('Error getting latest conversation:', error);
    return {
      success: false,
      message: 'Failed to load conversation',
    };
  }
}


}