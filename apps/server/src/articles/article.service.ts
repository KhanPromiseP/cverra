// article.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto, CommentDto } from './dto/article.dto';
import { ArticleStatus, ContentAccess, TransactionSource, UsageAction, TranslationStatus } from '@prisma/client';
import { slugify } from '../auth/utils/slugify';
import { EngagementService } from './engagement.service';
import { TranslationService } from './translation.service';


interface RawActivityItem {
  id: any; // Could be BigInt
  type: string;
  articleId: any; // Could be BigInt
  timestamp: Date;
  duration: number | null;
  metadata: any; // jsonb
  action: string;
}

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
    private engagementService: EngagementService,
  ) {}

  async createArticle(userId: string, dto: CreateArticleDto) {
  const slug = slugify(dto.title);
  
  // Check if slug exists
  const existing = await this.prisma.article.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new BadRequestException('Article with this title already exists');
  }

  // Get user to check if they're admin
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Validate category exists
  const category = await this.prisma.articleCategory.findUnique({
    where: { id: dto.categoryId },
  });

  if (!category) {
    throw new BadRequestException('Category not found');
  }

  const isPublished = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const article = await this.prisma.article.create({
    data: {
      title: dto.title,
      excerpt: dto.excerpt,
      content: dto.content,
      categoryId: dto.categoryId,
      tags: dto.tags || [],
      accessType: dto.accessType || ContentAccess.FREE,
      coinPrice: dto.coinPrice || 0,
      coverImage: dto.coverImage,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      slug,
      authorId: userId,
      plainText: this.extractPlainText(dto.content),
      readingTime: this.calculateReadingTime(dto.content),
      autoTranslate: dto.autoTranslate ?? true,
      availableLanguages: ['en'],
      targetLanguages: dto.targetLanguages || ['fr'],
      status: isPublished ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT,
      publishedAt: isPublished ? new Date() : null,
    },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
    },
  });

  // Process translations if article is published and auto-translate is enabled
  if (isPublished && dto.autoTranslate !== false && dto.targetLanguages && dto.targetLanguages.length > 0) {
    // Use a more reliable method than setTimeout
    this.queueTranslations(article.id, dto.targetLanguages);
  }

  return article;
}

private async queueTranslations(articleId: string, targetLanguages: string[]) {
  // Use process.nextTick for immediate but non-blocking execution
  process.nextTick(async () => {
    try {
      this.logger.log(`Starting translations for article ${articleId}`);
      
      const results = await this.processTranslationsInBackground(articleId, targetLanguages);
      
      // Update available languages in the article
      await this.updateAvailableLanguages(articleId);
      
      this.logger.log(`Translations completed for article ${articleId}: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
      
      // If there were failures, schedule retry for failed ones
      if (results.failed > 0) {
        const failedLanguages = results.results
          .filter(r => !r.success && r.action !== 'skipped') 
          .map(r => r.language);
        
        if (failedLanguages.length > 0) {
          this.logger.warn(`Scheduling retry for failed translations: ${failedLanguages.join(', ')}`);
          // Retry after 5 minutes
          setTimeout(() => {
            this.retryFailedTranslationsForArticle(articleId, failedLanguages);
          }, 5 * 60 * 1000);
        }
      }
    } catch (error) {
      this.logger.error(`Translation queue failed for article ${articleId}:`, error);
    }
  });
}

// NEW: Update available languages after translations
private async updateAvailableLanguages(articleId: string) {
  try {
    const translations = await this.prisma.articleTranslation.findMany({
      where: {
        articleId,
        status: TranslationStatus.COMPLETED,
      },
      select: {
        language: true,
      },
    });

    const availableLanguages = ['en', ...translations.map(t => t.language)];
    
    await this.prisma.article.update({
      where: { id: articleId },
      data: {
        availableLanguages: Array.from(new Set(availableLanguages)), // Remove duplicates
      },
    });
    
    this.logger.log(`Updated available languages for article ${articleId}: ${availableLanguages.join(', ')}`);
  } catch (error) {
    this.logger.error(`Failed to update available languages for article ${articleId}:`, error);
  }
}

// NEW: Retry failed translations
private async retryFailedTranslationsForArticle(articleId: string, languages: string[]) {
  this.logger.log(`Retrying failed translations for article ${articleId}: ${languages.join(', ')}`);
  
  const results = await this.processTranslationsInBackground(articleId, languages);
  
  if (results.successful > 0) {
    await this.updateAvailableLanguages(articleId);
  }
  
  return results;
}

// Update the updateArticle method to be more robust:

async updateArticle(slug: string, userId: string, dto: UpdateArticleDto) {
  console.log('updateArticle called:', { slug, userId, dto: JSON.stringify(dto) });
  
  const article = await this.prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  // Check ownership or admin role
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, id: true },
  });

  if (!user) {
    throw new ForbiddenException('User not found');
  }

  const canEdit = article.authorId === userId || 
                  user.role === 'ADMIN' || 
                  user.role === 'SUPER_ADMIN';

  if (!canEdit) {
    throw new ForbiddenException('Not authorized to update this article');
  }

  const updateData: any = {};
  let contentChanged = false;
  let statusChanged = false;
  let titleChanged = false;

  // Update only provided fields
  if (dto.title !== undefined && dto.title !== article.title) {
    updateData.title = dto.title;
    updateData.slug = slugify(dto.title);
    titleChanged = true;
  }
  
  if (dto.excerpt !== undefined && dto.excerpt !== article.excerpt) {
    updateData.excerpt = dto.excerpt;
  }
  
  if (dto.content !== undefined) {
    // Check if content actually changed
    const currentContentHash = this.hashContent(article.content);
    const newContentHash = this.hashContent(dto.content);
    
    if (currentContentHash !== newContentHash) {
      updateData.content = dto.content;
      updateData.plainText = this.extractPlainText(dto.content);
      updateData.readingTime = this.calculateReadingTime(dto.content);
      contentChanged = true;
    }
  }
  
  if (dto.categoryId !== undefined && dto.categoryId !== article.categoryId) {
    updateData.categoryId = dto.categoryId;
  }
  
  if (dto.tags !== undefined) {
    updateData.tags = dto.tags;
  }
  
  if (dto.accessType !== undefined && dto.accessType !== article.accessType) {
    updateData.accessType = dto.accessType;
  }
  
  if (dto.coinPrice !== undefined && dto.coinPrice !== article.coinPrice) {
    updateData.coinPrice = dto.coinPrice;
  }
  
  if (dto.coverImage !== undefined && dto.coverImage !== article.coverImage) {
    updateData.coverImage = dto.coverImage;
  }
  
  if (dto.metaTitle !== undefined && dto.metaTitle !== article.metaTitle) {
    updateData.metaTitle = dto.metaTitle;
  }
  
  if (dto.metaDescription !== undefined && dto.metaDescription !== article.metaDescription) {
    updateData.metaDescription = dto.metaDescription;
  }
  
  if (dto.autoTranslate !== undefined && dto.autoTranslate !== article.autoTranslate) {
    updateData.autoTranslate = dto.autoTranslate;
  }
  
  // Handle target languages
  let targetLanguagesChanged = false;
  if (dto.targetLanguages !== undefined) {
    // Normalize and validate target languages
    const newTargetLanguages = Array.isArray(dto.targetLanguages) 
      ? dto.targetLanguages.filter(lang => lang && lang.trim() !== '' && lang !== 'en')
      : [];
    
    const currentTargetLanguages = Array.isArray(article.targetLanguages)
      ? article.targetLanguages
      : [];
    
    // Sort and compare
    const sortedNew = [...new Set(newTargetLanguages)].sort();
    const sortedCurrent = [...new Set(currentTargetLanguages)].sort();
    
    targetLanguagesChanged = JSON.stringify(sortedNew) !== JSON.stringify(sortedCurrent);
    
    if (targetLanguagesChanged) {
      updateData.targetLanguages = sortedNew;
    }
  }
  
  if (dto.status !== undefined && dto.status !== article.status) {
    updateData.status = dto.status;
    statusChanged = true;
    
    // Set publishedAt if status changes to PUBLISHED
    if (dto.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
  }

  // Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    console.log('No changes detected, returning original article');
    return article; // No changes
  }

  console.log('Updating article with data:', updateData);
  
  const updated = await this.prisma.article.update({
    where: { slug: article.slug },
    data: updateData,
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
    },
  });

  console.log('Article updated successfully:', { 
    id: updated.id, 
    title: updated.title,
    contentChanged, 
    titleChanged, 
    statusChanged, 
    targetLanguagesChanged 
  });

  // ========== SMART TRANSLATION HANDLING ==========
  await this.handleSmartTranslations(
    updated, 
    article, 
    contentChanged, 
    titleChanged, 
    statusChanged, 
    targetLanguagesChanged
  );

  return updated;
}

// NEW: Smart translation handling method
private async handleSmartTranslations(
  updatedArticle: any,
  originalArticle: any,
  contentChanged: boolean,
  titleChanged: boolean,
  statusChanged: boolean,
  targetLanguagesChanged: boolean
) {
  console.log('Handling smart translations...');
  
  // Conditions for translation triggering
  const shouldCheckTranslations = 
    updatedArticle.status === ArticleStatus.PUBLISHED &&
    updatedArticle.autoTranslate &&
    updatedArticle.targetLanguages &&
    updatedArticle.targetLanguages.length > 0 &&
    (contentChanged || titleChanged || statusChanged || targetLanguagesChanged);
  
  if (!shouldCheckTranslations) {
    console.log('No need to check translations');
    return;
  }
  
  try {
    console.log('Checking existing translations...');
    
    // Get existing completed translations
    const existingTranslations = await this.prisma.articleTranslation.findMany({
      where: { 
        articleId: updatedArticle.id,
        status: TranslationStatus.COMPLETED
      },
      select: { 
        language: true, 
        updatedAt: true,
        contentHash: true
      },
    });
    
    const existingCompletedLanguages = existingTranslations.map(t => t.language);
    const currentContentHash = this.hashContent(updatedArticle.content);
    
    console.log(' Translation status:', {
      targetLanguages: updatedArticle.targetLanguages,
      existingCompletedLanguages,
      currentContentHash
    });
    
    // Determine which languages need translation
    const languagesToTranslate: string[] = [];
    const languagesToUpdate: string[] = [];
    
    for (const targetLang of updatedArticle.targetLanguages) {
      if (targetLang === 'en') continue; // Skip English
      
      const existingTranslation = existingTranslations.find(t => t.language === targetLang);
      
      if (!existingTranslation) {
        // No translation exists - need to create one
        languagesToTranslate.push(targetLang);
        console.log(` New translation needed for: ${targetLang}`);
      } else if (contentChanged || titleChanged) {
        // Content or title changed - check if translation is stale
        const translationAge = Date.now() - new Date(existingTranslation.updatedAt).getTime();
        const isStale = translationAge > 24 * 60 * 60 * 1000; // 24 hours
        
        if (isStale) {
          languagesToUpdate.push(targetLang);
          console.log(`Translation is stale for: ${targetLang} (${Math.round(translationAge / 3600000)} hours old)`);
        }
      }
    }
    
    // Combine all languages that need attention
    const allLanguagesToProcess = [...languagesToTranslate, ...languagesToUpdate];
    
    if (allLanguagesToProcess.length > 0) {
      console.log(` Triggering translations for: ${allLanguagesToProcess.join(', ')}`);
      
      // Differentiate between new and update
      const newTranslations = languagesToTranslate.filter(lang => !languagesToUpdate.includes(lang));
      const updatedTranslations = languagesToUpdate;
      
      if (newTranslations.length > 0) {
        console.log(` New translations: ${newTranslations.join(', ')}`);
      }
      
      if (updatedTranslations.length > 0) {
        console.log(` Updating translations: ${updatedTranslations.join(', ')}`);
      }
      
      // Process translations in the background
      this.processTranslationsInBackground(updatedArticle.id, allLanguagesToProcess)
        .then(result => {
          console.log(` Translations completed for article "${updatedArticle.title}":`, {
            successful: result.successful,
            failed: result.failed,
            skipped: result.skipped
          });
          
          // Update available languages after successful translations
          if (result.successful > 0) {
            this.updateAvailableLanguages(updatedArticle.id);
          }
        })
        .catch(error => {
          console.error(` Background translation failed:`, error);
        });
      
      // Return immediate response about triggered translations
      return {
        translationsTriggered: true,
        languages: allLanguagesToProcess,
        new: newTranslations,
        updates: updatedTranslations,
        message: `Translations triggered for ${allLanguagesToProcess.length} language(s)`
      };
    } else {
      console.log(' All translations are up to date');
      return {
        translationsTriggered: false,
        message: 'All translations are up to date'
      };
    }
    
  } catch (error) {
    console.error(' Error in smart translation handling:', error);
    // Don't throw - just log the error
  }
}

// Update the processTranslationsInBackground to handle updates better
private async processTranslationsInBackground(
  articleId: string, 
  targetLanguages: string[],
  forceUpdate: boolean = false
): Promise<{
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    language: string;
    success: boolean;
    action: 'created' | 'updated' | 'skipped';
    reason?: string;
    translationId?: string;
    timestamp?: string;
    error?: string;
  }>;
}> {
  const results: Array<{
    language: string;
    success: boolean;
    action: 'created' | 'updated' | 'skipped';
    reason?: string;
    translationId?: string;
    timestamp?: string;
    error?: string;
  }> = [];
  
  const batchSize = 2;
  const batches: string[][] = [];
  
  // Create batches
  for (let i = 0; i < targetLanguages.length; i += batchSize) {
    batches.push(targetLanguages.slice(i, i + batchSize));
  }
  
  // Get article content for translation
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: {
      title: true,
      content: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true
    },
  });
  
  if (!article) {
    throw new NotFoundException('Article not found');
  }
  
  // Process batches
  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Processing translation batch ${batchIndex + 1}/${batches.length}`);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (language) => {
        try {
          if (language === 'en') {
            return { 
              language, 
              success: true, 
              action: 'skipped' as const, 
              reason: 'Original language' 
            };
          }

          // Check existing translation
          const existing = await this.prisma.articleTranslation.findUnique({
            where: { articleId_language: { articleId, language } },
            select: { 
              id: true, 
              status: true, 
              updatedAt: true,
              contentHash: true 
            },
          });

          const currentContentHash = this.hashContent(article.content);
          const translationExists = existing?.status === TranslationStatus.COMPLETED;
          const isContentDifferent = translationExists && existing.contentHash !== currentContentHash;
          
          // Skip if translation exists and is recent (unless force update or content changed)
          if (translationExists && !forceUpdate && !isContentDifferent) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (existing.updatedAt > oneHourAgo) {
              return { 
                language, 
                success: true, 
                action: 'skipped' as const,
                reason: 'Recent translation exists',
                translationId: existing.id 
              };
            }
          }

          // Create or update translation
          const translation = await this.translationService.translateArticle(
            articleId, 
            language, 
            { 
              force: forceUpdate || isContentDifferent, 
              aiModel: 'llama-3.3-70b-versatile', 
              useCache: true 
            }
          );
          
          return { 
            language, 
            success: true, 
            action: existing ? 'updated' as const : 'created' as const,
            translationId: translation.id,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Translation failed for ${language}:`, error);
          return { 
            language, 
            success: false, 
            action: 'skipped' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          language: batch[index],
          success: false,
          action: 'skipped',
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const successful = results.filter(r => r.success && r.action !== 'skipped').length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.action === 'skipped').length;
  
  return { successful, failed, skipped, results };
}

private hashContent(content: any): string {
  if (!content) return 'empty';
  
  try {
    if (typeof content === 'string') {
      // Create a simple hash
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    }
    
    if (typeof content === 'object') {
      const jsonString = JSON.stringify(content);
      // Create a simple hash
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    }
    
    return String(content);
  } catch (error) {
    console.warn('Failed to hash content:', error);
    return 'error';
  }
}
 
// private async processTranslationsInBackground(
//   articleId: string, 
//   targetLanguages: string[]
// ): Promise<{
//   successful: number;
//   failed: number;
//   skipped: number;
//   results: Array<{
//     language: string;
//     success: boolean;
//     skipped?: boolean;
//     reason?: string;
//     translationId?: string;
//     timestamp?: string;
//     error?: string;
//   }>;
// }> {
//   const results: Array<{
//     language: string;
//     success: boolean;
//     skipped?: boolean;
//     reason?: string;
//     translationId?: string;
//     timestamp?: string;
//     error?: string;
//   }> = [];
  
//   const batchSize = 2;
//   const batches: string[][] = [];
  
//   // Create batches
//   for (let i = 0; i < targetLanguages.length; i += batchSize) {
//     batches.push(targetLanguages.slice(i, i + batchSize));
//   }
  
//   // Process batches
//   for (const [batchIndex, batch] of batches.entries()) {
//     this.logger.log(`Processing translation batch ${batchIndex + 1}/${batches.length}`);
    
//     const batchResults = await Promise.allSettled(
//       batch.map(async (language) => {
//         try {
//           if (language === 'en') {
//             return { language, success: true, skipped: true, reason: 'Original language' };
//           }

//           const existing = await this.prisma.articleTranslation.findUnique({
//             where: { articleId_language: { articleId, language } },
//             select: { id: true, status: true, updatedAt: true },
//           });

//           if (existing?.status === TranslationStatus.COMPLETED) {
//             const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
//             if (existing.updatedAt > oneHourAgo) {
//               return { 
//                 language, 
//                 success: true, 
//                 skipped: true, 
//                 reason: 'Recent translation exists',
//                 translationId: existing.id 
//               };
//             }
//           }

//           const translation = await this.translationService.translateArticle(
//             articleId, 
//             language, 
//             { force: false, aiModel: 'llama-3.3-70b-versatile', useCache: true }
//           );
          
//           return { 
//             language, 
//             success: true, 
//             translationId: translation.id,
//             timestamp: new Date().toISOString(),
//           };
//         } catch (error) {
//           this.logger.error(`Translation failed for ${language}:`, error);
//           return { 
//             language, 
//             success: false, 
//             error: error instanceof Error ? error.message : 'Unknown error',
//             timestamp: new Date().toISOString(),
//           };
//         }
//       })
//     );

//     batchResults.forEach((result, index) => {
//       if (result.status === 'fulfilled') {
//         results.push(result.value);
//       } else {
//         results.push({
//           language: batch[index],
//           success: false,
//           error: result.reason?.message || 'Unknown error',
//           timestamp: new Date().toISOString(),
//         });
//       }
//     });

//     if (batchIndex < batches.length - 1) {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
  
//   const successful = results.filter(r => r.success && !r.skipped).length;
//   const failed = results.filter(r => !r.success).length;
//   const skipped = results.filter(r => r.skipped).length;
  
//   return { successful, failed, skipped, results };
// }

// NEW: Add this method to manually trigger translations
async triggerManualTranslations(articleId: string, languages: string[], force: boolean = false) {
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      status: true,
      autoTranslate: true,
    },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  if (article.status !== ArticleStatus.PUBLISHED) {
    throw new BadRequestException('Article must be published to translate');
  }

  if (!article.autoTranslate) {
    throw new BadRequestException('Auto-translate is disabled for this article');
  }

  this.logger.log(` Manually triggering translations for article "${article.title}": ${languages.join(', ')}`);

  const results = await this.processTranslationsInBackground(articleId, languages);
  
  // Update available languages
  await this.updateAvailableLanguages(articleId);

  return {
    success: true,
    message: `Translations triggered for ${languages.length} language(s)`,
    results: {
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      total: languages.length,
    },
    details: results.results,
  };
}

 async getArticle(slug: string, userId?: string, language?: string) {
  console.log(' Service getArticle called:', { slug, language, userId });
  
  const article = await this.prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
          email: true,
        },
      },
      ...(language && language !== 'en' ? {
        translations: {
          where: { 
            language, 
            status: 'COMPLETED' 
          },
          take: 1,
        },
      } : {}),
    },
  });

  console.log('🔍 Database query result:', {
    found: !!article,
    articleId: article?.id,
    articleTitle: article?.title,
    translationsCount: article?.translations?.length || 0
  });

  if (!article) {
    console.log(' Article not found in database for slug:', slug);
    throw new NotFoundException('Article not found');
  }

  // Check if article is published or user has access
  if (article.status !== ArticleStatus.PUBLISHED && userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true },
    });

    // Allow access if user is author, admin, or super admin
    const canAccess = user && (
      article.authorId === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this article');
    }
  } else if (article.status !== ArticleStatus.PUBLISHED) {
    throw new ForbiddenException('This article is not published');
  }

  // ========== FIX: Check Premium Access PROPERLY ==========
  if (article.accessType === ContentAccess.PREMIUM && userId) {
    // Check if user already has premium access
    const hasPremiumAccess = await this.prisma.premiumAccess.findFirst({
      where: {
        userId,
        articleId: article.id,
        accessUntil: { gt: new Date() }
      },
    });

    // Check if user is the author (authors get free access)
    const isAuthor = article.authorId === userId;
    
    // Check if user has an active subscription
    const hasSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() },
      },
    });

    console.log('Premium access check:', {
      userId,
      articleId: article.id,
      hasPremiumAccess: !!hasPremiumAccess,
      isAuthor,
      hasSubscription: !!hasSubscription,
    });

    if (!hasPremiumAccess && !isAuthor && !hasSubscription) {
      console.log('User does not have access, returning preview');
      // Return preview version ONLY if user doesn't have access
      return this.getPreviewVersion(article);
    } else {
      console.log('User has access to premium article, returning full content');
    }
  }

  if (article.coverImage) {
    if (article.coverImage.startsWith('http://') || article.coverImage.startsWith('https://')) {
      // Do nothing
    } else if (article.coverImage.startsWith('/')) {
      article.coverImage = `http://localhost:3000${article.coverImage}`;
    } else {
      article.coverImage = `http://localhost:3000/uploads/articles/${article.coverImage}`;
    }
  }

  // Track engagement (for non-preview views)
  if (userId && !this.isPreviewVersion(article)) {
    try {
      await this.engagementService.trackView(userId, article.id, language || 'en');
      await this.engagementService.trackEngagement(userId, article.id, 'VIEW');
    } catch (error) {
      this.logger.warn(`Failed to track engagement for article ${article.id}:`, error);
    }
  }

  // Transform relative URLs to absolute URLs
  const transformArticleUrls = (article: any) => {
    if (!article) return article;
    
    const serverUrl = 'http://localhost:3000';
    
    const toAbsoluteUrl = (url: string): string => {
      if (!url || typeof url !== 'string') return url;
      
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      
      if (url.startsWith('/')) {
        return `${serverUrl}${url}`;
      }
      
      return `${serverUrl}/${url}`;
    };
    
    if (article.coverImage) {
      article.coverImage = toAbsoluteUrl(article.coverImage);
    }
    
    if (article.author?.picture) {
      article.author.picture = toAbsoluteUrl(article.author.picture);
    }
    
    if (typeof article.content === 'string') {
      article.content = article.content.replace(
        /src="(\/uploads\/[^"]+)"/g, 
        `src="${serverUrl}$1"`
      );
      article.content = article.content.replace(
        /src=(\/uploads\/[^"'\s>]+)/g, 
        `src="${serverUrl}$1"`
      );
    }
    
    if (typeof article.content === 'object' && article.content.type === 'doc') {
      const fixImagesInContent = (node: any) => {
        if (node.type === 'image' && node.attrs?.src) {
          node.attrs.src = toAbsoluteUrl(node.attrs.src);
        }
        
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(fixImagesInContent);
        }
      };
      
      if (article.content.content) {
        article.content.content.forEach(fixImagesInContent);
      }
    }
    
    return article;
  };

  const transformedArticle = transformArticleUrls(article);

  // NEW: Get available languages
  const availableTranslations = await this.prisma.articleTranslation.findMany({
    where: {
      articleId: article.id,
      status: TranslationStatus.COMPLETED,
    },
    select: {
      language: true,
      qualityScore: true,
      confidence: true,
      needsReview: true,
    },
  });

  // Always include English (original)
  const availableLanguages = ['en', ...availableTranslations.map(t => t.language)];
  
  // If translation requested and exists, merge with original article data
  if (language && language !== 'en' && transformedArticle.translations?.[0]) {
    const translation = transformedArticle.translations[0];
    
    // Transform URLs in translation content
    const transformTranslationUrls = (translation: any) => {
      const serverUrl = 'http://localhost:3000';
      
      // Transform coverImage if it exists in translation
      if (translation.coverImage) {
        translation.coverImage = translation.coverImage.startsWith('http') 
          ? translation.coverImage 
          : `${serverUrl}${translation.coverImage}`;
      }
      
      // Transform image URLs in content
      if (translation.content) {
        if (typeof translation.content === 'string') {
          translation.content = translation.content.replace(
            /src="(\/uploads\/[^"]+)"/g, 
            `src="${serverUrl}$1"`
          );
        } else if (typeof translation.content === 'object' && translation.content.type === 'doc') {
          const fixImagesInContent = (node: any) => {
            if (node.type === 'image' && node.attrs?.src) {
              node.attrs.src = node.attrs.src.startsWith('http') 
                ? node.attrs.src 
                : `${serverUrl}${node.attrs.src.startsWith('/') ? '' : '/'}${node.attrs.src}`;
            }
            
            if (node.content && Array.isArray(node.content)) {
              node.content.forEach(fixImagesInContent);
            }
          };
          
          if (translation.content.content) {
            translation.content.content.forEach(fixImagesInContent);
          }
        }
      }
      
      return translation;
    };
    
    const transformedTranslation = transformTranslationUrls(translation);
    
    // Create a merged article with translation
    const translatedArticle = {
      ...transformedArticle,
      // Override with translated fields
      title: transformedTranslation.title || transformedArticle.title,
      excerpt: transformedTranslation.excerpt || transformedArticle.excerpt,
      content: transformedTranslation.content || transformedArticle.content,
      plainText: transformedTranslation.plainText || transformedArticle.plainText,
      metaTitle: transformedTranslation.metaTitle || transformedArticle.metaTitle,
      metaDescription: transformedTranslation.metaDescription || transformedArticle.metaDescription,
      keywords: transformedTranslation.keywords?.length > 0 ? transformedTranslation.keywords : transformedArticle.keywords,
      // Add translation metadata
      isTranslated: true,
      translationLanguage: language,
      translationQuality: transformedTranslation.qualityScore,
      translationConfidence: transformedTranslation.confidence,
      translationNeedsReview: transformedTranslation.needsReview,
      // Remove translations array from final response (it's internal)
      translations: undefined,
    };
    
    return translatedArticle;
  }

  // IMPORTANT: Add this return statement!
  // If no translation or if language is 'en', return the transformed article
  return {
    ...transformedArticle,
    availableLanguages: Array.from(new Set(availableLanguages)),
  };
}

  // async updateArticle(slug: string, userId: string, dto: UpdateArticleDto) {
  //   const article = await this.prisma.article.findUnique({
  //     where: { slug },
  //   });

  //   if (!article) {
  //     throw new NotFoundException('Article not found');
  //   }

  //   // Check ownership or admin role
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     select: { role: true, id: true },
  //   });

  //   if (!user) {
  //     throw new ForbiddenException('User not found');
  //   }

  //   const canEdit = article.authorId === userId || 
  //                   user.role === 'ADMIN' || 
  //                   user.role === 'SUPER_ADMIN';

  //   if (!canEdit) {
  //     throw new ForbiddenException('Not authorized to update this article');
  //   }

  //   const updateData: any = {};

  //   // Update only provided fields
  //   if (dto.title !== undefined) {
  //     updateData.title = dto.title;
  //     updateData.slug = slugify(dto.title);
  //   }
  //   if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
  //   if (dto.content !== undefined) {
  //     updateData.content = dto.content;
  //     updateData.plainText = this.extractPlainText(dto.content);
  //     updateData.readingTime = this.calculateReadingTime(dto.content);
  //   }
  //   if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
  //   if (dto.tags !== undefined) updateData.tags = dto.tags;
  //   if (dto.accessType !== undefined) updateData.accessType = dto.accessType;
  //   if (dto.coinPrice !== undefined) updateData.coinPrice = dto.coinPrice;
  //   if (dto.coverImage !== undefined) updateData.coverImage = dto.coverImage;
  //   if (dto.metaTitle !== undefined) updateData.metaTitle = dto.metaTitle;
  //   if (dto.metaDescription !== undefined) updateData.metaDescription = dto.metaDescription;
  //   if (dto.autoTranslate !== undefined) updateData.autoTranslate = dto.autoTranslate;
  //   if (dto.targetLanguages !== undefined) updateData.targetLanguages = dto.targetLanguages;
  //   if (dto.status !== undefined) {
  //     updateData.status = dto.status;
  //     // Set publishedAt if status changes to PUBLISHED
  //     if (dto.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
  //       updateData.publishedAt = new Date();
  //     }
  //   }

  //   const updated = await this.prisma.article.update({
  //     where: { slug: article.slug }, // Use original slug in case title changed
  //     data: updateData,
  //     include: {
  //       category: true,
  //       author: {
  //         select: {
  //           id: true,
  //           name: true,
  //           username: true,
  //           picture: true,
  //         },
  //       },
  //     },
  //   });

  //   // Check if we need to trigger translations
  //   // Trigger if: 
  //   // 1. Article is now published (or was already published)
  //   // 2. Auto-translate is enabled
  //   // 3. There are target languages
  //   // 4. Content was changed OR status changed to PUBLISHED
  //   const shouldTriggerTranslations = 
  //     (updated.status === ArticleStatus.PUBLISHED) &&
  //     updated.autoTranslate &&
  //     updated.targetLanguages &&
  //     updated.targetLanguages.length > 0 &&
  //     (dto.content !== undefined || dto.status === ArticleStatus.PUBLISHED);

  //   if (shouldTriggerTranslations) {
  //     const existingTranslations = await this.prisma.articleTranslation.findMany({
  //       where: { articleId: updated.id },
  //       select: { language: true },
  //     });

  //     const existingLanguages = existingTranslations.map(t => t.language);
  //     const languagesToTranslate = updated.targetLanguages.filter(lang => 
  //       lang !== 'en' && !existingLanguages.includes(lang)
  //     );

  //     if (languagesToTranslate.length > 0) {
  //       this.processTranslationsInBackground(updated.id, languagesToTranslate)
  //         .then(result => {
  //           this.logger.log(
  //             `Updated translations for article "${updated.title}": ` +
  //             `${result.successful} successful, ${result.failed} failed`
  //           );
  //         })
  //         .catch(error => {
  //           this.logger.error(`Background translation update failed for article ${updated.id}:`, error);
  //         });
  //     }
  //   }

  //   return updated;
  // }

  async listArticles(options: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    status?: ArticleStatus;
    accessType?: ContentAccess;
    featured?: boolean;
    trending?: boolean;
    language?: string;
    authorId?: string;
    search?: string;
  }) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Cap at 100 for performance
    const skip = (page - 1) * limit;

    const where: any = {};

    // Default to published articles unless specified
    if (options.status !== undefined) {
      where.status = options.status;
    } else {
      where.status = ArticleStatus.PUBLISHED;
    }

    if (options.category) {
      where.category = { slug: options.category };
    }

    if (options.tag) {
      where.tags = { has: options.tag };
    }

    if (options.accessType) {
      where.accessType = options.accessType;
    }

    if (options.featured !== undefined) {
      where.isFeatured = options.featured;
    }

    if (options.trending !== undefined) {
      where.isTrending = options.trending;
    }

    if (options.authorId) {
      where.authorId = options.authorId;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { excerpt: { contains: options.search, mode: 'insensitive' } },
        { plainText: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              picture: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              views: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map(article => ({
        ...article,
        commentCount: article._count.comments,
        likeCount: article._count.likes,
        viewCount: article._count.views,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: total > skip + limit,
    };
  }

  async getDashboardStats(timeRange: string = '7days') {
  const now = new Date();
  const startDate = new Date();
  
  // Calculate start date based on timeRange
  switch (timeRange) {
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  try {
    // Execute all queries in parallel
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      premiumArticles,
      totalViews,
      totalLikes,
      totalComments,
      monthlyGrowth,
      topCategories,
      recentActivity,
    ] = await Promise.all([
      // Total articles
      this.prisma.article.count(),
      
      // Published articles
      this.prisma.article.count({
        where: { status: ArticleStatus.PUBLISHED },
      }),
      
      // Draft articles
      this.prisma.article.count({
        where: { status: ArticleStatus.DRAFT },
      }),
      
      // Premium articles
      this.prisma.article.count({
        where: { 
          accessType: ContentAccess.PREMIUM,
          status: ArticleStatus.PUBLISHED,
        },
      }),
      
      // Total views
      this.prisma.articleView.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // Total likes
      this.prisma.articleLike.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // Total comments
      this.prisma.articleComment.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // Monthly growth (calculated from last month)
      this.calculateMonthlyGrowth(startDate),
      
      // Top categories
      this.getTopCategories(),
      
      // Recent activity
      this.getRecentActivity(),
    ]);

    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      premiumArticles,
      totalViews,
      totalLikes,
      totalComments,
      monthlyGrowth,
      topCategories,
      recentActivity,
    };
  } catch (error) {
    this.logger.error('Error getting dashboard stats:', error);
    // Return empty/default stats
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      premiumArticles: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      monthlyGrowth: 0,
      topCategories: [],
      recentActivity: [],
    };
  }
}

private async calculateMonthlyGrowth(startDate: Date): Promise<number> {
  try {
    const previousMonthStart = new Date(startDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    const [currentArticles, previousArticles] = await Promise.all([
      this.prisma.article.count({
        where: { 
          createdAt: { gte: startDate },
          status: ArticleStatus.PUBLISHED,
        },
      }),
      this.prisma.article.count({
        where: { 
          createdAt: { 
            gte: previousMonthStart,
            lt: startDate,
          },
          status: ArticleStatus.PUBLISHED,
        },
      }),
    ]);
    
    if (previousArticles === 0) {
      return currentArticles > 0 ? 100 : 0;
    }
    
    const growth = ((currentArticles - previousArticles) / previousArticles) * 100;
    return Math.round(growth * 10) / 10; // Round to 1 decimal
  } catch (error) {
    this.logger.error('Error calculating monthly growth:', error);
    return 0;
  }
}

private async getTopCategories() {
  try {
    const categories = await this.prisma.articleCategory.findMany({
      include: {
        _count: {
          select: { 
            articles: {
              where: { status: ArticleStatus.PUBLISHED }
            } 
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Process categories in parallel
    const categoriesWithGrowth = await Promise.all(
      categories.map(async (cat) => {
        const growth = await this.calculateCategoryGrowth(cat.id);
        return {
          id: cat.id,
          name: cat.name,
          count: cat._count.articles,
          color: cat.color,
          growth: growth,
        };
      })
    );

    return categoriesWithGrowth;
  } catch (error) {
    this.logger.error('Error getting top categories:', error);
    return [];
  }
}


async getTrendingArticles(limit: number = 6) {
  return this.prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      // You can add isTrending: true if you have that field
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
      category: true,
    },
    orderBy: [
      { createdAt: 'desc' }
    ],
    take: limit,
  });
}

private async calculateCategoryGrowth(categoryId: string): Promise<number> {
  try {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    
    const [currentMonthArticles, lastMonthArticles] = await Promise.all([
      this.prisma.article.count({
        where: { 
          categoryId,
          status: ArticleStatus.PUBLISHED,
          createdAt: { 
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          },
        },
      }),
      this.prisma.article.count({
        where: { 
          categoryId,
          status: ArticleStatus.PUBLISHED,
          createdAt: { 
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
    ]);
    
    if (lastMonthArticles === 0) {
      return currentMonthArticles > 0 ? 100 : 0;
    }
    
    const growth = ((currentMonthArticles - lastMonthArticles) / lastMonthArticles) * 100;
    return Math.round(growth);
  } catch (error) {
    this.logger.error(`Error calculating growth for category ${categoryId}:`, error);
    return 0;
  }
}

private async getRecentActivity() {
  try {
    // Get recent published articles
    const recentArticles = await this.prisma.article.findMany({
      where: { 
        status: ArticleStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    // Get recent comments
    const recentComments = await this.prisma.articleComment.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Format activities
    const articleActivities = recentArticles.map(article => ({
      id: article.id,
      action: 'PUBLISH',
      user: article.author.name,
      target: article.title,
      time: article.publishedAt!.toISOString(),
      avatar: article.author.picture,
    }));

    const commentActivities = recentComments.map(comment => ({
      id: comment.id,
      action: 'COMMENT',
      user: comment.user.name,
      target: comment.article.title,
      time: comment.createdAt.toISOString(),
      avatar: comment.user.picture,
    }));

    // Combine and sort
    const allActivities = [...articleActivities, ...commentActivities];
    
    // Sort by time (newest first) and limit to 10
    return allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  } catch (error) {
    this.logger.error('Error getting recent activity:', error);
    return [];
  }
}

async getRecentArticles() {
  try {
    return await this.prisma.article.findMany({
      where: { 
        status: ArticleStatus.PUBLISHED,
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
      },
    });
  } catch (error) {
    this.logger.error('Error getting recent articles:', error);
    return [];
  }
}

async getTopArticles() {
  try {
    return await this.prisma.article.findMany({
      where: { 
        status: ArticleStatus.PUBLISHED,
      },
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { commentCount: 'desc' },
      ],
      take: 10,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  } catch (error) {
    this.logger.error('Error getting top articles:', error);
    return [];
  }
}


// async getCommentsByArticleId(
//   articleId: string, 
//   page: number = 1, 
//   limit: number = 10,
//   currentUserId?: string
// ) {
//   console.log('========== getCommentsByArticleId START ==========');
//   console.log('Article ID:', articleId);
//   console.log('Page:', page);
//   console.log('Limit:', limit);
  
//   const skip = (page - 1) * limit;
  
//   // Check if article exists
//   const article = await this.prisma.article.findUnique({
//     where: { id: articleId },
//     select: { id: true, title: true, slug: true },
//   });
  
//   console.log('Article found:', article);
  
//   if (!article) {
//     console.log('Article not found, returning empty comments');
//     return {
//       comments: [],
//       meta: {
//         total: 0,
//         page,
//         limit,
//         pages: 0,
//       },
//     };
//   }
  
//   console.log(`Looking for comments for article: ${article.title} (${article.slug})`);
  
//   // Check if there are any comments at all
//   const allCommentsCount = await this.prisma.articleComment.count({
//     where: { articleId },
//   });
  
//   console.log(`Total comments in DB for this article: ${allCommentsCount}`);
  
//   const [comments, total] = await Promise.all([
//     this.prisma.articleComment.findMany({
//       where: {
//         articleId,
//         parentId: null,
//         status: 'ACTIVE',
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//         replies: {
//           where: { status: 'ACTIVE' },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 username: true,
//                 picture: true,
//               },
//             },
//           },
//           orderBy: { createdAt: 'asc' },
//         },
//       },
//       orderBy: [
//         { isPinned: 'desc' },
//         { createdAt: 'desc' }
//       ],
//       skip,
//       take: limit,
//     }),
//     this.prisma.articleComment.count({
//       where: {
//         articleId,
//         parentId: null,
//         status: 'ACTIVE',
//       },
//     }),
//   ]);

//   console.log(`Query found ${comments.length} top-level comments`);
//   console.log(`Total top-level comments (according to count): ${total}`);
  
//   if (comments.length > 0) {
//     console.log('First comment content:', comments[0].content);
//     console.log('First comment user:', comments[0].user);
//     console.log('First comment replies count:', comments[0].replies?.length);
//   }
  
//   // Format comments
//   const formattedComments = comments.map((comment, index) => {
//     console.log(`Processing comment ${index + 1}:`, {
//       id: comment.id,
//       contentLength: comment.content?.length,
//       user: comment.user?.name,
//       replyCount: comment.replies?.length
//     });
    
//     return {
//       id: comment.id,
//       content: comment.content,
//       createdAt: comment.createdAt.toISOString(),
//       updatedAt: comment.updatedAt.toISOString(),
//       likeCount: comment.likeCount || 0,
//       replyCount: comment.replies?.length || 0,
//       isEdited: comment.isEdited,
//       isPinned: comment.isPinned,
//       isFeatured: comment.isFeatured,
//       language: comment.language,
//       user: comment.user,
//       replies: comment.replies?.map(reply => ({
//         id: reply.id,
//         content: reply.content,
//         createdAt: reply.createdAt.toISOString(),
//         updatedAt: reply.updatedAt.toISOString(),
//         likeCount: reply.likeCount || 0,
//         isEdited: reply.isEdited,
//         user: reply.user,
//       })) || [],
//     };
//   });

//   console.log(`Formatted ${formattedComments.length} comments`);
//   console.log('========== getCommentsByArticleId END ==========');
  
//   return {
//     comments: formattedComments,
//     meta: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(total / limit),
//     },
//   };
// }

async getArticleById(id: string) {
  const article = await this.prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  return article;
}

async getRelatedArticlesByIdOrSlug(identifier: string, limit: number = 3) {
  let article;
  
  // Determine if identifier is ID or slug
  if (identifier.length === 25 && !identifier.includes('-')) {
    // ID
    article = await this.prisma.article.findUnique({
      where: { id: identifier },
      select: {
        id: true,
        categoryId: true,
        tags: true,
        keywords: true,
      },
    });
  } else {
    // Slug
    article = await this.prisma.article.findUnique({
      where: { slug: identifier },
      select: {
        id: true,
        categoryId: true,
        tags: true,
        keywords: true,
      },
    });
  }

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  // Get related articles
  const relatedArticles = await this.prisma.article.findMany({
    where: {
      AND: [
        { id: { not: article.id } },
        { status: ArticleStatus.PUBLISHED },
        {
          OR: [
            article.categoryId ? { categoryId: article.categoryId } : {},
            article.tags?.length ? { tags: { hasSome: article.tags } } : {},
            article.keywords?.length ? { keywords: { hasSome: article.keywords } } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
      category: true,
      _count: {
        select: {
          views: true,
          likes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2, // Get more than needed
  });

  // Sort manually by engagement
  const sortedArticles = [...relatedArticles].sort((a, b) => {
    const aEngagement = (a._count?.views || 0) + (a._count?.likes || 0);
    const bEngagement = (b._count?.views || 0) + (b._count?.likes || 0);
    return bEngagement - aEngagement;
  });

  // Take only what we need and remove _count
  const finalArticles = sortedArticles.slice(0, limit).map(({ _count, ...rest }) => rest);

  return finalArticles;
}


  async likeArticle(articleId: string, userId: string, language: string = 'en') {
    try {
      // Check if article exists and is published
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { status: true },
      });

      if (!article || article.status !== ArticleStatus.PUBLISHED) {
        throw new NotFoundException('Article not found or not published');
      }

      // Check if already liked
      const existing = await this.prisma.articleLike.findUnique({
        where: {
          articleId_userId_language: {
            articleId,
            userId,
            language,
          },
        },
      });

      if (existing) {
        // Unlike the article
        await this.prisma.articleLike.delete({
          where: {
            articleId_userId_language: {
              articleId,
              userId,
              language,
            },
          },
        });

        // Update like count (eventually consistent - could fail but that's okay)
        try {
          await this.prisma.article.update({
            where: { id: articleId },
            data: {
              likeCount: { decrement: 1 },
            },
          });
        } catch (updateError) {
          this.logger.warn(`Failed to update like count for article ${articleId}:`, updateError);
          // Continue anyway - we'll sync counts later if needed
        }

        return { liked: false, message: 'Article unliked' };
      } else {
        // Like the article
        await this.prisma.articleLike.create({
          data: {
            articleId,
            userId,
            language,
          },
        });

        // Update like count
        try {
          await this.prisma.article.update({
            where: { id: articleId },
            data: {
              likeCount: { increment: 1 },
            },
          });
        } catch (updateError) {
          this.logger.warn(`Failed to update like count for article ${articleId}:`, updateError);
          // Continue anyway
        }

        return { liked: true, message: 'Article liked' };
      }
    } catch (error) {
      this.logger.error(`Error in likeArticle:`, error);
      throw error;
    }
  }




  async saveArticle(articleId: string, userId: string, language: string = 'en') {
  try {
    // Check if article exists and is published
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { status: true },
    });

    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw new NotFoundException('Article not found or not published');
    }

    // Check if already saved
    const existing = await this.prisma.articleSave.findFirst({
      where: {
        articleId,
        userId,
        language,
      },
    });

    if (existing) {
      // Unsave the article
      await this.prisma.articleSave.delete({
        where: { id: existing.id },
      });

      // Update save count
      try {
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            saveCount: { decrement: 1 },
          },
        });
      } catch (updateError) {
        this.logger.warn(`Failed to update save count for article ${articleId}:`, updateError);
      }

      return { saved: false, message: 'Article removed from saved' };
    } else {
      // Save the article
      await this.prisma.articleSave.create({
        data: {
          articleId,
          userId,
          language,
        },
      });

      // Update save count
      try {
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            saveCount: { increment: 1 },
          },
        });
      } catch (updateError) {
        this.logger.warn(`Failed to update save count for article ${articleId}:`, updateError);
      }

      return { saved: true, message: 'Article saved successfully' };
    }
  } catch (error) {
    this.logger.error(`Error in saveArticle:`, error);
    throw error;
  }
}


async trackArticleView(articleId: string, userId?: string, language: string = 'en') {
  try {
    // 1. Try to create view - will fail if duplicate due to unique constraint
    const view = await this.prisma.articleView.create({
      data: {
        articleId,
        userId: userId || null,
        language,
        ipAddress: '',
        userAgent: '',
      },
    });

    // 2. Update article counts
    const updateData: any = {
      viewCount: { increment: 1 },
    };

    // Check if this is first view from this user
    if (userId) {
      const previousUserViews = await this.prisma.articleView.count({
        where: {
          articleId,
          userId,
        },
      });

      if (previousUserViews === 1) { // This is the first one we just created
        updateData.uniqueViewCount = { increment: 1 };
      }
    }

    await this.prisma.article.update({
      where: { id: articleId },
      data: updateData,
    });

    return { 
      success: true, 
      message: 'View counted',
      viewId: view.id,
    };

  } catch (error) {
    // If duplicate, just return success - view already counted
    if (error.code === 'P2002') {
      return { 
        success: true, 
        message: 'View already counted (duplicate)',
        isDuplicate: true,
      };
    }

    // For other errors, log but don't fail
    this.logger.debug('View tracking error (non-critical):', error.message);
    return { 
      success: true, // Still return success to frontend
      message: 'View may have been counted',
      error: error.message,
    };
  }
}

  async addComment(articleId: string, userId: string, dto: CommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { status: true, accessType: true },
    });

    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw new NotFoundException('Article not found or not published');
    }

    // Check premium access for commenting on premium articles
    if (article.accessType === ContentAccess.PREMIUM) {
      const hasAccess = await this.checkPremiumAccess(userId, articleId);
      if (!hasAccess) {
        throw new ForbiddenException('You need premium access to comment on this article');
      }
    }

    // Validate parent comment exists if provided
    if (dto.parentId) {
      const parentComment = await this.prisma.articleComment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment || parentComment.articleId !== articleId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.articleComment.create({
        data: {
          content: dto.content,
          articleId,
          userId,
          parentId: dto.parentId,
          language: dto.language || 'en',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              picture: true,
            },
          },
        },
      });

      // Update comment count
      await tx.article.update({
        where: { id: articleId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return newComment;
    });

    // Track engagement
    try {
      await this.engagementService.trackEngagement(userId, articleId, 'COMMENT', { 
        commentId: comment.id,
        language: dto.language || 'en',
      });
    } catch (error) {
      this.logger.warn(`Failed to track comment engagement for article ${articleId}:`, error);
    }

    return comment;
  }



  async likeComment(commentId: string, userId: string) {
  const comment = await this.prisma.articleComment.findUnique({
    where: { id: commentId },
    select: { id: true, articleId: true, likeCount: true },
  });

  if (!comment) {
    throw new NotFoundException('Comment not found');
  }

  // Check if already liked
  const existingLike = await this.prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingLike) {
    // Unlike
    await this.prisma.$transaction([
      this.prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      }),
      this.prisma.articleComment.update({
        where: { id: commentId },
        data: {
          likeCount: { decrement: 1 },
        },
      }),
    ]);

    return { liked: false, likeCount: comment.likeCount - 1 };
  } else {
    // Like
    await this.prisma.$transaction([
      this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      }),
      this.prisma.articleComment.update({
        where: { id: commentId },
        data: {
          likeCount: { increment: 1 },
        },
      }),
    ]);

    // Track engagement
    try {
      await this.engagementService.trackEngagement(userId, comment.articleId, 'LIKE', {
        commentId,
      });
    } catch (error) {
      this.logger.warn(`Failed to track comment like engagement:`, error);
    }

    return { liked: true, likeCount: comment.likeCount + 1 };
  }
}

async unlikeComment(commentId: string, userId: string) {
  return this.likeComment(commentId, userId); // Same logic - toggles like/unlike
}

async updateComment(commentId: string, userId: string, content: string) {
  const comment = await this.prisma.articleComment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
  });

  if (!comment) {
    throw new NotFoundException('Comment not found');
  }

  // Check ownership
  if (comment.userId !== userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      throw new ForbiddenException('You can only edit your own comments');
    }
  }

  // Update comment
  const updated = await this.prisma.articleComment.update({
    where: { id: commentId },
    data: {
      content,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
      replies: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return {
    ...updated,
    replyCount: updated.replies?.length || 0,
  };
}

async deleteComment(commentId: string, userId: string) {
  const comment = await this.prisma.articleComment.findUnique({
    where: { id: commentId },
    include: {
      user: true,
      replies: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!comment) {
    throw new NotFoundException('Comment not found');
  }

  // Check ownership or admin
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isOwner = comment.userId === userId;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You can only delete your own comments');
  }

  // Soft delete
  const deleted = await this.prisma.articleComment.update({
    where: { id: commentId },
    data: {
      status: 'DELETED',
      content: isAdmin ? '[Removed by moderator]' : '[Deleted by user]',
      isEdited: false,
    },
  });

  // Update article comment count
  await this.prisma.article.update({
    where: { id: comment.articleId },
    data: {
      commentCount: { decrement: 1 },
    },
  });

  return { success: true, message: 'Comment deleted' };
}




async getCommentsByArticleId(
  articleId: string, 
  page: number = 1, 
  limit: number = 10,
  currentUserId?: string,
  depth: number = 2
) {
  const skip = (page - 1) * limit;
  
  const article = await this.prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, slug: true },
  });
  
  if (!article) {
    return {
      comments: [],
      meta: {
        total: 0,
        page,
        limit,
        pages: 0,
        hasMore: false,
      },
    };
  }
  
  // Build the include query dynamically based on depth
  const buildInclude = (currentDepth: number): any => {
    const include: any = {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
    };

    // Add replies if we haven't reached the max depth
    if (currentDepth > 0) {
      include.replies = {
        where: { status: 'ACTIVE' },
        include: buildInclude(currentDepth - 1),
        orderBy: { createdAt: 'asc' },
        take: 3, // Limit nested replies
      };
    }

    return include;
  };

  const [comments, total] = await Promise.all([
    this.prisma.articleComment.findMany({
      where: {
        articleId,
        parentId: null,
        status: 'ACTIVE',
      },
      include: buildInclude(depth),
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    }),
    this.prisma.articleComment.count({
      where: {
        articleId,
        parentId: null,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Recursive function to process comments and check likes
  const processComment = async (comment: any, userId?: string): Promise<any> => {
    let isLiked = false;
    let isOwn = false;
    
    if (userId) {
      const like = await this.prisma.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: comment.id,
            userId,
          },
        },
      });
      isLiked = !!like;
      isOwn = comment.userId === userId;
    }

    // Process replies recursively
    let processedReplies: any[] = [];
    if (comment.replies && comment.replies.length > 0) {
      processedReplies = await Promise.all(
        comment.replies.map(async (reply: any) => await processComment(reply, userId))
      );
    }

    // Count total replies (not just the ones we loaded)
    const totalReplyCount = await this.prisma.articleComment.count({
      where: {
        parentId: comment.id,
        status: 'ACTIVE',
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      createdAt: (comment.createdAt instanceof Date 
        ? comment.createdAt 
        : new Date(comment.createdAt)
      ).toISOString(),
      updatedAt: comment.updatedAt 
        ? (comment.updatedAt instanceof Date 
            ? comment.updatedAt 
            : new Date(comment.updatedAt)
          ).toISOString()
        : null,
      likeCount: comment.likeCount || 0,
      replyCount: totalReplyCount,
      isLiked,
      isOwn,
      isEdited: comment.isEdited || false,
      isPinned: comment.isPinned || false,
      isFeatured: comment.isFeatured || false,
      language: comment.language || 'en',
      user: comment.user || null,
      replies: processedReplies,
      hasMoreReplies: totalReplyCount > processedReplies.length,
    };
  };

  const formattedComments = await Promise.all(
    comments.map(async (comment) => await processComment(comment, currentUserId))
  );
  
  // Calculate hasMore - this is crucial!
  const hasMore = total > skip + limit;
  
  return {
    comments: formattedComments,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: hasMore,
      nextPage: hasMore ? page + 1 : null,
    },
  };
}


async getCommentReplies(
  commentId: string, 
  page: number = 1, 
  limit: number = 10,
  currentUserId?: string
) {
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    this.prisma.articleComment.findMany({
      where: {
        parentId: commentId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
        // Include nested replies (1 level deep)
        replies: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                picture: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 2, // Get 2 nested replies initially
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    this.prisma.articleComment.count({
      where: {
        parentId: commentId,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Process each reply
  const processedReplies = await Promise.all(
    replies.map(async (reply): Promise<any> => {
      let isLiked = false;
      let isOwn = false;
      
      if (currentUserId) {
        const like = await this.prisma.commentLike.findUnique({
          where: {
            commentId_userId: {
              commentId: reply.id,
              userId: currentUserId,
            },
          },
        });
        isLiked = !!like;
        isOwn = reply.userId === currentUserId;
      }

      // Process nested replies
      let processedNestedReplies: any[] = [];
      if (reply.replies && reply.replies.length > 0) {
        processedNestedReplies = await Promise.all(
          reply.replies.map(async (nestedReply): Promise<any> => {
            let nestedIsLiked = false;
            let nestedIsOwn = false;
            
            if (currentUserId) {
              const nestedLike = await this.prisma.commentLike.findUnique({
                where: {
                  commentId_userId: {
                    commentId: nestedReply.id,
                    userId: currentUserId,
                  },
                },
              });
              nestedIsLiked = !!nestedLike;
              nestedIsOwn = nestedReply.userId === currentUserId;
            }
            
            return {
              id: nestedReply.id,
              content: nestedReply.content,
              createdAt: nestedReply.createdAt.toISOString(),
              updatedAt: nestedReply.updatedAt.toISOString(),
              likeCount: nestedReply.likeCount || 0,
              isLiked: nestedIsLiked,
              isOwn: nestedIsOwn,
              isEdited: nestedReply.isEdited || false,
              user: nestedReply.user || null,
              replies: [], // Don't go deeper initially
              hasMoreReplies: await this.prisma.articleComment.count({
                where: {
                  parentId: nestedReply.id,
                  status: 'ACTIVE',
                },
              }) > 0,
            };
          })
        );
      }

      // Count total replies for this comment
      const totalReplyCount = await this.prisma.articleComment.count({
        where: {
          parentId: reply.id,
          status: 'ACTIVE',
        },
      });

      return {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        likeCount: reply.likeCount || 0,
        isLiked,
        isOwn,
        isEdited: reply.isEdited || false,
        user: reply.user || null,
        replies: processedNestedReplies,
        replyCount: totalReplyCount,
        hasMoreReplies: totalReplyCount > processedNestedReplies.length,
      };
    })
  );

  return {
    replies: processedReplies,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: total > skip + limit,
      nextPage: total > skip + limit ? page + 1 : null,
    },
  };
}
  

  private async checkPremiumAccess(userId: string, articleId: string): Promise<boolean> {
    // Check if user is the author (authors have free access to their own articles)
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { authorId: true },
    });

    if (article?.authorId === userId) {
      return true;
    }

    // Check subscription
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() },
      },
    });

    if (subscription) return true;

    // Check if user already purchased access
    const existingAccess = await this.prisma.premiumAccess.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingAccess && existingAccess.accessUntil > new Date()) {
      return true;
    }

    // Check wallet balance for coin purchase
    const articleWithPrice = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { coinPrice: true },
    });

    if (articleWithPrice?.coinPrice && articleWithPrice.coinPrice > 0) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (wallet && wallet.balance >= articleWithPrice.coinPrice) {
        // Process coin payment
        await this.processCoinPurchase(userId, articleId, articleWithPrice.coinPrice);
        return true;
      }
    }

    return false;
  }

  private async processCoinPurchase(userId: string, articleId: string, price: number) {
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.balance < price) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct coins
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: price },
        },
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: price,
          type: 'DEBIT',
          source: TransactionSource.ONE_TIME_PURCHASE,
          description: `Purchased premium article: ${articleId}`,
          userId,
        },
      });

      // Log usage
      await tx.usageLog.create({
        data: {
          userId,
          action: UsageAction.TEMPLATE_PREMIUM,
          cost: price,
          metadata: { articleId, type: 'PREMIUM_ARTICLE_ACCESS' },
        },
      });

      // Create premium access record
      await tx.premiumAccess.create({
        data: {
          userId,
          articleId,
          amountPaid: price,
          accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      this.logger.log(`User ${userId} purchased article ${articleId} for ${price} coins`);
    });
  }

  async deleteArticle(slug: string, userId: string, hardDelete: boolean = false) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true, status: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const canDelete = article.authorId === userId || 
                     user?.role === 'ADMIN' || 
                     user?.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('Not authorized to delete this article');
    }

    if (hardDelete) {
      // Hard delete - remove everything
      await this.prisma.article.delete({
        where: { id: article.id },
      });
      return { success: true, message: 'Article permanently deleted' };
    } else {
      // Soft delete - archive the article
      await this.prisma.article.update({
        where: { id: article.id },
        data: { status: ArticleStatus.ARCHIVED },
      });
      return { success: true, message: 'Article archived' };
    }
  }

  async publishArticle(slug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true, status: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const canPublish = article.authorId === userId || 
                      user?.role === 'ADMIN' || 
                      user?.role === 'SUPER_ADMIN';

    if (!canPublish) {
      throw new ForbiddenException('Not authorized to publish this article');
    }

    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
      },
    });

    // Trigger translations if auto-translate is enabled
    if (updated.autoTranslate && updated.targetLanguages && updated.targetLanguages.length > 0) {
      this.processTranslationsInBackground(updated.id, updated.targetLanguages)
        .then(result => {
          this.logger.log(
            `Auto-translations triggered for published article "${updated.title}": ` +
            `${result.successful} successful, ${result.failed} failed`
          );
        })
        .catch(error => {
          this.logger.error(`Auto-translation failed for published article ${updated.id}:`, error);
        });
    }

    return updated;
  }

  private extractPlainText(content: any): string {
    if (typeof content === 'string') return content;
    
    try {
      if (content && typeof content === 'object') {
        // Handle TipTap JSON content
        if (content.type === 'doc' && content.content) {
          return this.extractTextFromNodes(content.content);
        }
        // Handle other structured content
        if (content.text) return content.text;
        if (content.content) return JSON.stringify(content.content);
      }
    } catch (error) {
      this.logger.warn('Failed to extract plain text from content:', error);
    }
    
    return '';
  }

  private extractTextFromNodes(nodes: any[]): string {
    let text = '';
    for (const node of nodes) {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        text += this.extractTextFromNodes(node.content);
      }
    }
    return text.trim();
  }

  private calculateReadingTime(content: any): number {
    const plainText = this.extractPlainText(content);
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    const wordsPerMinute = 200; // Average reading speed
    const minutes = wordCount / wordsPerMinute;
    return Math.max(1, Math.ceil(minutes));
  }

  private getPreviewVersion(article: any) {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      preview: article.excerpt.substring(0, 200) + (article.excerpt.length > 200 ? '...' : ''),
      category: article.category,
      tags: article.tags,
      accessType: article.accessType,
      coinPrice: article.coinPrice,
      author: article.author,
      coverImage: article.coverImage,
      readingTime: article.readingTime,
      status: article.status,
      isFeatured: article.isFeatured,
      isTrending: article.isTrending,
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      publishedAt: article.publishedAt,
      availableLanguages: article.availableLanguages,
      isPreview: true,
      requiresPurchase: true,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  private isPreviewVersion(article: any): boolean {
    return article.isPreview === true;
  }

  async getArticleStats(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const [
      views,
      likes,
      comments,
      shares,
      saves,
      claps,
      translations,
    ] = await Promise.all([
      this.prisma.articleView.count({ where: { articleId } }),
      this.prisma.articleLike.count({ where: { articleId } }),
      this.prisma.articleComment.count({ where: { articleId } }),
      this.prisma.articleShare.count({ where: { articleId } }),
      this.prisma.articleSave.count({ where: { articleId } }),
      this.prisma.articleClap.aggregate({
        where: { articleId },
        _sum: { count: true },
      }),
      this.prisma.articleTranslation.count({ 
        where: { 
          articleId,
          status: TranslationStatus.COMPLETED 
        } 
      }),
    ]);

    return {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
      stats: {
        views,
        likes,
        comments,
        shares,
        saves,
        claps: claps._sum.count || 0,
        translations,
      },
      calculated: {
        engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
        avgClapsPerUser: likes > 0 ? (claps._sum.count || 0) / likes : 0,
      },
    };
  }


 async purchaseArticle(articleId: string, userId: string, language: string = 'en') {
  console.log('=== PURCHASE START ===');
  console.log('Article ID:', articleId);
  console.log('User ID:', userId);
  
  try {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { 
        id: true,
        title: true,
        accessType: true,
        coinPrice: true,
        authorId: true,
        status: true 
      },
    });

    console.log('Article found:', article);

    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      console.log('Article not found or not published');
      throw new NotFoundException('Article not found or not published');
    }

    if (article.accessType !== ContentAccess.PREMIUM) {
      console.log('Article is not premium');
      throw new BadRequestException('This article is not premium');
    }

    // Check if already has access
    const existingAccess = await this.prisma.premiumAccess.findFirst({
      where: {
        userId,
        articleId,
        accessUntil: { gt: new Date() }
      },
    });

    console.log('Existing access check:', existingAccess);

    // If user already has access, return success
    if (existingAccess) {
      console.log('User already has access');
      return {
        success: true,
        data: { purchased: true },
        message: 'Already have access to this article',
      };
    }

    // Check wallet balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    console.log('Wallet found:', wallet);

    if (!wallet || wallet.balance < article.coinPrice) {
      console.log('Insufficient balance:', wallet?.balance, 'needed:', article.coinPrice);
      throw new BadRequestException('Insufficient balance');
    }

    console.log('Proceeding with purchase...');
    
    // Process purchase in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      console.log('Starting transaction...');
      
      // Deduct coins
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: article.coinPrice },
        },
      });
      console.log('Coins deducted. New balance:', updatedWallet.balance);

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: article.coinPrice,
          type: 'DEBIT',
          source: TransactionSource.ONE_TIME_PURCHASE,
          description: `Purchased premium article: ${article.title}`,
          userId,
        },
      });
      console.log('Transaction created:', transaction.id);

      // Create premium access record
      const premiumAccess = await tx.premiumAccess.create({
        data: {
          userId,
          articleId,
          amountPaid: article.coinPrice,
          accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      console.log('PremiumAccess created:', premiumAccess.id);

      // Log usage
      await tx.usageLog.create({
        data: {
          userId,
          action: UsageAction.TEMPLATE_PREMIUM,
          cost: article.coinPrice,
          metadata: { 
            articleId, 
            articleTitle: article.title,
            type: 'PREMIUM_ARTICLE_PURCHASE' 
          },
        },
      });
      console.log('Usage logged');

      return {
        transaction,
        premiumAccess,
      };
    });

    console.log('=== PURCHASE COMPLETED SUCCESSFULLY ===');
    
    return {
      success: true,
      data: { purchased: true },
      message: 'Article purchased successfully',
      transactionId: result.transaction.id,
      premiumAccessId: result.premiumAccess.id,
    };

  } catch (error) {
    console.error('=== PURCHASE FAILED ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    
    // Re-throw the error so it can be handled by the controller
    throw error;
  }
}



// Also update checkArticleAccess to remove language from query
async checkArticleAccess(articleId: string, userId: string, language: string = 'en') {
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
    return { hasAccess: false, reason: 'Article not found or not published' };
  }

  // Authors have access to their own articles
  if (article.authorId === userId) {
    return { hasAccess: true, reason: 'Author of article' };
  }

  // Free articles
  if (article.accessType === ContentAccess.FREE) {
    return { hasAccess: true, reason: 'Free article' };
  }

  // Check premium access (only if accessUntil is in the future)
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
      purchasedAt: existingAccess.createdAt 
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
    return { hasAccess: true, reason: 'Active subscription' };
  }

  return { hasAccess: false, reason: 'No access found' };
}




  async getUserReadingStats(userId: string) {
  // Get total articles viewed (count distinct articles)
  const articleViews = await this.prisma.articleView.findMany({
    where: { userId },
    select: { articleId: true },
    distinct: ['articleId'],
  });
  
  const totalArticlesRead = articleViews.length;

  // Calculate total reading time based on views count (estimate)
  const viewsCount = await this.prisma.articleView.count({
    where: { userId },
  });
  
  // Estimate reading time: average 5 minutes per view
  const totalReadingTime = viewsCount * 5;

  // Reading streak calculation
  const streak = await this.calculateReadingStreak(userId);

  // Favorite category using raw query
  let favoriteCategory = 'None';
  try {
    const categoryResult = await this.prisma.$queryRaw<{category: string, count: number}[]>`
      SELECT ac.name as category, COUNT(DISTINCT av."articleId") as count
      FROM "ArticleView" av
      JOIN "Article" a ON av."articleId" = a.id
      JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
      WHERE av."userId" = ${userId}
      GROUP BY ac.name
      ORDER BY count DESC
      LIMIT 1
    `;
    favoriteCategory = categoryResult[0]?.category || 'None';
  } catch (error) {
    this.logger.warn('Could not calculate favorite category:', error);
  }

  // Weekly progress
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyProgress = await this.prisma.articleView.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
  });

  // Get saved and liked counts
  const savedArticlesCount = await this.prisma.articleSave.count({ where: { userId } });
  const likedArticlesCount = await this.prisma.articleLike.count({ where: { userId } });

  return {
    totalArticlesRead,
    totalReadingTime,
    averageReadingTime: totalArticlesRead > 0 ? Math.round(totalReadingTime / totalArticlesRead) : 0,
    favoriteCategory,
    readingStreak: streak,
    weeklyGoal: 5, // Default weekly goal
    weeklyProgress,
    savedArticlesCount,
    likedArticlesCount,
  };
}

private async calculateReadingStreak(userId: string): Promise<number> {
  // Get unique dates when user read articles
  const readingDates = await this.prisma.articleView.findMany({
    where: { userId },
    select: { createdAt: true },
    distinct: ['createdAt'],
    orderBy: { createdAt: 'desc' },
  });

  if (readingDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = today;
  
  // Check for consecutive days
  for (let i = 0; i < readingDates.length; i++) {
    const readDate = new Date(readingDates[i].createdAt);
    readDate.setHours(0, 0, 0, 0);
    
    // Check if this date matches our current streak
    if (readDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
    } else if (readDate.getTime() < currentDate.getTime()) {
      // Skip past dates we missed
      continue;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

  

  async getUserSavedArticles(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  // First get the saved article IDs
  const saves = await this.prisma.articleSave.findMany({
    where: { userId },
    select: { 
      articleId: true,
      createdAt: true,
      language: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  // Get total count
  const total = await this.prisma.articleSave.count({ where: { userId } });

  if (saves.length === 0) {
    return {
      data: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: total > skip + limit,
    };
  }

  // Get the actual articles
  const articleIds = saves.map(save => save.articleId);
  const articles = await this.prisma.article.findMany({
    where: {
      id: { in: articleIds },
      status: ArticleStatus.PUBLISHED,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
        },
      },
      category: true,
      _count: {
        select: {
          views: true,
          likes: true,
          comments: true,
        },
      },
    },
  });

  // Map saves to articles
  const savesWithArticles = saves.map(save => {
    const article = articles.find(a => a.id === save.articleId);
    if (!article) return null;

    return {
      id: save.articleId, // Use articleId as the ID for removal
      savedAt: save.createdAt,
      language: save.language,
      article: {
        ...article,
        viewCount: article._count?.views || 0,
        likeCount: article._count?.likes || 0,
        commentCount: article._count?.comments || 0,
        _count: undefined, // Remove the _count object
      },
    };
  }).filter(item => item !== null);

  return {
    data: savesWithArticles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: total > skip + limit,
  };
}

 async getUserPremiumAccess(userId: string) {
  // Get purchased articles
  const purchasedAccess = await this.prisma.premiumAccess.findMany({
    where: {
      userId,
      accessUntil: { gt: new Date() },
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              picture: true,
            },
          },
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get subscription articles (if user has active subscription)
  const subscription = await this.prisma.userSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() },
    },
  });

  let subscriptionArticles: any[] = [];
  if (subscription) {
    // Get all premium articles
    subscriptionArticles = await this.prisma.article.findMany({
      where: {
        accessType: ContentAccess.PREMIUM,
        status: ArticleStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
        category: true,
      },
      take: 50,
    });
  }

  // Combine both types of access
  const allAccess = [
    ...purchasedAccess.map(access => ({
      id: access.id,
      articleId: access.articleId,
      article: access.article,
      accessType: 'PURCHASED' as const,
      accessUntil: access.accessUntil,
      createdAt: access.createdAt,
    })),
    ...subscriptionArticles.map(article => ({
      id: `sub-${article.id}`,
      articleId: article.id,
      article,
      accessType: 'SUBSCRIPTION' as const,
      accessUntil: subscription?.currentPeriodEnd,
      createdAt: subscription?.createdAt || new Date(),
    })),
  ];

  return {
    data: allAccess,
    hasSubscription: !!subscription,
    subscriptionEnd: subscription?.currentPeriodEnd,
    purchasedCount: purchasedAccess.length,
    subscriptionCount: subscriptionArticles.length,
  };
}

  async updateReadingProfile(userId: string, dto: any) {
    const updateData: any = {};

    if (dto.preferredCategories) {
      const categories = await this.prisma.articleCategory.findMany({
        where: {
          name: { in: dto.preferredCategories },
          isActive: true,
        },
      });
      
      updateData.favoriteCategories = {
        set: categories.map(cat => ({ id: cat.id })),
      };
    }

    if (dto.readingLevel) {
      updateData.difficultyPreference = dto.readingLevel;
    }

    if (dto.preferredReadingTime) {
      updateData.preferredReadingTime = dto.preferredReadingTime;
    }

    if (dto.interests) {
      updateData.favoriteTags = dto.interests;
    }

    return await this.prisma.userReadingProfile.update({
      where: { userId },
      data: updateData,
      include: {
        favoriteCategories: true,
      },
    });
  }



  async getUserAchievements(userId: string): Promise<{
    achievements: any[];
    unlockedCount: number;
    totalPoints: number;
  }> {
  const userStats = await this.getUserReadingStats(userId);
  
  // Define achievement criteria based on user stats
  const achievements = [
    {
      id: 'article_explorer',
      title: 'Article Explorer',
      description: 'Read your first 10 articles',
      icon: 'book',
      badgeColor: '#3B82F6',
      progress: Math.min(userStats.totalArticlesRead, 10),
      totalRequired: 10,
      unlocked: userStats.totalArticlesRead >= 10,
      rarity: 'COMMON' as const,
      category: 'READING' as const,
      points: 50,
      shareable: true
    },
    {
      id: 'reading_marathon',
      title: 'Reading Marathon',
      description: 'Read for 100 hours total',
      icon: 'clock',
      badgeColor: '#10B981',
      progress: Math.min(userStats.totalReadingTime, 100),
      totalRequired: 100,
      unlocked: userStats.totalReadingTime >= 100,
      rarity: 'RARE' as const,
      category: 'READING' as const,
      points: 150,
      shareable: true
    },
    {
      id: 'trend_setter',
      title: 'Trend Setter',
      description: 'Read 5 trending articles',
      icon: 'fire',
      badgeColor: '#EF4444',
      progress: await this.getTrendingArticlesRead(userId),
      totalRequired: 5,
      unlocked: (await this.getTrendingArticlesRead(userId)) >= 5,
      rarity: 'COMMON' as const,
      category: 'ENGAGEMENT' as const,
      points: 100,
      shareable: true
    },
    {
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      description: 'Read articles from 10 different categories',
      icon: 'compass',
      badgeColor: '#8B5CF6',
      progress: await this.getUniqueCategoriesRead(userId),
      totalRequired: 10,
      unlocked: (await this.getUniqueCategoriesRead(userId)) >= 10,
      rarity: 'RARE' as const,
      category: 'READING' as const,
      points: 200,
      shareable: true
    },
    {
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: 'Read 7 days in a row',
      icon: 'calendar',
      badgeColor: '#06B6D4',
      progress: userStats.readingStreak,
      totalRequired: 7,
      unlocked: userStats.readingStreak >= 7,
      rarity: 'EPIC' as const,
      category: 'MILESTONE' as const,
      points: 350,
      shareable: true
    },
    {
      id: 'community_champion',
      title: 'Community Champion',
      description: 'Get 50 likes on your comments',
      icon: 'heart',
      badgeColor: '#EC4899',
      progress: await this.getCommentLikes(userId),
      totalRequired: 50,
      unlocked: (await this.getCommentLikes(userId)) >= 50,
      rarity: 'EPIC' as const,
      category: 'COMMUNITY' as const,
      points: 300,
      shareable: true
    },
    {
      id: 'premium_pioneer',
      title: 'Premium Pioneer',
      description: 'Subscribe to premium for 3 months',
      icon: 'crown',
      badgeColor: '#F59E0B',
      progress: await this.getPremiumMonths(userId),
      totalRequired: 3,
      unlocked: (await this.getPremiumMonths(userId)) >= 3,
      rarity: 'LEGENDARY' as const,
      category: 'PREMIUM' as const,
      points: 500,
      shareable: true
    },
    {
      id: 'article_connoisseur',
      title: 'Article Connoisseur',
      description: 'Save 25 articles to read later',
      icon: 'bookmark',
      badgeColor: '#6366F1',
      progress: userStats.savedArticlesCount,
      totalRequired: 25,
      unlocked: userStats.savedArticlesCount >= 25,
      rarity: 'COMMON' as const,
      category: 'ENGAGEMENT' as const,
      points: 75,
      shareable: true
    },
    {
      id: 'reading_enthusiast',
      title: 'Reading Enthusiast',
      description: 'Like 50 articles',
      icon: 'heart',
      badgeColor: '#EC4899',
      progress: userStats.likedArticlesCount,
      totalRequired: 50,
      unlocked: userStats.likedArticlesCount >= 50,
      rarity: 'COMMON' as const,
      category: 'ENGAGEMENT' as const,
      points: 100,
      shareable: true
    },
    {
      id: 'content_curator',
      title: 'Content Curator',
      description: 'Create reading lists with 20+ articles',
      icon: 'list',
      badgeColor: '#8B5CF6',
      progress: await this.getSavedArticlesCount(userId),
      totalRequired: 20,
      unlocked: (await this.getSavedArticlesCount(userId)) >= 20,
      rarity: 'RARE' as const,
      category: 'ENGAGEMENT' as const,
      points: 200,
      shareable: true
    }
  ];

  // Filter to only include achievements user has started or completed
  const relevantAchievements = achievements.filter(ach => 
    ach.progress > 0 || ach.unlocked
  );

  return {
    achievements: relevantAchievements,
    unlockedCount: relevantAchievements.filter(a => a.unlocked).length,
    totalPoints: relevantAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0)
  };
}

// Add this helper method:
private async getSavedArticlesCount(userId: string): Promise<number> {
  return await this.prisma.articleSave.count({
    where: { userId }
  });
}
private async getTrendingArticlesRead(userId: string): Promise<number> {
  const trendingViews = await this.prisma.articleView.count({
    where: {
      userId,
      article: {
        isTrending: true
      }
    }
  });
  return trendingViews;
}

private async getUniqueCategoriesRead(userId: string): Promise<number> {
  const uniqueCategories = await this.prisma.$queryRaw<{count: number}[]>`
    SELECT COUNT(DISTINCT a."categoryId") as count
    FROM "ArticleView" av
    JOIN "Article" a ON av."articleId" = a.id
    WHERE av."userId" = ${userId}
  `;
  return uniqueCategories[0]?.count || 0;
}

private async getCommentLikes(userId: string): Promise<number> {
  const commentLikes = await this.prisma.commentLike.count({
    where: {
      comment: {
        userId
      }
    }
  });
  return commentLikes;
}

private async getPremiumMonths(userId: string): Promise<number> {
  const subscription = await this.prisma.userSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    select: {
      createdAt: true
    }
  });
  
  if (!subscription) return 0;
  
  const monthsActive = Math.floor(
    (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  return monthsActive;
}

async getAchievementStats(userId: string): Promise<{
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
  recentUnlocks: any[];
}> {
  const achievements = await this.getUserAchievements(userId);
  const userStats = await this.getUserReadingStats(userId);
  
  // Calculate next milestone
  const totalPoints = achievements.totalPoints;
  const milestones = [
    { name: 'Beginner Reader', points: 0 },
    { name: 'Active Reader', points: 500 },
    { name: 'Advanced Reader', points: 1000 },
    { name: 'Master Reader', points: 2000 },
    { name: 'Legendary Scholar', points: 5000 }
  ];
  
  const currentMilestone = milestones
    .reverse()
    .find(m => totalPoints >= m.points) || milestones[0];
    
  const nextMilestone = milestones.find(m => m.points > totalPoints) || milestones[milestones.length - 1];
  
  const progress = nextMilestone 
    ? Math.min(100, (totalPoints / nextMilestone.points) * 100)
    : 100;
  
  // Get top categories
  const topCategories = await this.prisma.$queryRaw<{category: string, count: number}[]>`
    SELECT ac.name as category, COUNT(DISTINCT av."articleId") as count
    FROM "ArticleView" av
    JOIN "Article" a ON av."articleId" = a.id
    JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
    WHERE av."userId" = ${userId}
    GROUP BY ac.name
    ORDER BY count DESC
    LIMIT 4
  `;
  
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
  
  return {
    totalPoints,
    unlockedAchievements: achievements.unlockedCount,
    totalAchievements: achievements.achievements.length,
    nextMilestone: {
      name: nextMilestone.name,
      pointsNeeded: nextMilestone.points - totalPoints,
      progress
    },
    topCategories: topCategories.map((cat, index) => ({
      category: cat.category,
      count: cat.count,
      color: colors[index % colors.length]
    })),
    recentUnlocks: achievements.achievements
      .filter(a => a.unlocked)
      .sort((a, b) => {
        // Sort by most recently unlocked (you'd need to track unlock dates)
        return -1; // Placeholder
      })
      .slice(0, 3)
  };
}

async getRecentProfileActivity(userId: string, limit: number = 20): Promise<any[]> {
  const activities = await this.prisma.$queryRaw<RawActivityItem[]>`
    WITH article_views AS (
      SELECT 
        av.id,
        'VIEW' as type,
        av."articleId",
        av."createdAt" as timestamp,
        NULL::integer as duration,  -- Cast NULL to specific type
        NULL::jsonb as metadata,    -- Cast NULL to jsonb
        'viewed' as action
      FROM "ArticleView" av
      WHERE av."userId" = ${userId}
    ),
    article_likes AS (
      SELECT 
        al.id,
        'LIKE' as type,
        al."articleId",
        al."createdAt" as timestamp,
        NULL::integer as duration,
        jsonb_build_object('likes', 1) as metadata,
        'liked' as action
      FROM "ArticleLike" al
      WHERE al."userId" = ${userId}
    ),
    article_saves AS (
      SELECT 
        asv.id,
        'SAVE' as type,
        asv."articleId",
        asv."createdAt" as timestamp,
        NULL::integer as duration,
        NULL::jsonb as metadata,    -- Cast NULL to jsonb
        'saved' as action
      FROM "ArticleSave" asv
      WHERE asv."userId" = ${userId}
    ),
    article_comments AS (
      SELECT 
        ac.id,
        'COMMENT' as type,
        ac."articleId",
        ac."createdAt" as timestamp,
        NULL::integer as duration,
        jsonb_build_object('comment', ac.content) as metadata,
        'commented on' as action
      FROM "ArticleComment" ac
      WHERE ac."userId" = ${userId}
    )
    
    SELECT * FROM (
      SELECT * FROM article_views
      UNION ALL
      SELECT * FROM article_likes
      UNION ALL
      SELECT * FROM article_saves
      UNION ALL
      SELECT * FROM article_comments
    ) combined
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  // Get article details for each activity
  const enrichedActivities = await Promise.all(
    activities.map(async (activity) => {
      const article = await this.prisma.article.findUnique({
        where: { id: activity.articleId },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          category: {
            select: {
              name: true,
              color: true
            }
          }
        }
      });
      
      return {
        id: activity.id,
        type: activity.type,
        article,
        timestamp: activity.timestamp,
        duration: activity.duration,
        metadata: activity.metadata 
          ? (typeof activity.metadata === 'object' 
              ? activity.metadata 
              : JSON.parse(activity.metadata))
          : null
      };
    })
  );

  return enrichedActivities;
}


async getReadingStats(userId: string): Promise<{
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
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const [todayStats, weekStats, topCategories] = await Promise.all([
    // Today's stats
    this.prisma.$queryRaw<{
      articlesRead: number;
      readingTime: number;
      likesGiven: number;
      commentsMade: number;
    }[]>`
      SELECT 
        COUNT(DISTINCT av."articleId") as "articlesRead",
        COUNT(av.id) * 5 as "readingTime", -- Approximate 5 minutes per view
        COUNT(DISTINCT al.id) as "likesGiven",
        COUNT(DISTINCT ac.id) as "commentsMade"
      FROM "ArticleView" av
      LEFT JOIN "ArticleLike" al ON al."userId" = av."userId" 
        AND al."createdAt" >= ${todayStart}
      LEFT JOIN "ArticleComment" ac ON ac."userId" = av."userId" 
        AND ac."createdAt" >= ${todayStart}
      WHERE av."userId" = ${userId}
        AND av."createdAt" >= ${todayStart}
    `,
    
    // This week's stats
    this.prisma.$queryRaw<{
      streakDays: number;
      totalArticles: number;
      totalTime: number;
    }[]>`
      WITH reading_days AS (
        SELECT 
          DATE("createdAt") as date,
          COUNT(DISTINCT "articleId") as articles
        FROM "ArticleView"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${weekStart}
        GROUP BY DATE("createdAt")
      )
      SELECT 
        COUNT(*) as "streakDays",
        COALESCE(SUM(articles), 0) as "totalArticles",
        COALESCE(SUM(articles) * 5, 0) as "totalTime"
      FROM reading_days
    `,
    
    // Top categories this week
    this.prisma.$queryRaw<{name: string, count: number}[]>`
      SELECT 
        ac.name,
        COUNT(DISTINCT av."articleId") as count
      FROM "ArticleView" av
      JOIN "Article" a ON av."articleId" = a.id
      JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
      WHERE av."userId" = ${userId}
        AND av."createdAt" >= ${weekStart}
      GROUP BY ac.name
      ORDER BY count DESC
      LIMIT 4
    `
  ]);
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  
  return {
    today: todayStats[0] || {
      articlesRead: 0,
      readingTime: 0,
      likesGiven: 0,
      commentsMade: 0
    },
    week: {
      ...(weekStats[0] || { streakDays: 0, totalArticles: 0, totalTime: 0 }),
      progress: Math.min(100, ((weekStats[0]?.totalArticles || 0) / 20) * 100) // 20 articles weekly goal
    },
    topCategories: topCategories.map((cat, index) => ({
      name: cat.name,
      count: cat.count,
      color: colors[index % colors.length]
    }))
  };
}
}