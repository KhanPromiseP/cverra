


import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  NotFoundException,
  Request,
  Req,
  Patch,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { RecommendationService } from './recommendation.service';
import { EngagementService } from './engagement.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { ContentAccess, TranslationStatus } from '@prisma/client';
import { HttpException } from '@nestjs/common';
import { TranslationService } from './translation.service';

import { ArticleResponseTransformer } from './article-response.transformer';
import { 
  CreateArticleDto, 
  UpdateArticleDto, 
  CommentDto,
  ArticleResponseDto,
  ArticleListDto
} from './dto/article.dto';
import { 
  RecommendationRequestDto, 
  FeedbackDto, 
  UpdateReadingProfileDto,
  SearchArticlesDto 
} from './dto/recommendation.dto';
import { ArticleStatus } from '@prisma/client';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService,
    private readonly recommendationService: RecommendationService,
    private readonly engagementService: EngagementService,
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,

    private readonly articleResponseTransformer: ArticleResponseTransformer,
  ) {}

  // ========== PUBLIC ROUTES ==========

  @Get()
async listArticles(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  @Query('category') category?: string,
  @Query('tag') tag?: string,
  @Query('status') status?: ArticleStatus,
  @Query('accessType') accessType?: string,
  @Query('featured') featured?: string,
  @Query('trending') trending?: string,
  @Query('language') language?: string,     // Primary parameter
  @Query('lang') lang?: string,            // Alternative parameter
  @Query('authorId') authorId?: string,
  @Query('search') search?: string,
): Promise<ArticleListDto> {
  const featuredBool = featured ? featured === 'true' : undefined;
  const trendingBool = trending ? trending === 'true' : undefined;
  
  // Use 'lang' if 'language' is not provided
  const finalLanguage = language || lang;
  
  return this.articleService.listArticles({
    page,
    limit: Math.min(limit, 100),
    category,
    tag,
    status,
    accessType: accessType as any,
    featured: featuredBool,
    trending: trendingBool,
    language: finalLanguage,  // ← Use whichever is provided
    authorId,
    search,
  });
}

  // @Get(':slug')
  // async getArticle(
  //   @Param('slug') slug: string,
  //   @Query('language') language?: string,
  //   @Request() req?: any,
  // ): Promise<ArticleResponseDto> {
  //   const userId = req?.user?.id;
  //   return this.articleService.getArticle(slug, userId, language);
  // }



  @Get('admin/dashboard/stats')
  @UseGuards(JwtGuard, AdminGuard)
  async getDashboardStats(@Query('timeRange') timeRange: string = '7days') {
    return this.articleService.getDashboardStats(timeRange);
  }

  @Get('admin/articles/recent')
  @UseGuards(JwtGuard, AdminGuard)
  async getRecentArticles() {
    return this.articleService.getRecentArticles();
  }

  @Get('admin/articles/top')
  @UseGuards(JwtGuard, AdminGuard)
  async getTopArticles() {
    return this.articleService.getTopArticles();
  }

// In article.controller.ts - getArticle method
@Get(':identifier')
async getArticle(
  @Param('identifier') identifier: string,
  @Query('language') language?: string,
  @Request() req?: any,
): Promise<any> {
  const userId = req?.user?.id;
  
  console.log('🔍 Backend getArticle called:', { identifier, language, userId });
  
  let result;
  
  // Check if identifier is an ID (25 chars like Prisma IDs) or a slug
  const isId = identifier.length === 25 && !identifier.includes('-');
  
  if (isId) {
    console.log('📌 Looking up article by ID:', identifier);
    const article = await this.prisma.article.findUnique({
      where: { id: identifier },
      select: { slug: true }
    });
    
    console.log('📄 Found article by ID:', article);
    
    if (!article) {
      console.log('❌ Article not found with ID:', identifier);
      throw new NotFoundException('Article not found');
    }
    
    result = await this.articleService.getArticle(article.slug, userId, language);
  } else {
    console.log('📌 Looking up article by slug:', identifier);
    result = await this.articleService.getArticle(identifier, userId, language);
  }
  
  console.log('📦 Service returned:', {
    hasResult: !!result,
    resultType: typeof result,
    resultKeys: result ? Object.keys(result) : 'no result'
  });
  
  // Check if result is valid
  if (!result) {
    console.log('⚠️ Service returned null/undefined');
    throw new NotFoundException('Article not found');
  }
  
  // Return consistent response structure
  const response = {
    success: true,
    data: result,
    message: 'Article loaded successfully',
  };
  
  console.log('✅ Sending response:', {
    status: 200,
    dataKeys: Object.keys(result),
    responseLength: JSON.stringify(response).length
  });
  
  return response;
}

  @Put(':identifier')
  @UseGuards(JwtGuard)
  async updateArticle(
    @Param('identifier') identifier: string,
    @Request() req: any,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<any> {
    const userId = req.user.id;
    
    let slug: string;
    
    if (identifier.length === 25 && !identifier.includes('-')) {
      const article = await this.prisma.article.findUnique({
        where: { id: identifier },
        select: { slug: true }
      });
      
      if (!article) {
        throw new NotFoundException('Article not found');
      }
      
      slug = article.slug;
    } else {
      slug = identifier;
    }
    
    const result = await this.articleService.updateArticle(slug, userId, updateArticleDto);
    
    // Use the transformer
    return this.articleResponseTransformer.transform(result);
  }

  // ========== CATEGORY MANAGEMENT ==========


@Get('categories/all')
async getAllCategories(@Query('language') language?: string) {
  console.log('🎯 Controller: getAllCategories called with language:', language);
  
  try {
    const categories = await this.categoryService.getAllCategories(language);
    
    console.log('🎯 Controller: Returning', categories.length, 'categories');
    if (categories.length > 0) {
      console.log('🎯 First category:', {
        name: categories[0].name,
        isTranslated: categories[0].isTranslated,
        translationLanguage: categories[0].translationLanguage
      });
    }
    
    return {
      success: true,
      data: categories,
      count: categories.length,
      language: language || 'en',
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      message: 'Failed to load categories',
      error: error.message,
    };
  }
}

@Get('category/:identifier')
async getCategory(
  @Param('identifier') identifier: string,
  @Query('language') language?: string,
) {
  try {
    const category = await this.categoryService.getCategoryBySlug(identifier, language);
    return {
      success: true,
      data: category,
      language: language || 'en',
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return {
      success: false,
      message: 'Category not found',
      error: error.message,
    };
  }
}

  @Post('categories/create') 
  @UseGuards(JwtGuard, AdminGuard) // Apply guards at method level like AdminController
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    // Note: No need to check user.role here - AdminGuard already did that
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put('categories/:id')
  @UseGuards(JwtGuard, AdminGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    // AdminGuard already validated admin access
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtGuard, AdminGuard)
  async deleteCategory(
    @Param('id') id: string,
  ) {
    // AdminGuard already validated admin access
    return this.categoryService.deleteCategory(id);
  }

  // In your article.controller.ts

@Get('categories/:id/translations')
@UseGuards(JwtGuard, AdminGuard)
async getCategoryTranslations(@Param('id') categoryId: string) {
  // First check if category exists
  const categoryExists = await this.prisma.articleCategory.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });

  if (!categoryExists) {
    throw new NotFoundException('Category not found');
  }

  const translations = await this.prisma.categoryTranslation.findMany({
    where: { categoryId },
    orderBy: { language: 'asc' },
  });
  
  return {
    success: true,
    data: translations,
    count: translations.length,
  };
}

@Put('translations/category/:id')
@UseGuards(JwtGuard, AdminGuard)
async updateCategoryTranslation(
  @Param('id') translationId: string,
  @Body() body: { 
    name?: string; 
    description?: string; 
    needsReview?: boolean 
  }
) {
  return this.prisma.categoryTranslation.update({
    where: { id: translationId },
    data: {
      ...body,
      updatedAt: new Date(),
    },
  });
}

@Post('translations/category/:id/regenerate')
@UseGuards(JwtGuard, AdminGuard)
async regenerateCategoryTranslation(@Param('id') translationId: string) {
  const translation = await this.prisma.categoryTranslation.findUnique({
    where: { id: translationId },
    include: { category: true },
  });
  
  if (!translation) {
    throw new NotFoundException('Translation not found');
  }
  
  // Trigger background regeneration
  // You'll need to implement this logic similar to article translations
  return {
    success: true,
    message: 'Translation regeneration started',
    translationId: translation.id,
  };
}

@Post('categories/:id/generate-translations')
@UseGuards(JwtGuard, AdminGuard)
async generateCategoryTranslations(@Param('id') categoryId: string) {
  const category = await this.prisma.articleCategory.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      description: true,
      autoTranslate: true,
      targetLanguages: true,
    },
  });

  if (!category) {
    throw new NotFoundException('Category not found');
  }

  if (!category.autoTranslate) {
    throw new BadRequestException('Auto-translation is disabled for this category');
  }

  if (!category.targetLanguages || category.targetLanguages.length === 0) {
    throw new BadRequestException('No target languages configured for this category');
  }

  // Queue translation generation in background
  this.categoryService.queueCategoryTranslations(
    categoryId, 
    category.targetLanguages
  );

  return {
    success: true,
    message: `Started translation generation for ${category.targetLanguages.length} languages`,
    languages: category.targetLanguages,
  };
}

  @Get('category/:slug')
  async getCategoryWithArticles(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.categoryService.getCategoryWithArticles(slug, page, limit);
  }



  @Get('categories')
async getCategories() {
  // Use Prisma directly since you have it injected
  return this.prisma.articleCategory.findMany({
    where: { 
      isActive: true 
    },
    orderBy: { 
      order: 'asc' 
    },
  });
}



@Get('all/filters')
async getFilterOptions() {
  try {
    const [categories, tags, authors, stats] = await Promise.all([
      this.prisma.articleCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      this.articleService.getAllTags(),
      this.articleService.getAllAuthors(),
      this.articleService.getArticleStats(),
    ]);

    return {
      success: true,
      data: {
        categories,
        tags,
        authors,
        stats,
      },
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      success: false,
      message: 'Failed to load filter options',
    };
  }
}
@Post('all/filtered')
async getFilteredArticles(
  @Body() body: {
    page?: number;
    limit?: number;
    category?: string | string[];
    tag?: string;
    accessType?: 'all' | 'free' | 'premium';
    featured?: boolean;
    trending?: boolean;
    search?: string;
    sort?: string;
    readingTime?: 'short' | 'medium' | 'long' | 'any';
    authors?: string[];
    languages?: string[];
    tags?: string[];
    categories?: string[];
  },
  @Request() req?: any,
) {
  try {
    const userId = req?.user?.id;
    
    // Convert accessType string to ContentAccess enum
    let accessType: ContentAccess | 'all' = 'all';
    if (body.accessType === 'free') {
      accessType = ContentAccess.FREE;
    } else if (body.accessType === 'premium') {
      accessType = ContentAccess.PREMIUM;
    }

    const result = await this.articleService.getArticlesWithAdvancedFilters({
      page: body.page || 1,
      limit: body.limit || 24,
      category: body.category,
      tag: body.tag,
      accessType,
      featured: body.featured,
      trending: body.trending,
      search: body.search,
      sort: body.sort || 'recent',
      readingTime: body.readingTime,
      authors: body.authors,
      languages: body.languages,
      tags: body.tags,
      categories: body.categories,
    });

    // If user is logged in, check premium access for premium articles
    if (userId && result.articles) {
      const enhancedArticles = await Promise.all(
        result.articles.map(async (article: any) => { // Add type annotation
          if (article.accessType === ContentAccess.PREMIUM) {
            const hasAccess = await this.articleService.checkArticleAccess(
              article.id,
              userId
            );
            
            // If user doesn't have access, return preview version
            if (!hasAccess.hasAccess) {
              return this.articleService.getArticlePreview(article);
            }
          }
          return article;
        })
      );

      return {
        success: true,
        data: {
          ...result,
          articles: enhancedArticles,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting filtered articles:', error);
    return {
      success: false,
      message: 'Failed to load articles',
      error: error.message,
    };
  }
}

@Get('stats/overview')
async getArticleOverviewStats() {
  try {
    const stats = await this.articleService.getArticleStats();
    
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error getting article stats:', error);
    return {
      success: false,
      message: 'Failed to load article statistics',
    };
  }
}

  // ========== AUTHENTICATED USER ROUTES ==========

  @Post()
  @UseGuards(JwtGuard) // Regular users can create articles
  async createArticle(
    @Request() req: any,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    const userId = req.user.id;
    return this.articleService.createArticle(userId, createArticleDto);
  }

  // @Put(':slug')
  // @UseGuards(JwtGuard)
  // async updateArticle(
  //   @Param('slug') slug: string,
  //   @Request() req: any,
  //   @Body() updateArticleDto: UpdateArticleDto,
  // ): Promise<ArticleResponseDto> {
  //   const userId = req.user.id;
  //   return this.articleService.updateArticle(slug, userId, updateArticleDto);
  // }

  @Delete(':slug')
  @UseGuards(JwtGuard)
  async deleteArticle(
    @Param('slug') slug: string,
    @Request() req: any,
    @Query('hardDelete') hardDelete?: string,
  ) {
    const userId = req.user.id;
    const hardDeleteBool = hardDelete === 'true';
    return this.articleService.deleteArticle(slug, userId, hardDeleteBool);
  }

  @Post('search')
  async searchArticles(@Body() searchDto: SearchArticlesDto): Promise<ArticleListDto> {
    const tag = searchDto.tags && searchDto.tags.length > 0 ? searchDto.tags[0] : undefined;
    
    return this.articleService.listArticles({
      search: searchDto.query,
      category: searchDto.categoryId,
      tag,
      accessType: searchDto.accessType as any,
      page: searchDto.page || 1,
      limit: searchDto.limit || 20,
      language: searchDto.language,
    });
  }

  @Post(':slug/publish')
  @UseGuards(JwtGuard)
  async publishArticle(
    @Param('slug') slug: string,
    @Request() req: any,
  ): Promise<ArticleResponseDto> {
    const userId = req.user.id;
    return this.articleService.publishArticle(slug, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtGuard)
  async likeArticle(
    @Param('id') articleId: string,
    @Request() req: any,
    @Query('language') language?: string,
  ) {
    const userId = req.user.id;
    return this.articleService.likeArticle(articleId, userId, language || 'en');
  }



  // ========== SAVE/UNSAVE ENDPOINTS ==========

// GET saved articles - returns list of saved articles
@Get('user/saved')
@UseGuards(JwtGuard)
async getUserSavedArticles(
  @Request() req: any,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
) {
  const userId = req.user.id;
  return this.articleService.getUserSavedArticles(userId, page, limit);
}

// SAVE an article (POST)
  @Post(':id/save')
  @UseGuards(JwtGuard)
  async saveArticle(
    @Param('id') articleId: string,
    @Body() body: { language?: string },
    @Request() req: any,
  ) {
    const language = body.language || 'en';
    return await this.articleService.saveArticle(
      articleId,
      req.user.id,
      language
    );
  }


// UNSAVE an article (DELETE from /:id/save)
@Delete(':id/save')
@UseGuards(JwtGuard)
async unsaveArticle(
  @Param('id') articleId: string,
  @Request() req: any,
) {
  const userId = req.user.id;
  
  try {
    // Check if article exists
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article) {
      return {
        success: false,
        message: 'Article not found',
      };
    }

    // Delete from saved
    const deleteResult = await this.prisma.articleSave.deleteMany({
      where: {
        userId,
        articleId,
      },
    });

    if (deleteResult.count === 0) {
      return {
        success: false,
        message: 'Article was not in your saved list',
      };
    }

    // Update article save count
    try {
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          saveCount: { decrement: 1 },
        },
      });
    } catch (updateError) {
      console.warn(`Failed to update save count:`, updateError);
    }

    return {
      success: true,
      message: 'Article removed from saved',
      removedCount: deleteResult.count,
    };
  } catch (error) {
    console.error('Error unsaving article:', error);
    
    return {
      success: false,
      message: 'Failed to remove article from saved',
      error: error.message,
    };
  }
}


  @Post(':id/view')
  async trackView(
    @Param('id') articleId: string,
    @Body() body: { duration?: number; language?: string },
    @Request() req: any,
  ) {
    const language = body.language || 'en';
    return await this.articleService.trackArticleView(
      articleId,
      req.user?.id, // Optional user ID
      language
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtGuard)
  async addComment(
    @Param('id') articleId: string,
    @Request() req: any,
    @Body() commentDto: CommentDto,
  ) {
    const userId = req.user.id;
    return this.articleService.addComment(articleId, userId, commentDto);
  }


  // In your ArticleController, add these methods:

// ========== COMMENTS ENDPOINT (supports both ID and slug) ==========
@Get(':identifier/comments')
async getComments(
  @Param('identifier') identifier: string,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Request() req?: any,
) {
  console.log('Comments endpoint called with identifier:', identifier);
  
  let articleId: string;
  
  // Check if identifier is an ID or slug
  if (identifier.length === 25 && !identifier.includes('-')) {
    // It's an ID (Prisma IDs are 25 chars like cmivcr2vj000v1ycz9jbn3y91)
    const article = await this.prisma.article.findUnique({
      where: { id: identifier },
      select: { id: true },
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    articleId = article.id;
  } else {
    // It's a slug (like best-actions-you)
    const article = await this.prisma.article.findUnique({
      where: { slug: identifier },
      select: { id: true },
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    articleId = article.id;
  }
  
  console.log('Found article ID:', articleId);
  
  const userId = req?.user?.id;
  return this.articleService.getCommentsByArticleId(articleId, page, limit, userId);
}

// ========== RELATED ARTICLES ENDPOINT (supports both ID and slug) ==========
// In your article.controller.ts
@Get(':identifier/related')
async getRelatedArticles(
  @Param('identifier') identifier: string,
  @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  @Query('language') language?: string, // Add language parameter
) {
  console.log('🌐 Getting related articles with language:', { identifier, language });
  return this.articleService.getRelatedArticlesByIdOrSlug(identifier, limit, language);
}

// ========== TRENDING FEED ALIAS ==========
@Get('feed/trending')
async getTrendingFeed(
  @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
) {
  // Return simple trending articles without recommendations logic
  return this.articleService.getTrendingArticles(limit);
}





@Post('comments/:commentId/like')
@UseGuards(JwtGuard)
async likeComment(
  @Param('commentId') commentId: string,
  @Request() req: any,
) {
  const userId = req.user.id;
  return this.articleService.likeComment(commentId, userId);
}

@Post('comments/:commentId/unlike')
@UseGuards(JwtGuard)
async unlikeComment(
  @Param('commentId') commentId: string,
  @Request() req: any,
) {
  const userId = req.user.id;
  return this.articleService.unlikeComment(commentId, userId);
}

@Put('comments/:commentId')
@UseGuards(JwtGuard)
async updateComment(
  @Param('commentId') commentId: string,
  @Request() req: any,
  @Body() dto: { content: string },
) {
  const userId = req.user.id;
  return this.articleService.updateComment(commentId, userId, dto.content);
}

@Delete('comments/:commentId')
@UseGuards(JwtGuard)
async deleteComment(
  @Param('commentId') commentId: string,
  @Request() req: any,
) {
  const userId = req.user.id;
  return this.articleService.deleteComment(commentId, userId);
}



  // ========== ADMIN-ONLY ARTICLE MANAGEMENT ==========

  @Put(':id/featured')
  @UseGuards(JwtGuard, AdminGuard)
  async toggleFeatured(
    @Param('id') articleId: string,
    @Body() body: { featured: boolean },
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user.id;
    
    // Get article slug without fetching full article
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { slug: true }
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    const updateDto: UpdateArticleDto = {
      isFeatured: body.featured,
    };
    
    const result = await this.articleService.updateArticle(article.slug, userId, updateDto);
    
    // Transform the response
    return this.articleResponseTransformer.transform(result);
  }

  @Put(':id/trending')
  @UseGuards(JwtGuard, AdminGuard)
  async toggleTrending(
    @Param('id') articleId: string,
    @Body() body: { trending: boolean },
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user.id;
    
    // Get article slug without fetching full article
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { slug: true }
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    const updateDto: UpdateArticleDto = {
      isTrending: body.trending,
    };
    
    const result = await this.articleService.updateArticle(article.slug, userId, updateDto);
    
    // Transform the response
    return this.articleResponseTransformer.transform(result);
  }


  // ========== RECOMMENDATIONS ==========

  @Get('recommendations/personalized')
  @UseGuards(JwtGuard)
  async getPersonalizedRecommendations(
    @Request() req: any,
    @Query() query: RecommendationRequestDto,
  ) {
    const userId = req.user.id;
    return this.recommendationService.getPersonalizedRecommendations(userId, query);
  }

  @Get('recommendations/trending')
  async getTrendingRecommendations(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationService.getPersonalizedRecommendations('anonymous', {
      limit,
      source: 'trending',
    });
  }

  @Post('recommendations/feedback')
  @UseGuards(JwtGuard)
  async submitRecommendationFeedback(
    @Request() req: any,
    @Body() feedbackDto: FeedbackDto,
  ) {
    const userId = req.user.id;
    if (!feedbackDto.articleId) {
      throw new BadRequestException('articleId is required');
    }
    return this.recommendationService.recordFeedback(userId, feedbackDto.articleId, feedbackDto);
  }

  // ========== HELPER ENDPOINTS ==========

  @Get('author/:authorId')
  async getArticlesByAuthor(
    @Param('authorId') authorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: ArticleStatus,
  ): Promise<ArticleListDto> {
    return this.articleService.listArticles({
      page,
      limit,
      authorId,
      status,
    });
  }

  @Get('tags/popular')
  async getPopularTags(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return { tags: [], limit };
  }

  @Get('drafts')
  @UseGuards(JwtGuard)
  async getUserDrafts(@Request() req: any): Promise<ArticleListDto> {
    const userId = req.user.id;
    return this.articleService.listArticles({
      authorId: userId,
      status: ArticleStatus.DRAFT,
      page: 1,
      limit: 100,
    });
  }

  @Get('health')
  async healthCheck() {
    return { status: 'OK', service: 'article-service' };
  }


  @Post(':id/translate')
  @UseGuards(JwtGuard)
  async triggerTranslation(
    @Param('id') articleId: string,
    @Body() body: { targetLanguage: string; force?: boolean },
  ) {
    try {
      const result = await this.translationService.translateArticle(
        articleId,
        body.targetLanguage,
        { force: body.force || false }
      );
      
      return {
        success: true,
        message: `Translation to ${body.targetLanguage} started`,
        translationId: result.id,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to start translation: ${error.message}`);
   
    }
  }




  @Get('translations/all')
  @UseGuards(JwtGuard, AdminGuard)
  async getAllTranslations(
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('needsReview') needsReview?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (language) {
      where.language = language;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (needsReview !== undefined) {
      where.needsReview = needsReview;
    }
    
    const [translations, total] = await Promise.all([
      this.prisma.articleTranslation.findMany({
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.articleTranslation.count({ where }),
    ]);
    
    return {
      data: translations,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // In article.controller.ts - add this new endpoint
@Get('translations/article/:articleId')
@UseGuards(JwtGuard, AdminGuard)
async getArticleTranslations(
  @Param('articleId') articleId: string,
) {
  console.log('🔍 Fetching translations for article:', articleId);
  
  // First, verify the article exists
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, slug: true }
  });
  
  if (!article) {
    console.log('❌ Article not found:', articleId);
    throw new NotFoundException('Article not found');
  }
  
  console.log('📄 Article found:', article.title);
  
  const translations = await this.prisma.articleTranslation.findMany({
    where: {
      articleId,
    },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { language: 'asc' },
  });
  
  console.log('📊 Found translations:', {
    count: translations.length,
    translations: translations.map(t => ({
      id: t.id,
      language: t.language,
      title: t.title,
      status: t.status
    }))
  });
  
  return {
    success: true,
    data: translations,
    count: translations.length,
  };
}

// Add this new endpoint for updating translation content
@Put('translations/:id/content')
@UseGuards(JwtGuard, AdminGuard)
async updateTranslationContent(
  @Param('id') id: string,
  @Body() body: { 
    title?: string;
    excerpt?: string;
    content?: any;
    plainText?: string;
    metaTitle?: string;
    metaDescription?: string;
    needsReview?: boolean;
  },
) {
  console.log('📝 Updating translation content:', { id, body });
  
  const translation = await this.prisma.articleTranslation.update({
    where: { id },
    data: {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      plainText: body.plainText || (() => {
        // Extract plain text from content if provided
        if (body.plainText) return body.plainText;
        if (typeof body.content === 'string') {
          // Strip HTML tags
          return body.content.replace(/<[^>]*>/g, '');
        }
        if (body.content?.plainText) {
          return body.content.plainText;
        }
        return '';
      })(),
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      needsReview: body.needsReview !== undefined ? body.needsReview : true,
      translatedBy: 'HUMAN',
      updatedAt: new Date(),
    },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
  
  console.log('✅ Translation content updated:', {
    id: translation.id,
    language: translation.language,
    title: translation.title,
    hasContent: !!translation.content,
  });
  
  return translation;
}

  // update a translation
  @Put('translations/:id')
  @UseGuards(JwtGuard, AdminGuard)
  async updateTranslation(
    @Param('id') id: string,
    @Body() body: { needsReview?: boolean },
  ) {
    return this.prisma.articleTranslation.update({
      where: { id },
      data: {
        needsReview: body.needsReview,
        updatedAt: new Date(),
      },
      include: {
        article: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  // regenerate a translation
  @Post('translations/:id/regenerate')
  @UseGuards(JwtGuard, AdminGuard)
  async regenerateTranslation(
    @Param('id') id: string,
  ) {
    const translation = await this.prisma.articleTranslation.findUnique({
      where: { id },
      include: {
        article: true,
      },
    });
    
    if (!translation) {
      throw new NotFoundException('Translation not found');
    }
    
    // Force regenerate the translation
    const result = await this.translationService.translateArticle(
      translation.articleId,
      translation.language,
      { force: true }
    );
    
    return {
      success: true,
      message: 'Translation regeneration started',
      translationId: result.id,
    };
  }


  @Patch(':id/status')
@UseGuards(JwtGuard)
async updateArticleStatus(
  @Param('id') articleId: string,
  @Body() body: { status: ArticleStatus },
  @Request() req: any,
): Promise<any> {
  const userId = req.user.id;
  
  console.log('Status update requested:', { articleId, status: body.status, userId });
  
  // First, get the article to get its slug
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: { slug: true, authorId: true }
  });
  
  if (!article) {
    throw new NotFoundException('Article not found');
  }
  
  // Check if user is the author
  if (article.authorId !== userId) {
    throw new BadRequestException('You can only update your own articles');
  }
  
  // Create update DTO
  const updateDto: UpdateArticleDto = {
    status: body.status,
  };
  
  // Use the existing updateArticle method
  const result = await this.articleService.updateArticle(article.slug, userId, updateDto);
  
  // Transform the response
  return this.articleResponseTransformer.transform(result);
}


  @Get('info/:id')
  async getArticleInfo(@Param('id') id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        authorId: true,
        categoryId: true,
      },
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    return article;
  }

  // Update this endpoint to handle both ID and slug
@Get(':identifier/languages')
async getArticleAvailableLanguages(@Param('identifier') identifier: string) {
  let articleId: string;
  
  // Check if identifier is an ID or slug (same pattern as your other endpoints)
  const isId = identifier.length === 25 && !identifier.includes('-');
  
  if (isId) {
    // It's an ID
    console.log('📌 Looking up article by ID for languages:', identifier);
    articleId = identifier;
  } else {
    // It's a slug, find the article
    console.log('📌 Looking up article by slug for languages:', identifier);
    const article = await this.prisma.article.findUnique({
      where: { slug: identifier },
      select: { id: true },
    });
    
    if (!article) {
      console.log('❌ Article not found with slug:', identifier);
      throw new NotFoundException('Article not found');
    }
    
    articleId = article.id;
  }
  
  // Now use the articleId to fetch the article
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true },
  });
  
  if (!article) {
    throw new NotFoundException('Article not found');
  }
  
  // Get completed translations
  const translations = await this.prisma.articleTranslation.findMany({
    where: {
      articleId,
      status: TranslationStatus.COMPLETED,
    },
    select: {
      language: true,
      qualityScore: true,
      confidence: true,
    },
  });
  
  // Always include English (original)
  const languages = [
    {
      language: 'en',
      isOriginal: true,
      qualityScore: 5,
      confidence: 1,
    },
    ...translations.map(t => ({
      language: t.language,
      isOriginal: false,
      qualityScore: t.qualityScore || 3,
      confidence: t.confidence || 0.9,
    }))
  ];
  
  return { 
    success: true,
    languages,
    count: languages.length,
  };
}

  // Add this endpoint to get translation status for an article
  // @Get('translations/status/:articleId')
  // @UseGuards(JwtGuard, AdminGuard)
  // async getTranslationStatus(@Param('articleId') articleId: string) {
  //   const article = await this.prisma.article.findUnique({
  //     where: { id: articleId },
  //     select: {
  //       id: true,
  //       title: true,
  //       autoTranslate: true,
  //       targetLanguages: true,
  //     },
  //   });
    
  //   if (!article) {
  //     throw new NotFoundException('Article not found');
  //   }
    
  //   const translations = await this.prisma.articleTranslation.findMany({
  //     where: { articleId },
  //     orderBy: { language: 'asc' },
  //   });
    
  //   return {
  //     article,
  //     translations,
  //     summary: {
  //       total: translations.length,
  //       completed: translations.filter(t => t.status === TranslationStatus.COMPLETED).length,
  //       failed: translations.filter(t => t.status === TranslationStatus.FAILED).length,
  //       pending: translations.filter(t => t.status === TranslationStatus.PENDING || t.status === TranslationStatus.PROCESSING).length,
  //     }
  //   };
  // }

  @Get('translations/status/:identifier')
@UseGuards(JwtGuard, AdminGuard)
async getTranslationStatus(@Param('identifier') identifier: string) {
  let articleId: string;
  
  // Check if identifier is an ID or slug
  const isId = identifier.length === 25 && !identifier.includes('-');
  
  if (isId) {
    articleId = identifier;
  } else {
    // It's a slug, find the article
    const article = await this.prisma.article.findUnique({
      where: { slug: identifier },
      select: { id: true },
    });
    
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    
    articleId = article.id;
  }
  
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      autoTranslate: true,
      targetLanguages: true,
    },
  });
  
  if (!article) {
    throw new NotFoundException('Article not found');
  }
  
  const translations = await this.prisma.articleTranslation.findMany({
    where: { articleId },
    orderBy: { language: 'asc' },
  });
  
  return {
    success: true,
    data: {
      article,
      translations,
      summary: {
        total: translations.length,
        completed: translations.filter(t => t.status === TranslationStatus.COMPLETED).length,
        failed: translations.filter(t => t.status === TranslationStatus.FAILED).length,
        pending: translations.filter(t => t.status === TranslationStatus.PENDING || t.status === TranslationStatus.PROCESSING).length,
      }
    }
  };
}

  @Post(':id/purchase')
  @UseGuards(JwtGuard)
  async purchaseArticle(
    @Param('id') articleId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      console.log('Purchase endpoint called:', { userId, articleId });
      
      const result = await this.articleService.purchaseArticle(articleId, userId);
      
      console.log('Purchase result:', result);
      
      // Extract purchased status from different possible locations
      let purchased = true; // Default to true
      
      if (typeof result === 'object') {
        if ('purchased' in result) {
          purchased = (result as any).purchased;
        } else if ('data' in result && result.data && typeof result.data === 'object' && 'purchased' in result.data) {
          purchased = (result.data as any).purchased;
        } else if ('success' in result) {
          purchased = result.success;
        }
      }
      
      // Return the exact format frontend expects
      return {
        success: true,
        data: { purchased },
        message: result?.message || 'Article purchased successfully',
      };
      
    } catch (error) {
      console.error('Purchase endpoint error:', error);
      
      // Return proper error format
      const status = error instanceof NotFoundException ? 404 :
                    error instanceof BadRequestException ? 400 : 500;
      
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to purchase article',
          error: error.name || 'PurchaseError',
        },
        status
      );
    }
  }

  @Get(':id/access')
  @UseGuards(JwtGuard)
  async checkArticleAccess(
    @Param('id') articleId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    
    console.log('Check access called:', { userId, articleId });
    
    try {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { 
          id: true,
          accessType: true,
          authorId: true,
          status: true 
        },
      });

      if (!article || article.status !== ArticleStatus.PUBLISHED) {
        return {
          hasAccess: false,
          reason: 'Article not found or not published'
        };
      }

      // Authors have access to their own articles
      if (article.authorId === userId) {
        return { 
          hasAccess: true, 
          reason: 'Author of article',
          isAuthor: true
        };
      }

      // Free articles
      if (article.accessType === ContentAccess.FREE) {
        return { 
          hasAccess: true, 
          reason: 'Free article',
          isFree: true
        };
      }

      // Check premium access
      const existingAccess = await this.prisma.premiumAccess.findFirst({
        where: {
          userId,
          articleId,
          accessUntil: { gt: new Date() }
        },
      });

      if (existingAccess) {
        return { 
          hasAccess: true, 
          reason: 'Already purchased',
          accessUntil: existingAccess.accessUntil,
          purchasedAt: existingAccess.createdAt,
          isPurchased: true
        };
      }

      // Check subscription
      const subscription = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() },
        },
      });

      if (subscription) {
        return { 
          hasAccess: true, 
          reason: 'Active subscription',
          isSubscribed: true
        };
      }

      return { 
        hasAccess: false, 
        reason: 'No access found',
        requiresPurchase: true,
        isPremium: article.accessType === ContentAccess.PREMIUM
      };
      
    } catch (error) {
      console.error('Check access error:', error);
      return { 
        hasAccess: false, 
        reason: 'Error checking access',
        error: error.message
      };
    }
  }


//   @Post(':articleId/save')
// @UseGuards(JwtGuard)
// async saveArticleById(
//   @Param('articleId') articleId: string,
//   @Body() body: { language?: string },
//   @Request() req: any,
// ) {
//   const userId = req.user.id;
//   const language = body.language || 'en';
  
//   return await this.articleService.saveArticle(articleId, userId, language);
// }

// @Delete(':articleId/save')
// @UseGuards(JwtGuard)
// async unsaveArticleById(
//   @Param('articleId') articleId: string,
//   @Request() req: any,
// ) {
//   const userId = req.user.id;
  
//   try {
//     // Check if article exists and is published
//     const article = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { status: true },
//     });

//     if (!article || article.status !== ArticleStatus.PUBLISHED) {
//       return {
//         success: false,
//         message: 'Article not found or not published',
//       };
//     }

//     // Remove from saved
//     const deleteResult = await this.prisma.articleSave.deleteMany({
//       where: {
//         userId,
//         articleId,
//       },
//     });

//     if (deleteResult.count === 0) {
//       return {
//         success: false,
//         message: 'Article was not in your saved list',
//       };
//     }

//     // Update article save count
//     try {
//       await this.prisma.article.update({
//         where: { id: articleId },
//         data: {
//           saveCount: { decrement: 1 },
//         },
//       });
//     } catch (updateError) {
//       console.error('Failed to decrement save count:', updateError);
//     }

//     return {
//       success: true,
//       message: 'Article removed from saved',
//       removedCount: deleteResult.count,
//     };
//   } catch (error) {
    
//     return {
//       success: false,
//       message: 'Failed to remove article from saved',
//       error: error.message,
//     };
//   }
// }

  @Get('user/premium-access')
  @UseGuards(JwtGuard)
  async getUserPremiumAccess(
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.articleService.getUserPremiumAccess(userId);
  }

  @Get('user/reading-stats')
  @UseGuards(JwtGuard)
  async getUserReadingStats(
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.articleService.getUserReadingStats(userId);
  }

  
  @Get('user/profile-stats')
@UseGuards(JwtGuard)
async getUserProfileStats(@Request() req: any) {
  const userId = req.user.id;
  
  try {
    // Get reading stats directly from service
    const readingStats = await this.articleService.getUserReadingStats(userId);
    
    // Get saved articles count
    const savedCount = await this.prisma.articleSave.count({
      where: { userId }
    });
    
    // Get liked articles count
    const likedCount = await this.prisma.articleLike.count({
      where: { userId }
    });
    
    return {
      success: true,
      data: {
        totalArticlesRead: readingStats?.totalArticlesRead || 0,
        totalReadingTime: readingStats?.totalReadingTime || 0,
        averageReadingTime: readingStats?.averageReadingTime || 0,
        readingStreak: readingStats?.readingStreak || 0,
        savedArticlesCount: savedCount,
        likedArticlesCount: likedCount,
        weeklyGoal: 5,
        weeklyProgress: Math.min(savedCount || 0, 5),
        favoriteCategory: readingStats?.favoriteCategory || 'General',
      }
    };
  } catch (error) {
    console.error('Error in profile stats:', error);
    
    return {
      success: true,
      data: {
        totalArticlesRead: 0,
        totalReadingTime: 0,
        averageReadingTime: 0,
        readingStreak: 0,
        savedArticlesCount: 0,
        likedArticlesCount: 0,
        weeklyGoal: 5,
        weeklyProgress: 0,
        favoriteCategory: 'General',
      }
    };
  }
}



  @Get('user/reading-profile')
@UseGuards(JwtGuard)
async getUserReadingProfile(@Request() req: any) {
  const userId = req.user.id;
  console.log('Getting reading profile for user:', userId);
  
  try {
    const result = await this.articleService.getReadingProfile(userId);
    
    console.log('Reading profile result:', {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : 'no data'
    });
    
    return result;
  } catch (error) {
    console.error('Controller error getting reading profile:', error);
    return {
      success: false,
      message: 'Failed to get reading profile',
      error: error.message,
    };
  }
}

@Put('user/reading-profile')
@UseGuards(JwtGuard)
async updateUserReadingProfile(
  @Request() req: any,
  @Body() dto: UpdateReadingProfileDto,
) {
  const userId = req.user.id;
  console.log('Updating reading profile for user:', userId);
  console.log('Request body:', dto);
  
  try {
    const result = await this.articleService.updateReadingProfile(userId, dto);
    return result;
  } catch (error) {
    console.error('Controller error updating reading profile:', error);
    return {
      success: false,
      message: 'Failed to update reading profile',
      error: error.message,
    };
  }
}


  @Get('user/achievements')
  @UseGuards(JwtGuard)
  async getUserAchievements(@Request() req: any) {
    const userId = req.user.id;
    return this.articleService.getUserAchievements(userId);
  }

  @Get('user/achievements/stats')
  @UseGuards(JwtGuard)
  async getAchievementStats(@Request() req: any) {
    const userId = req.user.id;
    return this.articleService.getAchievementStats(userId);
  }

  @Get('user/activity/recent')
  @UseGuards(JwtGuard)
  async getRecentActivity(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    const userId = req.user.id;
    return this.articleService.getRecentProfileActivity(userId, limit);
  }

  @Get('user/reading/stats')
  @UseGuards(JwtGuard)
  async getReadingStats(@Request() req: any) {
    const userId = req.user.id;
    return this.articleService.getReadingStats(userId);
  }

 @Get('achievement/:id/share')
async getAchievementShareData(
  @Param('id') achievementId: string,
  @Req() req: Request
) {
  const achievement = await this.prisma.achievement.findUnique({
    where: { id: achievementId },
    include: {
      user: {
        select: {
          name: true,
          picture: true
        }
      }
    }
  });

  if (!achievement) {
    throw new NotFoundException('Achievement not found');
  }

  const origin = process.env.APP_URL || 'https://Inlirah.com';
  const baseUrl = process.env.CDN_URL || 'https://cdn.Inlirah.com';
  
 
  const shareImage = `${baseUrl}/achievement-badges/default-share.png`;

  return {
    success: true,
    meta: {
      title: `${achievement.user.name} unlocked: ${achievement.title} on Coverra!`,
      description: achievement.description,
      image: shareImage,
      url: `${origin}/achievement/${achievementId}`,
      type: 'article',
      // Additional Open Graph properties
      site_name: 'Coverra',
      // Twitter Card properties
      twitter_card: 'summary_large_image',
      twitter_title: `${achievement.user.name} unlocked: ${achievement.title}`,
      twitter_description: achievement.description,
      twitter_image: shareImage,
    },
    achievement
  };
}


// Add this to your ArticleController or create a new UserController
@Get('users/:username/public-profile')
  async getUserPublicProfile(
    @Param('username') username: string,
  ) {
    try {
      // Find user by username
      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
          // bio: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get user's reading stats (you already have this method)
      const stats = await this.articleService.getUserReadingStats(user.id);
      
      // Get user's achievements
      const achievements = await this.articleService.getUserAchievements(user.id);
      
      // Get user's reading profile
      const readingProfile = await this.articleService.getReadingProfile(user.id);
      
      // Get user's recent activity (limit to public activities)
      const recentActivity = await this.articleService.getRecentProfileActivity(user.id, 5);
      
      // Get user's top categories
      const topCategories = await this.getUserTopCategories(user.id);

      return {
        success: true,
        data: {
          user,
          stats,
          achievements,
          readingProfile: readingProfile.data,
          recentActivity,
          topCategories,
        },
      };
    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw new BadRequestException('Failed to fetch public profile');
    }
  }

  private async getUserTopCategories(userId: string) {
    const categories = await this.prisma.$queryRaw<{category: string, count: number}[]>`
      SELECT ac.name as category, COUNT(DISTINCT av."articleId") as count
      FROM "ArticleView" av
      JOIN "Article" a ON av."articleId" = a.id
      JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
      WHERE av."userId" = ${userId}
      GROUP BY ac.name
      ORDER BY count DESC
      LIMIT 4
    `;
    
    return categories.map(cat => ({
      name: cat.category,
      count: cat.count,
      color: this.getCategoryColor(cat.category),
    }));
  }

  private getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Technology': '#3B82F6',
      'Science': '#10B981',
      'Business': '#8B5CF6',
      'Health': '#EF4444',
      'Education': '#F59E0B',
      'Entertainment': '#EC4899',
      'Sports': '#06B6D4',
      'Politics': '#8B5CF6',
    };
    
    return colors[categoryName] || '#6B7280';
  }
}