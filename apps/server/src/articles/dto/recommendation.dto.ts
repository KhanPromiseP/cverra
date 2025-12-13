import {
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  IsEnum,
  IsBoolean,
  ArrayMinSize,
  Min,
  Max,
  IsNotEmpty 
} from 'class-validator';

import { ContentAccess } from '@prisma/client'; 

// ========== ENUMS ==========
export enum RecommendationReason {
  SIMILAR_TO_HISTORY = 'SIMILAR_TO_HISTORY',
  POPULAR_IN_CATEGORY = 'POPULAR_IN_CATEGORY',
  TRENDING_NOW = 'TRENDING_NOW',
  SIMILAR_USERS_LIKED = 'SIMILAR_USERS_LIKED',
  BASED_ON_SEARCH = 'BASED_ON_SEARCH',
  EDITORS_PICK = 'EDITORS_PICK',
  COMPLEMENTARY_SKILL = 'COMPLEMENTARY_SKILL',
  CAREER_PATH = 'CAREER_PATH'
}

export enum FeedbackType {
  LIKED = 'LIKED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ALREADY_READ = 'ALREADY_READ',
  NOT_RELEVANT = 'NOT_RELEVANT'
}

export enum EngagementAction {
  VIEW = 'VIEW',
  READ_COMPLETE = 'READ_COMPLETE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  SHARE = 'SHARE',
  SAVE = 'SAVE',
  CLICK_RECOMMENDATION = 'CLICK_RECOMMENDATION',
  DISMISS_RECOMMENDATION = 'DISMISS_RECOMMENDATION'
}

// If ContentAccess is not available from Prisma, can be define as below:
// export enum ContentAccess {
//   FREE = 'FREE',
//   PREMIUM = 'PREMIUM'
// }

// ========== RECOMMENDATION DTOs ==========
export class RecommendationRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  excludeIds?: string[] = [];

  @IsOptional()
  @IsString()
  source?: 'personalized' | 'trending' | 'popular' | 'editors_pick' = 'personalized';

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class RecommendationResponseDto {
  article: any; // Using ArticleResponseDto from article.dto
  score: number;
  reason: RecommendationReason;
  source: string;
  metadata?: any;
}

export class FeedbackDto {
  @IsEnum(FeedbackType)
  feedback: FeedbackType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  articleId?: string;
}

export class UpdateReadingProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  favoriteCategoryIds?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteTags?: string[] = [];

  @IsOptional()
  @IsBoolean()
  notifyNewArticles?: boolean = true;

  @IsOptional()
  @IsBoolean()
  notifyTrending?: boolean = true;

  @IsOptional()
  @IsBoolean()
  notifyPersonalized?: boolean = true;

  @IsOptional()
  @IsString()
  digestFrequency?: 'daily' | 'weekly' | 'none' = 'weekly';

  @IsOptional()
  @IsString()
  preferredReadingTime?: 'morning' | 'afternoon' | 'evening' | 'anytime';

  @IsOptional()
  @IsString()
  difficultyPreference?: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
}

// ========== ENGAGEMENT TRACKING ==========
export class TrackEngagementDto {
  @IsEnum(EngagementAction)
  action: EngagementAction;

  @IsOptional()
  @IsString()
  articleId?: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsNumber()
  readingDuration?: number; // in seconds

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;
}

// ========== SEARCH DTOs ==========
export class SearchArticlesDto {
  @IsString()
  @IsNotEmpty()  
  query: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ContentAccess)
  accessType?: ContentAccess;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: 'relevance' | 'latest' | 'popular' | 'trending' = 'relevance';

  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class SearchResponseDto {
  results: any[]; // Useing ArticleResponseDto from article.dto
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  suggestedQueries?: string[];
  filters?: {
    categories?: Array<{ id: string; name: string; count: number }>;
    tags?: Array<{ tag: string; count: number }>;
  };
}