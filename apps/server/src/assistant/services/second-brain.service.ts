// src/modules/assistant/services/second-brain.service.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { BrainItemType, BrainItemStatus } from '@prisma/client';

interface OrganizedItem {
  type: BrainItemType;
  title: string;
  content: string;
  tags: string[];
  category: string;
  priority: number;
  linkedGoals?: string[];
  linkedArticles?: string[];
  isProject?: boolean;
  milestones?: any[];
}

@Injectable()
export class SecondBrainService {
  private readonly logger = new Logger(SecondBrainService.name);
  
  // Track last connection discovery per user
  private lastDiscoveryTime: Map<string, number> = new Map();
  private readonly MIN_DISCOVERY_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
  ) {}
  
  // ==================== PUBLIC API METHODS ====================

  /**
   * Process a brain dump - organize random thoughts
   */
  async processBrainDump(
    userId: string,
    dump: string,
    conversationId?: string,
  ): Promise<OrganizedItem[]> {
    try {
      const prompt = `
You are a second brain organizer. Organize this brain dump into structured items:

Brain dump: "${dump}"

Analyze and organize into:
- THOUGHT: passing thoughts, reflections
- IDEA: creative ideas, possibilities
- NOTE: information to remember
- TODO: tasks to do
- PROJECT: multi-step endeavors
- QUESTION: questions to explore
- INSIGHT: key learnings or realizations
- REFERENCE: things to reference later

For each item, extract:
- Type (from above)
- Title (concise, descriptive)
- Content (the full thought)
- Tags (2-4 relevant tags)
- Category (auto-detected: career, learning, personal, etc.)
- Priority (1-5)
- If it's a project, identify potential milestones
- Link to any mentioned goals or articles

Return as JSON array:
[
  {
    "type": "IDEA",
    "title": "...",
    "content": "...",
    "tags": ["tag1", "tag2"],
    "category": "career",
    "priority": 3,
    "isProject": false,
    "milestones": [],
    "linkedGoals": ["goal description if mentioned"],
    "linkedArticles": ["article title if mentioned"]
  }
]
`;

      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'GENERAL_ASSISTANT',
        { temperature: 0.5 }
      );

      if (response.isFallback || !response.content) {
        return [];
      }

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const organized = JSON.parse(jsonMatch[0]) as OrganizedItem[];

      // Get existing items for relationship detection
      const existingItems = await this.prisma.assistantBrainItem.findMany({
        where: { 
          userId, 
          status: 'ACTIVE' 
        },
        select: { 
          id: true, 
          title: true, 
          content: true, 
          tags: true,
          type: true 
        },
        take: 50,
      });

      // Save each organized item with relationships
      const savedItems = [];
      for (const item of organized) {
        const saved = await this.saveBrainItem(userId, item, conversationId, existingItems);
        if (saved) savedItems.push(saved);
      }

      return savedItems;
    } catch (error) {
      this.logger.error('Brain dump processing failed:', error);
      return [];
    }
  }

  /**
   * Get brain items with linked items populated for Knowledge Graph
   */
  async getBrainItems(
    userId: string,
    filters?: {
      type?: BrainItemType;
      status?: BrainItemStatus;
      category?: string;
      tags?: string[];
      priority?: number;
      search?: string;
    },
  ): Promise<any[]> {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.assistantBrainItem.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { isStarred: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Populate linked items for Knowledge Graph
    return this.populateLinkedItems(items);
  }

  /**
   * Get project with all its tasks/notes
   */
  async getProject(userId: string, projectId: string): Promise<any> {
    const project = await this.prisma.assistantBrainItem.findFirst({
      where: {
        id: projectId,
        userId,
        type: 'PROJECT',
      },
    });

    if (!project) return null;

    const relatedItems = await this.prisma.assistantBrainItem.findMany({
      where: {
        userId,
        OR: [
          { parentId: projectId },
          { linkedItems: { has: projectId } },
        ],
      },
    });

    return {
      ...project,
      tasks: relatedItems.filter(i => i.type === 'TODO'),
      notes: relatedItems.filter(i => i.type === 'NOTE'),
      ideas: relatedItems.filter(i => i.type === 'IDEA'),
      all: relatedItems,
    };
  }

  /**
   * Convert item to project
   */
  async convertToProject(userId: string, itemId: string): Promise<any> {
    const item = await this.prisma.assistantBrainItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) throw new Error('Item not found');

    // Use AI to suggest project structure
    const prompt = `
Convert this item into a project with milestones:

Item: ${item.title} - ${item.content}
Type: ${item.type}

Suggest 3-5 logical milestones for this project, ordered by sequence.
Return as JSON array of milestone descriptions.
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
      { temperature: 0.5 }
    );

    let milestones: string[] = [];
    if (!response.isFallback && response.content) {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        milestones = JSON.parse(jsonMatch[0]);
      }
    }

    // Convert to project
    return this.prisma.assistantBrainItem.update({
      where: { id: itemId },
      data: {
        type: 'PROJECT',
        projectPhase: 'planning',
        milestones: milestones.map((desc, idx) => ({
          description: desc,
          completed: false,
          order: idx + 1,
        })),
      },
    });
  }

  /**
   * Suggest connections for a specific item (lightweight version)
   */
  async suggestConnections(userId: string, itemId: string): Promise<any[]> {
    const item = await this.prisma.assistantBrainItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) return [];

    // Simple tag-based connection suggestion (no API call)
    const otherItems = await this.prisma.assistantBrainItem.findMany({
      where: {
        userId,
        id: { not: itemId },
        status: 'ACTIVE',
      },
      take: 10,
    });

    // Find items with shared tags
    const itemTags = new Set(item.tags || []);
    const connections = otherItems
      .filter(other => {
        const otherTags = new Set(other.tags || []);
        const sharedTags = [...itemTags].filter(tag => otherTags.has(tag));
        return sharedTags.length > 0;
      })
      .slice(0, 5);

    return connections;
  }

  /**
   * Connect items by shared tags (simpler alternative)
   */
  async connectByTags(userId: string): Promise<{ updated: number }> {
    const items = await this.prisma.assistantBrainItem.findMany({
      where: { userId },
      select: { id: true, tags: true }
    });

    let updatedCount = 0;

    for (const item of items) {
      const related = items
        .filter(other => other.id !== item.id)
        .filter(other => 
          other.tags.some(tag => item.tags.includes(tag))
        )
        .map(other => other.id);

      if (related.length > 0) {
        await this.prisma.assistantBrainItem.update({
          where: { id: item.id },
          data: { linkedItems: related.slice(0, 5) }
        });
        updatedCount++;
      }
    }

    return { updated: updatedCount };
  }

  // ==================== CRON-BATCH METHODS ====================

  /**
   * Discover connections between brain items (called by cron)
   */
  async discoverConnections(userId: string): Promise<number> {
    try {
      // Check rate limiting
      const lastDiscovery = this.lastDiscoveryTime.get(userId) || 0;
      if (Date.now() - lastDiscovery < this.MIN_DISCOVERY_INTERVAL) {
        this.logger.debug(`Skipping connection discovery for user ${userId} - too soon`);
        return 0;
      }

      this.logger.debug(`Discovering connections for user ${userId}`);
      
      // Get all active brain items
      const items = await this.prisma.assistantBrainItem.findMany({
        where: { 
          userId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          type: true,
          linkedItems: true,
        },
      });

      if (items.length < 3) return 0;

      let connectionsFound = 0;

      // Process in batches to avoid overwhelming the API
      for (let i = 0; i < items.length; i += 5) {
        const batch = items.slice(i, i + 5);
        
        for (const item of batch) {
          const otherItems = items.filter(other => other.id !== item.id);
          
          // Find potential connections
          const connectedIds = await this.findBatchConnections(
            userId,
            item,
            otherItems.slice(0, 10) // Limit to 10 for performance
          );

          if (connectedIds.length > 0) {
            // Merge with existing connections
            const existingLinks = (item.linkedItems as string[]) || [];
            const newLinks = [...new Set([...existingLinks, ...connectedIds])].slice(0, 10);
            
            // Update the item with new connections
            await this.prisma.assistantBrainItem.update({
              where: { id: item.id },
              data: {
                linkedItems: newLinks,
              },
            });
            
            connectionsFound += connectedIds.length;
          }
        }
      }

      this.lastDiscoveryTime.set(userId, Date.now());
      return connectionsFound;
    } catch (error) {
      this.logger.error('Connection discovery failed:', error);
      return 0;
    }
  }

  /**
   * Find potential connections for an item (batch version)
   */
  private async findBatchConnections(
    userId: string,
    item: any,
    candidates: any[]
  ): Promise<string[]> {
    if (candidates.length === 0) return [];

    const prompt = `
Find connections between this item and other items in the user's Second Brain.

Item:
Title: ${item.title || 'Untitled'}
Content: ${(item.content || '').substring(0, 200)}
Tags: ${item.tags?.join(', ') || 'none'}
Type: ${item.type}

Candidate items:
${candidates.map((c, idx) => 
  `${idx + 1}. Title: ${c.title || 'Untitled'}\n   Content: ${(c.content || '').substring(0, 100)}\n   Tags: ${c.tags?.join(', ')}`
).join('\n\n')}

Return a JSON array of indices (1-based) that are strongly connected to the main item.
Consider semantic similarity, complementary ideas, and hierarchical relationships.
Max 3 connections. If none, return [].
`;

    try {
      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'SECOND_BRAIN',
        { temperature: 0.2, maxTokens: 300 }
      );

      if (response.isFallback || !response.content) return [];

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const indices = JSON.parse(jsonMatch[0]) as number[];
      
      // Convert indices to IDs
      return indices
        .map(idx => candidates[idx - 1]?.id)
        .filter(id => id !== undefined);
    } catch (error) {
      this.logger.error('Failed to find connections:', error);
      return [];
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Save brain item to database with relationship detection
   */
  private async saveBrainItem(
    userId: string,
    item: OrganizedItem,
    conversationId?: string,
    existingItems: any[] = []
  ): Promise<any> {
    try {
      // Link to goals if mentioned
      let goalIds: string[] = [];
      if (item.linkedGoals && item.linkedGoals.length > 0) {
        const goals = await this.prisma.assistantGoal.findMany({
          where: {
            userId,
            OR: item.linkedGoals.map(g => ({
              description: { contains: g, mode: 'insensitive' },
            })),
          },
          take: 3,
        });
        goalIds = goals.map(g => g.id);
      }

      // Link to articles if mentioned
      let articleIds: string[] = [];
      if (item.linkedArticles && item.linkedArticles.length > 0) {
        const articles = await this.prisma.article.findMany({
          where: {
            OR: item.linkedArticles.map(a => ({
              title: { contains: a, mode: 'insensitive' },
            })),
          },
          take: 3,
        });
        articleIds = articles.map(a => a.id);
      }

      // Find connections to existing items (only if we have existing items)
      let linkedItemIds: string[] = [];
      if (existingItems.length > 0) {
        // Use tag-based matching for speed (no API call during save)
        linkedItemIds = this.findTagBasedConnections(item, existingItems);
      }

      // Create the brain item - with null safety
      const brainItem = await this.prisma.assistantBrainItem.create({
        data: {
          userId,
          type: item.type,
          title: item.title || item.content.substring(0, 50) || 'Untitled',
          content: item.content || '',
          tags: item.tags || [],
          category: item.category || 'general',
          priority: item.priority || 3,
          status: item.type === 'PROJECT' ? 'ACTIVE' : 'ACTIVE',
          linkedItems: linkedItemIds,
          linkedGoals: goalIds,
          linkedArticles: articleIds,
          ...(item.isProject && {
            projectPhase: 'ideation',
            milestones: item.milestones || [],
          }),
        },
      });

      // If this is from a conversation, update the message
      if (conversationId) {
        await this.prisma.assistantMessage.updateMany({
          where: {
            conversationId,
            content: { contains: item.content.substring(0, 50) },
          },
          data: {
            brainItemCreated: brainItem.id,
          },
        });
      }

      return brainItem;
    } catch (error) {
      this.logger.error('Failed to save brain item:', error);
      return null;
    }
  }

  /**
   * Find connections based on tags (fast, no API call)
   */
  private findTagBasedConnections(newItem: OrganizedItem, existingItems: any[]): string[] {
    const newTags = new Set(newItem.tags || []);
    
    // Score each existing item based on tag overlap
    const scored = existingItems.map(item => {
      const itemTags = new Set(item.tags || []);
      const sharedTags = [...newTags].filter(tag => itemTags.has(tag)).length;
      return {
        id: item.id,
        score: sharedTags,
      };
    });

    // Return top 3 items with shared tags
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.id);
  }

  /**
   * Populate linked items with full objects for Knowledge Graph
   */
  private async populateLinkedItems(items: any[]): Promise<any[]> {
    return Promise.all(
      items.map(async (item) => {
        const linkedIds = (item.linkedItems as string[]) || [];
        
        if (linkedIds.length > 0) {
          const linkedItems = await this.prisma.assistantBrainItem.findMany({
            where: { id: { in: linkedIds } },
            select: { 
              id: true, 
              title: true, 
              type: true,
              tags: true 
            },
          });
          
          return {
            ...item,
            linkedItems: linkedItems,
          };
        }
        
        return item;
      })
    );
  }

  /**
   * Parse JSON safely
   */
  private parseJson(json: any): any {
    if (!json) return null;
    if (typeof json === 'object') return json;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}