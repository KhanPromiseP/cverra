export interface ActivityResponse {
  id: string;
  type: 'VIEW' | 'LIKE' | 'SAVE' | 'COMMENT' | 'READING_SESSION';
  article?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string;
    category?: {
      name: string;
      color: string;
    };
  };
  timestamp: string;
  duration?: number;
  metadata?: {
    comment?: string;
    likes?: number;
    sharePlatform?: string;
  };
}

export interface AchievementResponse {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  progress: number;
  totalRequired: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: 'READING' | 'ENGAGEMENT' | 'COMMUNITY' | 'PREMIUM' | 'MILESTONE';
  points: number;
  shareable?: boolean;
  shareImage?: string;
  shareText?: string;
  shareUrl?: string;
}

export interface AchievementStatsResponse {
  totalPoints: number;
  unlockedAchievements: number;
  totalAchievements: number;
  nextMilestone: {
    name: string;
    pointsNeeded: number;
    progress: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
    color: string;
  }>;
  recentUnlocks: AchievementResponse[];
}

export interface ReadingStatsResponse {
  today: {
    articlesRead: number;
    readingTime: number;
    likesGiven: number;
    commentsMade: number;
  };
  week: {
    streakDays: number;
    totalArticles: number;
    totalTime: number;
    progress: number;
  };
  topCategories: Array<{
    name: string;
    count: number;
    color: string;
  }>;
}