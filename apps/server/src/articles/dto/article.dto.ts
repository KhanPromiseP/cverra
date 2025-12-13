// article.dto.ts - CORRECTED VERSION
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsObject,
  IsDate,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { ContentAccess, ArticleStatus as PrismaArticleStatus } from '@prisma/client';

// Use Prisma's ArticleStatus directly
export { PrismaArticleStatus as ArticleStatus };

// ========== CREATE ARTICLE DTO ==========
export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsNotEmpty()
  @IsObject()
  content: any;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @IsOptional()
  tags: string[] = [];

  @IsEnum(ContentAccess)
  @IsOptional()
  accessType: ContentAccess = ContentAccess.FREE;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coinPrice?: number = 0;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  autoTranslate?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetLanguages?: string[] = ['fr'];

  @IsOptional()
  @IsString()
  language?: string = 'en';
}

// ========== UPDATE ARTICLE DTO ==========
export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @IsOptional()
  @IsEnum(PrismaArticleStatus)
  status?: PrismaArticleStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isTrending?: boolean;

  @IsOptional()
  @IsBoolean()
  isEditorPick?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commentCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shareCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saveCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  clapCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  uniqueViewCount?: number;

  @IsOptional()
  @IsString()
  plainText?: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

// ========== RESPONSE DTOs ==========
export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  articleCount?: number;
  isActive?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuthorResponseDto {
  id: string;
  name: string;
  username: string;
  picture?: string | null;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ArticleResponseDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: any;
  plainText?: string | null;
  category: CategoryResponseDto;
  tags: string[];
  accessType: ContentAccess;
  coinPrice: number;
  author: AuthorResponseDto;
  authorId?: string;
  coverImage?: string | null;
  featuredImage?: string | null;
  readingTime: number;
  status: PrismaArticleStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isEditorPick?: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  saveCount?: number;
  clapCount?: number;
  uniqueViewCount?: number;
  publishedAt?: Date | null;
  scheduledFor?: Date | null;
  availableLanguages?: string[];
  targetLanguages?: string[];
  autoTranslate?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields that might not always be present
  isLiked?: boolean;
  isSaved?: boolean;
  isShared?: boolean;
  
  // Optional fields from your service return
  wordCount?: number;
  characterCount?: number;
  estimatedReadTime?: number;
  preview?: string;
  lastTrendingAt?: Date | null;
  
  // Make other optional fields optional
  translations?: any[];
  requiresPurchase?: boolean;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  engagementScore?: number;
  trendingScore?: number;
  isTranslated?: boolean;
  translationLanguage?: string | null;
  translationQuality?: number | null;
  translationConfidence?: number | null;
  translationNeedsReview?: boolean | null;
  isPreview?: boolean;
}

export class SaveArticleDto {
  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class TrackViewDto {
  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class ArticleListDto {
  articles: ArticleResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages?: number;
  filters?: {
    category?: string;
    tag?: string;
    status?: PrismaArticleStatus;
    accessType?: ContentAccess;
    featured?: boolean;
    trending?: boolean;
  };
}

export class TriggerTranslationDto {
  @IsArray()
  @IsString({ each: true })
  languages: string[];
}

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  language?: string = 'en';
}