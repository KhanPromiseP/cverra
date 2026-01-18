// types/notifications.ts - UPDATED
export type BackendNotificationType = 
  | 'LIKE' | 'COMMENT' | 'COMMENT_REPLY' | 'REPLY'
  | 'ACHIEVEMENT' | 'RECOMMENDATION' | 'SYSTEM'
  | 'DIGEST' | 'READING_MILESTONE' | 'PREMIUM'
  | 'ARTICLE_PUBLISHED' | 'MENTION' | 'FOLLOW';

// Make FrontendNotificationType more flexible
export type FrontendNotificationType = 
  | 'like' | 'comment' | 'reply' | 'follow' 
  | 'achievement' | 'premium' | 'system' 
  | 'digest' | 'reading_milestone' | 'recommendation'
  | string; // Allow any string for flexibility

export interface BackendNotification {
  id: string;
  type: BackendNotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    picture?: string;
    username?: string;
  };
  target?: {
    type: string;
    id: string;
    title?: string;
    slug?: string;
  };
}

export interface FrontendNotification {
  id: string;
  type: FrontendNotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    picture?: string;
  };
  target?: {
    type: 'article' | 'comment' | 'user' | 'dashboard' | 'wallet' | 'features' | 'guide' | 'welcome' | 'resume' | 'cover-letter' | 'achievement' | 'premium' | 'system' | 'digest' | 'reading_milestone' | 'recommendation';
    id: string;
    title?: string;
    slug?: string;
  };
}

// Type guard to check if an object is a BackendNotification
export const isBackendNotification = (obj: any): obj is BackendNotification => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.read === 'boolean' &&
    typeof obj.createdAt === 'string';
};

// Safe conversion function that handles any input
export const convertToFrontendNotification = (input: any): FrontendNotification => {
  try {
    // If it's already a FrontendNotification, return it
    if (input && typeof input.type === 'string' && !input.type.includes('_')) {
      // Define all valid target types
      const validTargetTypes = [
        'article', 'comment', 'user', 'dashboard', 'wallet', 'features', 
        'guide', 'welcome', 'resume', 'cover-letter', 'achievement', 
        'premium', 'system', 'digest', 'reading_milestone', 'recommendation'
      ] as const;
      
      let targetType: typeof validTargetTypes[number] = 'article';
      if (input.target?.type) {
        const normalizedTargetType = input.target.type.toLowerCase();
        if (validTargetTypes.includes(normalizedTargetType as any)) {
          targetType = normalizedTargetType as typeof validTargetTypes[number];
        }
      }

      return {
        id: input.id || '',
        type: input.type.toLowerCase(),
        title: input.title || '',
        message: input.message || '',
        data: input.data || {},
        read: Boolean(input.read),
        createdAt: input.createdAt || new Date().toISOString(),
        actor: input.actor ? {
          id: input.actor.id || '',
          name: input.actor.name || 'User',
          picture: input.actor.picture,
        } : undefined,
        target: input.target ? {
          type: targetType,
          id: input.target.id || '',
          title: input.target.title,
          slug: input.target.slug,
        } : undefined,
      };
    }

    // Handle BackendNotification type conversion
    const typeMap: Record<string, FrontendNotificationType> = {
      'LIKE': 'like',
      'like': 'like',
      'COMMENT': 'comment',
      'comment': 'comment',
      'COMMENT_REPLY': 'reply',
      'REPLY': 'reply',
      'reply': 'reply',
      'ACHIEVEMENT': 'achievement',
      'achievement': 'achievement',
      'RECOMMENDATION': 'recommendation',
      'recommendation': 'recommendation',
      'SYSTEM': 'system',
      'system': 'system',
      'DIGEST': 'digest',
      'digest': 'digest',
      'READING_MILESTONE': 'reading_milestone',
      'reading_milestone': 'reading_milestone',
      'PREMIUM': 'premium',
      'premium': 'premium',
      'ARTICLE_PUBLISHED': 'system',
      'MENTION': 'comment',
      'FOLLOW': 'follow',
      'follow': 'follow',
    };

    // Normalize target type - add all possible types
    const validTargetTypes = [
      'article', 'comment', 'user', 'dashboard', 'wallet', 'features', 
      'guide', 'welcome', 'resume', 'cover-letter', 'achievement', 
      'premium', 'system', 'digest', 'reading_milestone', 'recommendation'
    ] as const;

    let targetType: typeof validTargetTypes[number] = 'article';
    if (input.target?.type) {
      const normalizedTargetType = input.target.type.toLowerCase();
      if (validTargetTypes.includes(normalizedTargetType as any)) {
        targetType = normalizedTargetType as typeof validTargetTypes[number];
      }
    }

    return {
      id: input.id || '',
      type: typeMap[input.type?.toUpperCase()] || 'system',
      title: input.title || '',
      message: input.message || '',
      data: input.data || {},
      read: Boolean(input.read),
      createdAt: input.createdAt || new Date().toISOString(),
      actor: input.actor ? {
        id: input.actor.id || '',
        name: input.actor.name || 'User',
        picture: input.actor.picture,
      } : undefined,
      target: input.target ? {
        type: targetType,
        id: input.target.id || '',
        title: input.target.title,
        slug: input.target.slug,
      } : undefined,
    };
  } catch (error) {
    console.error('Error converting notification:', error, input);
    // Return a safe default
    return {
      id: input?.id || `error-${Date.now()}`,
      type: 'system',
      title: 'Error loading notification',
      message: 'There was an error loading this notification',
      data: {},
      read: false,
      createdAt: new Date().toISOString(),
    };
  }
};

// Alias for backward compatibility
export const convertBackendNotification = convertToFrontendNotification;
export const convertApiNotification = convertToFrontendNotification;