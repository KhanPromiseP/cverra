// import { 
//   Injectable, 
//   Logger, 
//   NotFoundException, 
//   ForbiddenException, 
//   BadRequestException 
// } from '@nestjs/common';
// import { PrismaService } from '../../../../tools/prisma/prisma.service';
// import { 
//   CreateArticleDto, 
//   UpdateArticleDto, 
//   CommentDto 
// } from './dto/article.dto';
// import { 
//   UpdateReadingProfileDto 
// } from './dto/recommendation.dto';  
// import { 
//   ArticleStatus, 
//   ContentAccess, 
//   TransactionSource, 
//   UsageAction, 
//   TranslationStatus 
// } from '@prisma/client';
// import { slugify } from '../auth/utils/slugify';
// import { EngagementService } from './engagement.service';
// import { TranslationService } from './translation.service';
// import { NotificationService } from '../notification/notification.service';




// interface RawActivityItem {
//   id: any; // Could be BigInt
//   type: string;
//   articleId: any; // Could be BigInt
//   timestamp: Date;
//   duration: number | null;
//   metadata: any; // jsonb
//   action: string;
// }

// @Injectable()
// export class ArticleService {
//   private readonly logger = new Logger(ArticleService.name);

//   private userCache = new Map<string, { user: any; timestamp: number }>();
//   private readonly USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

//   constructor(
//     private prisma: PrismaService,
//     private translationService: TranslationService,
//     private engagementService: EngagementService,
//     private notificationService: NotificationService,
//   ) {}

//   async createArticle(userId: string, dto: CreateArticleDto) {
//   const slug = slugify(dto.title);
  
//   // Check if slug exists
//   const existing = await this.prisma.article.findUnique({
//     where: { slug },
//   });

//   if (existing) {
//     throw new BadRequestException('Article with this title already exists');
//   }

//   // Get user to check if they're admin
//   const user = await this.prisma.user.findUnique({
//     where: { id: userId },
//     select: { role: true },
//   });

//   // Validate category exists
//   const category = await this.prisma.articleCategory.findUnique({
//     where: { id: dto.categoryId },
//   });

//   if (!category) {
//     throw new BadRequestException('Category not found');
//   }

  

//   const isPublished = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  
  
//   const article = await this.prisma.article.create({
//     data: {
//       title: dto.title,
//       excerpt: dto.excerpt,
//       content: dto.content,
//       categoryId: dto.categoryId,
//       tags: dto.tags || [],
//       accessType: dto.accessType || ContentAccess.FREE,
//       coinPrice: dto.coinPrice || 0,
//       coverImage: dto.coverImage,
//       metaTitle: dto.metaTitle,
//       metaDescription: dto.metaDescription,
//       slug,
//       authorId: userId,
//       plainText: this.extractPlainText(dto.content),
//       readingTime: this.calculateReadingTime(dto.content),
//       autoTranslate: dto.autoTranslate ?? true,
//       availableLanguages: ['en'],
//       targetLanguages: dto.targetLanguages || ['fr'],
//       status: isPublished ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT,
//       publishedAt: isPublished ? new Date() : null,

//       isFeatured: dto.isFeatured || false,
//       isTrending: dto.isTrending || false,
//       isEditorPick: dto.isEditorPick || false,
//       isPopular: dto.isPopular || false,
//       featuredRanking: dto.featuredRanking || 3,
//       trendingScore: dto.trendingScore || 50,
//       contentType: dto.contentType || 'STANDARD',
//       readingLevel: dto.readingLevel || 'INTERMEDIATE',
//       timeToRead: dto.timeToRead || 5,
//     },
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

//   // Process translations if article is published and auto-translate is enabled
//   if (isPublished && dto.autoTranslate !== false && dto.targetLanguages && dto.targetLanguages.length > 0) {
//     // Use a more reliable method than setTimeout
//     this.queueTranslations(article.id, dto.targetLanguages);
//   }

//   return article;
// }

// private async queueTranslations(articleId: string, targetLanguages: string[]) {
//   // Use process.nextTick for immediate but non-blocking execution
//   process.nextTick(async () => {
//     try {
//       this.logger.log(`Starting translations for article ${articleId}`);
      
//       const results = await this.processTranslationsInBackground(articleId, targetLanguages);
      
//       // Update available languages in the article
//       await this.updateAvailableLanguages(articleId);
      
//       this.logger.log(`Translations completed for article ${articleId}: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
      
//       // If there were failures, schedule retry for failed ones
//       if (results.failed > 0) {
//         const failedLanguages = results.results
//           .filter(r => !r.success && r.action !== 'skipped') 
//           .map(r => r.language);
        
//         if (failedLanguages.length > 0) {
//           this.logger.warn(`Scheduling retry for failed translations: ${failedLanguages.join(', ')}`);
//           // Retry after 5 minutes
//           setTimeout(() => {
//             this.retryFailedTranslationsForArticle(articleId, failedLanguages);
//           }, 5 * 60 * 1000);
//         }
//       }
//     } catch (error) {
//       this.logger.error(`Translation queue failed for article ${articleId}:`, error);
//     }
//   });
// }

// // NEW: Update available languages after translations
// private async updateAvailableLanguages(articleId: string) {
//   try {
//     const translations = await this.prisma.articleTranslation.findMany({
//       where: {
//         articleId,
//         status: TranslationStatus.COMPLETED,
//       },
//       select: {
//         language: true,
//       },
//     });

//     const availableLanguages = ['en', ...translations.map(t => t.language)];
    
//     await this.prisma.article.update({
//       where: { id: articleId },
//       data: {
//         availableLanguages: Array.from(new Set(availableLanguages)), // Remove duplicates
//       },
//     });
    
//     this.logger.log(`Updated available languages for article ${articleId}: ${availableLanguages.join(', ')}`);
//   } catch (error) {
//     this.logger.error(`Failed to update available languages for article ${articleId}:`, error);
//   }
// }

// // NEW: Retry failed translations
// private async retryFailedTranslationsForArticle(articleId: string, languages: string[]) {
//   this.logger.log(`Retrying failed translations for article ${articleId}: ${languages.join(', ')}`);
  
//   const results = await this.processTranslationsInBackground(articleId, languages);
  
//   if (results.successful > 0) {
//     await this.updateAvailableLanguages(articleId);
//   }
  
//   return results;
// }

// // Update the updateArticle method to be more robust:

// async updateArticle(slug: string, userId: string, dto: UpdateArticleDto) {
//   console.log('updateArticle called:', { slug, userId, dto: JSON.stringify(dto) });
  
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
//   let contentChanged = false;
//   let statusChanged = false;
//   let titleChanged = false;

//   // Update only provided fields
//   if (dto.title !== undefined && dto.title !== article.title) {
//     updateData.title = dto.title;
//     updateData.slug = slugify(dto.title);
//     titleChanged = true;
//   }
  
//   if (dto.excerpt !== undefined && dto.excerpt !== article.excerpt) {
//     updateData.excerpt = dto.excerpt;
//   }
  
//   if (dto.content !== undefined) {
//     // Check if content actually changed
//     const currentContentHash = this.hashContent(article.content);
//     const newContentHash = this.hashContent(dto.content);
    
//     if (currentContentHash !== newContentHash) {
//       updateData.content = dto.content;
//       updateData.plainText = this.extractPlainText(dto.content);
//       updateData.readingTime = this.calculateReadingTime(dto.content);
//       contentChanged = true;
//     }
//   }
  
//   if (dto.categoryId !== undefined && dto.categoryId !== article.categoryId) {
//     updateData.categoryId = dto.categoryId;
//   }
  
//   if (dto.tags !== undefined) {
//     updateData.tags = dto.tags;
//   }
  
//   if (dto.accessType !== undefined && dto.accessType !== article.accessType) {
//     updateData.accessType = dto.accessType;
//   }
  
//   if (dto.coinPrice !== undefined && dto.coinPrice !== article.coinPrice) {
//     updateData.coinPrice = dto.coinPrice;
//   }
  
//   if (dto.coverImage !== undefined && dto.coverImage !== article.coverImage) {
//     updateData.coverImage = dto.coverImage;
//   }
  
//   if (dto.metaTitle !== undefined && dto.metaTitle !== article.metaTitle) {
//     updateData.metaTitle = dto.metaTitle;
//   }
  
//   if (dto.metaDescription !== undefined && dto.metaDescription !== article.metaDescription) {
//     updateData.metaDescription = dto.metaDescription;
//   }
  
//   if (dto.autoTranslate !== undefined && dto.autoTranslate !== article.autoTranslate) {
//     updateData.autoTranslate = dto.autoTranslate;
//   }

  
  
//   // Handle target languages
//   let targetLanguagesChanged = false;
//   if (dto.targetLanguages !== undefined) {
//     // Normalize and validate target languages
//     const newTargetLanguages = Array.isArray(dto.targetLanguages) 
//       ? dto.targetLanguages.filter(lang => lang && lang.trim() !== '' && lang !== 'en')
//       : [];
    
//     const currentTargetLanguages = Array.isArray(article.targetLanguages)
//       ? article.targetLanguages
//       : [];
    
//     // Sort and compare
//     const sortedNew = [...new Set(newTargetLanguages)].sort();
//     const sortedCurrent = [...new Set(currentTargetLanguages)].sort();
    
//     targetLanguagesChanged = JSON.stringify(sortedNew) !== JSON.stringify(sortedCurrent);
    
//     if (targetLanguagesChanged) {
//       updateData.targetLanguages = sortedNew;
//     }
//   }
  
//   if (dto.status !== undefined && dto.status !== article.status) {
//     updateData.status = dto.status;
//     statusChanged = true;
    
//     // Set publishedAt if status changes to PUBLISHED
//     if (dto.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
//       updateData.publishedAt = new Date();
//     }
//   }

//   // Only update if there are changes
//   if (Object.keys(updateData).length === 0) {
//     console.log('No changes detected, returning original article');
//     return article; // No changes
//   }

//   console.log('Updating article with data:', updateData);
  
//   const updated = await this.prisma.article.update({
//     where: { slug: article.slug },
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

//   console.log('Article updated successfully:', { 
//     id: updated.id, 
//     title: updated.title,
//     contentChanged, 
//     titleChanged, 
//     statusChanged, 
//     targetLanguagesChanged 
//   });

//   // ========== SMART TRANSLATION HANDLING ==========
//   await this.handleSmartTranslations(
//     updated, 
//     article, 
//     contentChanged, 
//     titleChanged, 
//     statusChanged, 
//     targetLanguagesChanged
//   );

//   return updated;
// }

// // NEW: Smart translation handling method
// private async handleSmartTranslations(
//   updatedArticle: any,
//   originalArticle: any,
//   contentChanged: boolean,
//   titleChanged: boolean,
//   statusChanged: boolean,
//   targetLanguagesChanged: boolean
// ) {
//   console.log('Handling smart translations...');
  
//   // Conditions for translation triggering
//   const shouldCheckTranslations = 
//     updatedArticle.status === ArticleStatus.PUBLISHED &&
//     updatedArticle.autoTranslate &&
//     updatedArticle.targetLanguages &&
//     updatedArticle.targetLanguages.length > 0 &&
//     (contentChanged || titleChanged || statusChanged || targetLanguagesChanged);
  
//   if (!shouldCheckTranslations) {
//     console.log('No need to check translations');
//     return;
//   }
  
//   try {
//     console.log('Checking existing translations...');
    
//     // Get existing completed translations
//     const existingTranslations = await this.prisma.articleTranslation.findMany({
//       where: { 
//         articleId: updatedArticle.id,
//         status: TranslationStatus.COMPLETED
//       },
//       select: { 
//         language: true, 
//         updatedAt: true,
//         contentHash: true
//       },
//     });
    
//     const existingCompletedLanguages = existingTranslations.map(t => t.language);
//     const currentContentHash = this.hashContent(updatedArticle.content);
    
//     console.log(' Translation status:', {
//       targetLanguages: updatedArticle.targetLanguages,
//       existingCompletedLanguages,
//       currentContentHash
//     });
    
//     // Determine which languages need translation
//     const languagesToTranslate: string[] = [];
//     const languagesToUpdate: string[] = [];
    
//     for (const targetLang of updatedArticle.targetLanguages) {
//       if (targetLang === 'en') continue; // Skip English
      
//       const existingTranslation = existingTranslations.find(t => t.language === targetLang);
      
//       if (!existingTranslation) {
//         // No translation exists - need to create one
//         languagesToTranslate.push(targetLang);
//         console.log(` New translation needed for: ${targetLang}`);
//       } else if (contentChanged || titleChanged) {
//         // Content or title changed - check if translation is stale
//         const translationAge = Date.now() - new Date(existingTranslation.updatedAt).getTime();
//         const isStale = translationAge > 24 * 60 * 60 * 1000; // 24 hours
        
//         if (isStale) {
//           languagesToUpdate.push(targetLang);
//           console.log(`Translation is stale for: ${targetLang} (${Math.round(translationAge / 3600000)} hours old)`);
//         }
//       }
//     }
    
//     // Combine all languages that need attention
//     const allLanguagesToProcess = [...languagesToTranslate, ...languagesToUpdate];
    
//     if (allLanguagesToProcess.length > 0) {
//       console.log(` Triggering translations for: ${allLanguagesToProcess.join(', ')}`);
      
//       // Differentiate between new and update
//       const newTranslations = languagesToTranslate.filter(lang => !languagesToUpdate.includes(lang));
//       const updatedTranslations = languagesToUpdate;
      
//       if (newTranslations.length > 0) {
//         console.log(` New translations: ${newTranslations.join(', ')}`);
//       }
      
//       if (updatedTranslations.length > 0) {
//         console.log(` Updating translations: ${updatedTranslations.join(', ')}`);
//       }
      
//       // Process translations in the background
//       this.processTranslationsInBackground(updatedArticle.id, allLanguagesToProcess)
//         .then(result => {
//           console.log(` Translations completed for article "${updatedArticle.title}":`, {
//             successful: result.successful,
//             failed: result.failed,
//             skipped: result.skipped
//           });
          
//           // Update available languages after successful translations
//           if (result.successful > 0) {
//             this.updateAvailableLanguages(updatedArticle.id);
//           }
//         })
//         .catch(error => {
//           console.error(` Background translation failed:`, error);
//         });
      
//       // Return immediate response about triggered translations
//       return {
//         translationsTriggered: true,
//         languages: allLanguagesToProcess,
//         new: newTranslations,
//         updates: updatedTranslations,
//         message: `Translations triggered for ${allLanguagesToProcess.length} language(s)`
//       };
//     } else {
//       console.log(' All translations are up to date');
//       return {
//         translationsTriggered: false,
//         message: 'All translations are up to date'
//       };
//     }
    
//   } catch (error) {
//     console.error(' Error in smart translation handling:', error);
//     // Don't throw - just log the error
//   }
// }

// // Update the processTranslationsInBackground to handle updates better
// private async processTranslationsInBackground(
//   articleId: string, 
//   targetLanguages: string[],
//   forceUpdate: boolean = false
// ): Promise<{
//   successful: number;
//   failed: number;
//   skipped: number;
//   results: Array<{
//     language: string;
//     success: boolean;
//     action: 'created' | 'updated' | 'skipped';
//     reason?: string;
//     translationId?: string;
//     timestamp?: string;
//     error?: string;
//   }>;
// }> {
//   const results: Array<{
//     language: string;
//     success: boolean;
//     action: 'created' | 'updated' | 'skipped';
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
  
//   // Get article content for translation
//   const article = await this.prisma.article.findUnique({
//     where: { id: articleId },
//     select: {
//       title: true,
//       content: true,
//       excerpt: true,
//       metaTitle: true,
//       metaDescription: true,
//       keywords: true
//     },
//   });
  
//   if (!article) {
//     throw new NotFoundException('Article not found');
//   }
  
//   // Process batches
//   for (const [batchIndex, batch] of batches.entries()) {
//     console.log(`Processing translation batch ${batchIndex + 1}/${batches.length}`);
    
//     const batchResults = await Promise.allSettled(
//       batch.map(async (language) => {
//         try {
//           if (language === 'en') {
//             return { 
//               language, 
//               success: true, 
//               action: 'skipped' as const, 
//               reason: 'Original language' 
//             };
//           }

//           // Check existing translation
//           const existing = await this.prisma.articleTranslation.findUnique({
//             where: { articleId_language: { articleId, language } },
//             select: { 
//               id: true, 
//               status: true, 
//               updatedAt: true,
//               contentHash: true 
//             },
//           });

//           const currentContentHash = this.hashContent(article.content);
//           const translationExists = existing?.status === TranslationStatus.COMPLETED;
//           const isContentDifferent = translationExists && existing.contentHash !== currentContentHash;
          
//           // Skip if translation exists and is recent (unless force update or content changed)
//           if (translationExists && !forceUpdate && !isContentDifferent) {
//             const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
//             if (existing.updatedAt > oneHourAgo) {
//               return { 
//                 language, 
//                 success: true, 
//                 action: 'skipped' as const,
//                 reason: 'Recent translation exists',
//                 translationId: existing.id 
//               };
//             }
//           }

//           // Create or update translation
//           const translation = await this.translationService.translateArticle(
//             articleId, 
//             language, 
//             { 
//               force: forceUpdate || isContentDifferent, 
//               aiModel: 'llama-3.3-70b-versatile', 
//               useCache: true 
//             }
//           );
          
//           return { 
//             language, 
//             success: true, 
//             action: existing ? 'updated' as const : 'created' as const,
//             translationId: translation.id,
//             timestamp: new Date().toISOString(),
//           };
//         } catch (error) {
//           console.error(`Translation failed for ${language}:`, error);
//           return { 
//             language, 
//             success: false, 
//             action: 'skipped' as const,
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
//           action: 'skipped',
//           error: result.reason?.message || 'Unknown error',
//           timestamp: new Date().toISOString(),
//         });
//       }
//     });

//     if (batchIndex < batches.length - 1) {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
  
//   const successful = results.filter(r => r.success && r.action !== 'skipped').length;
//   const failed = results.filter(r => !r.success).length;
//   const skipped = results.filter(r => r.action === 'skipped').length;
  
//   return { successful, failed, skipped, results };
// }

// private hashContent(content: any): string {
//   if (!content) return 'empty';
  
//   try {
//     if (typeof content === 'string') {
//       // Create a simple hash
//       let hash = 0;
//       for (let i = 0; i < content.length; i++) {
//         const char = content.charCodeAt(i);
//         hash = ((hash << 5) - hash) + char;
//         hash = hash & hash; // Convert to 32bit integer
//       }
//       return hash.toString(16);
//     }
    
//     if (typeof content === 'object') {
//       const jsonString = JSON.stringify(content);
//       // Create a simple hash
//       let hash = 0;
//       for (let i = 0; i < jsonString.length; i++) {
//         const char = jsonString.charCodeAt(i);
//         hash = ((hash << 5) - hash) + char;
//         hash = hash & hash; // Convert to 32bit integer
//       }
//       return hash.toString(16);
//     }
    
//     return String(content);
//   } catch (error) {
//     console.warn('Failed to hash content:', error);
//     return 'error';
//   }
// }
 
// // private async processTranslationsInBackground(
// //   articleId: string, 
// //   targetLanguages: string[]
// // ): Promise<{
// //   successful: number;
// //   failed: number;
// //   skipped: number;
// //   results: Array<{
// //     language: string;
// //     success: boolean;
// //     skipped?: boolean;
// //     reason?: string;
// //     translationId?: string;
// //     timestamp?: string;
// //     error?: string;
// //   }>;
// // }> {
// //   const results: Array<{
// //     language: string;
// //     success: boolean;
// //     skipped?: boolean;
// //     reason?: string;
// //     translationId?: string;
// //     timestamp?: string;
// //     error?: string;
// //   }> = [];
  
// //   const batchSize = 2;
// //   const batches: string[][] = [];
  
// //   // Create batches
// //   for (let i = 0; i < targetLanguages.length; i += batchSize) {
// //     batches.push(targetLanguages.slice(i, i + batchSize));
// //   }
  
// //   // Process batches
// //   for (const [batchIndex, batch] of batches.entries()) {
// //     this.logger.log(`Processing translation batch ${batchIndex + 1}/${batches.length}`);
    
// //     const batchResults = await Promise.allSettled(
// //       batch.map(async (language) => {
// //         try {
// //           if (language === 'en') {
// //             return { language, success: true, skipped: true, reason: 'Original language' };
// //           }

// //           const existing = await this.prisma.articleTranslation.findUnique({
// //             where: { articleId_language: { articleId, language } },
// //             select: { id: true, status: true, updatedAt: true },
// //           });

// //           if (existing?.status === TranslationStatus.COMPLETED) {
// //             const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
// //             if (existing.updatedAt > oneHourAgo) {
// //               return { 
// //                 language, 
// //                 success: true, 
// //                 skipped: true, 
// //                 reason: 'Recent translation exists',
// //                 translationId: existing.id 
// //               };
// //             }
// //           }

// //           const translation = await this.translationService.translateArticle(
// //             articleId, 
// //             language, 
// //             { force: false, aiModel: 'llama-3.3-70b-versatile', useCache: true }
// //           );
          
// //           return { 
// //             language, 
// //             success: true, 
// //             translationId: translation.id,
// //             timestamp: new Date().toISOString(),
// //           };
// //         } catch (error) {
// //           this.logger.error(`Translation failed for ${language}:`, error);
// //           return { 
// //             language, 
// //             success: false, 
// //             error: error instanceof Error ? error.message : 'Unknown error',
// //             timestamp: new Date().toISOString(),
// //           };
// //         }
// //       })
// //     );

// //     batchResults.forEach((result, index) => {
// //       if (result.status === 'fulfilled') {
// //         results.push(result.value);
// //       } else {
// //         results.push({
// //           language: batch[index],
// //           success: false,
// //           error: result.reason?.message || 'Unknown error',
// //           timestamp: new Date().toISOString(),
// //         });
// //       }
// //     });

// //     if (batchIndex < batches.length - 1) {
// //       await new Promise(resolve => setTimeout(resolve, 1000));
// //     }
// //   }
  
// //   const successful = results.filter(r => r.success && !r.skipped).length;
// //   const failed = results.filter(r => !r.success).length;
// //   const skipped = results.filter(r => r.skipped).length;
  
// //   return { successful, failed, skipped, results };
// // }



// // NEW: Add this method to manually trigger translations
// async triggerManualTranslations(articleId: string, languages: string[], force: boolean = false) {
//   const article = await this.prisma.article.findUnique({
//     where: { id: articleId },
//     select: {
//       id: true,
//       title: true,
//       status: true,
//       autoTranslate: true,
//     },
//   });

//   if (!article) {
//     throw new NotFoundException('Article not found');
//   }

//   if (article.status !== ArticleStatus.PUBLISHED) {
//     throw new BadRequestException('Article must be published to translate');
//   }

//   if (!article.autoTranslate) {
//     throw new BadRequestException('Auto-translate is disabled for this article');
//   }

//   this.logger.log(` Manually triggering translations for article "${article.title}": ${languages.join(', ')}`);

//   const results = await this.processTranslationsInBackground(articleId, languages);
  
//   // Update available languages
//   await this.updateAvailableLanguages(articleId);

//   return {
//     success: true,
//     message: `Translations triggered for ${languages.length} language(s)`,
//     results: {
//       successful: results.successful,
//       failed: results.failed,
//       skipped: results.skipped,
//       total: languages.length,
//     },
//     details: results.results,
//   };
// }

// private async getCachedUser(userId: string) {
//   const cacheKey = `article-service:user:${userId}`;
//   const cached = this.userCache.get(cacheKey);
  
//   if (cached && (Date.now() - cached.timestamp) < this.USER_CACHE_TTL) {
//     return cached.user;
//   }
  
//   // Fetch only essential user info
//   const user = await this.prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       role: true,
//       name: true,
//       email: true,
//       username: true,
//       picture: true,
//     },
//   });
  
//   if (user) {
//     this.userCache.set(cacheKey, { user, timestamp: Date.now() });
//   }
  
//   return user;
// }

//  async getArticle(slug: string, userId?: string, language?: string) {
//   console.log('🔄 Service getArticle called:', { slug, language, userId });
  
//   // 1. Get article with author in one query
//   const article = await this.prisma.article.findUnique({
//     where: { slug },
//     include: {
//       category: true,
//       author: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//           email: true,
//         },
//       },
//       ...(language && language !== 'en' ? {
//         translations: {
//           where: { 
//             language, 
//             status: 'COMPLETED' 
//           },
//           take: 1,
//         },
//       } : {}),
//     },
//   });

//   if (!article) {
//     throw new NotFoundException('Article not found');
//   }

//   // 2. Get user info ONCE (if userId exists)
//   let user = null;
//   let userAccessInfo = null;
  
//   if (userId) {
//     // Get user from cache/database ONCE
//     user = await this.getCachedUser(userId);
    
//     if (user) {
//       userAccessInfo = {
//         user,
//         hasPremiumAccess: false,
//         hasSubscription: false,
//         isAuthor: article.authorId === user.id,
//       };
      
//       // Check premium access (but don't fetch user again)
//       if (article.accessType === ContentAccess.PREMIUM) {
//         // Get access info WITHOUT additional user queries
//         const [premiumAccess, subscription] = await Promise.all([
//           this.prisma.premiumAccess.findFirst({
//             where: {
//               userId,
//               articleId: article.id,
//               accessUntil: { gt: new Date() }
//             },
//             select: { id: true },
//           }),
//           this.prisma.userSubscription.findFirst({
//             where: {
//               userId,
//               status: 'ACTIVE',
//               currentPeriodEnd: { gt: new Date() },
//             },
//             select: { id: true },
//           }),
//         ]);
        
//         userAccessInfo.hasPremiumAccess = !!premiumAccess;
//         userAccessInfo.hasSubscription = !!subscription;
//       }
//     }
    
//     // Check unpublished access
//     if (article.status !== ArticleStatus.PUBLISHED) {
//       const canAccess = user && (
//         article.authorId === user.id ||
//         user.role === 'ADMIN' ||
//         user.role === 'SUPER_ADMIN'
//       );

//       if (!canAccess) {
//         throw new ForbiddenException('You do not have access to this article');
//       }
//     }
//   } else if (article.status !== ArticleStatus.PUBLISHED) {
//     throw new ForbiddenException('This article is not published');
//   }

//   // 3. Check premium access using cached info
//   if (article.accessType === ContentAccess.PREMIUM && userId) {
//     const hasAccess = userAccessInfo?.hasPremiumAccess || 
//                       userAccessInfo?.isAuthor || 
//                       userAccessInfo?.hasSubscription;

//     if (!hasAccess) {
//       console.log('User does not have access, returning preview');
//       return this.getPreviewVersion(article);
//     }
//   }

//   // 4. Process article URLs (keep your existing code)
//   if (article.coverImage) {
//     if (article.coverImage.startsWith('http://') || article.coverImage.startsWith('https://')) {
//       // Do nothing
//     } else if (article.coverImage.startsWith('/')) {
//       article.coverImage = `http://localhost:3000${article.coverImage}`;
//     } else {
//       article.coverImage = `http://localhost:3000/uploads/articles/${article.coverImage}`;
//     }
//   }

//   // 5. Track engagement ASYNCHRONOUSLY (don't await)
//   if (userId && !this.isPreviewVersion(article)) {
//     // Fire and forget - don't block article loading
//     this.engagementService.trackView(userId, article.id, language || 'en')
//       .catch(error => {
//         // Silently log error without breaking
//         this.logger.debug(`Failed to track view: ${error.message}`);
//       });
//   }

//   // 6. Transform URLs (keep your existing code)
//   const transformArticleUrls = (article: any) => {
//     if (!article) return article;
    
//     const serverUrl = 'http://localhost:3000';
    
//     const toAbsoluteUrl = (url: string): string => {
//       if (!url || typeof url !== 'string') return url;
      
//       if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
//         return url;
//       }
      
//       if (url.startsWith('/')) {
//         return `${serverUrl}${url}`;
//       }
      
//       return `${serverUrl}/${url}`;
//     };
    
//     if (article.coverImage) {
//       article.coverImage = toAbsoluteUrl(article.coverImage);
//     }
    
//     if (article.author?.picture) {
//       article.author.picture = toAbsoluteUrl(article.author.picture);
//     }
    
//     if (typeof article.content === 'string') {
//       article.content = article.content.replace(
//         /src="(\/uploads\/[^"]+)"/g, 
//         `src="${serverUrl}$1"`
//       );
//       article.content = article.content.replace(
//         /src=(\/uploads\/[^"'\s>]+)/g, 
//         `src="${serverUrl}$1"`
//       );
//     }
    
//     if (typeof article.content === 'object' && article.content.type === 'doc') {
//       const fixImagesInContent = (node: any) => {
//         if (node.type === 'image' && node.attrs?.src) {
//           node.attrs.src = toAbsoluteUrl(node.attrs.src);
//         }
        
//         if (node.content && Array.isArray(node.content)) {
//           node.content.forEach(fixImagesInContent);
//         }
//       };
      
//       if (article.content.content) {
//         article.content.content.forEach(fixImagesInContent);
//       }
//     }
    
//     return article;
//   };

//   const transformedArticle = transformArticleUrls(article);

//   // 7. Get available languages
//   const availableTranslations = await this.prisma.articleTranslation.findMany({
//     where: {
//       articleId: article.id,
//       status: TranslationStatus.COMPLETED,
//     },
//     select: {
//       language: true,
//       qualityScore: true,
//       confidence: true,
//       needsReview: true,
//     },
//   });

//   // Always include English (original)
//   const availableLanguages = ['en', ...availableTranslations.map(t => t.language)];
  
//   // 8. Apply translation if requested and exists
//   if (language && language !== 'en' && transformedArticle.translations?.[0]) {
//     const translation = transformedArticle.translations[0];
    
//     // Transform URLs in translation content
//     const transformTranslationUrls = (translation: any) => {
//       const serverUrl = 'http://localhost:3000';
      
//       if (translation.coverImage) {
//         translation.coverImage = translation.coverImage.startsWith('http') 
//           ? translation.coverImage 
//           : `${serverUrl}${translation.coverImage}`;
//       }
      
//       if (translation.content) {
//         if (typeof translation.content === 'string') {
//           translation.content = translation.content.replace(
//             /src="(\/uploads\/[^"]+)"/g, 
//             `src="${serverUrl}$1"`
//           );
//         } else if (typeof translation.content === 'object' && translation.content.type === 'doc') {
//           const fixImagesInContent = (node: any) => {
//             if (node.type === 'image' && node.attrs?.src) {
//               node.attrs.src = node.attrs.src.startsWith('http') 
//                 ? node.attrs.src 
//                 : `${serverUrl}${node.attrs.src.startsWith('/') ? '' : '/'}${node.attrs.src}`;
//             }
            
//             if (node.content && Array.isArray(node.content)) {
//               node.content.forEach(fixImagesInContent);
//             }
//           };
          
//           if (translation.content.content) {
//             translation.content.content.forEach(fixImagesInContent);
//           }
//         }
//       }
      
//       return translation;
//     };
    
//     const transformedTranslation = transformTranslationUrls(translation);
    
//     // Create merged article with translation
//     const translatedArticle = {
//       ...transformedArticle,
//       title: transformedTranslation.title || transformedArticle.title,
//       excerpt: transformedTranslation.excerpt || transformedArticle.excerpt,
//       content: transformedTranslation.content || transformedArticle.content,
//       plainText: transformedTranslation.plainText || transformedArticle.plainText,
//       metaTitle: transformedTranslation.metaTitle || transformedArticle.metaTitle,
//       metaDescription: transformedTranslation.metaDescription || transformedArticle.metaDescription,
//       keywords: transformedTranslation.keywords?.length > 0 ? transformedTranslation.keywords : transformedArticle.keywords,
//       isTranslated: true,
//       translationLanguage: language,
//       translationQuality: transformedTranslation.qualityScore,
//       translationConfidence: transformedTranslation.confidence,
//       translationNeedsReview: transformedTranslation.needsReview,
//       translations: undefined,
//     };
    
//     return {
//       ...translatedArticle,
//       availableLanguages: Array.from(new Set(availableLanguages)),
//     };
//   }

//   // Return the transformed article
//   return {
//     ...transformedArticle,
//     availableLanguages: Array.from(new Set(availableLanguages)),
//   };
// }
//   // async updateArticle(slug: string, userId: string, dto: UpdateArticleDto) {
//   //   const article = await this.prisma.article.findUnique({
//   //     where: { slug },
//   //   });

//   //   if (!article) {
//   //     throw new NotFoundException('Article not found');
//   //   }

//   //   // Check ownership or admin role
//   //   const user = await this.prisma.user.findUnique({
//   //     where: { id: userId },
//   //     select: { role: true, id: true },
//   //   });

//   //   if (!user) {
//   //     throw new ForbiddenException('User not found');
//   //   }

//   //   const canEdit = article.authorId === userId || 
//   //                   user.role === 'ADMIN' || 
//   //                   user.role === 'SUPER_ADMIN';

//   //   if (!canEdit) {
//   //     throw new ForbiddenException('Not authorized to update this article');
//   //   }

//   //   const updateData: any = {};

//   //   // Update only provided fields
//   //   if (dto.title !== undefined) {
//   //     updateData.title = dto.title;
//   //     updateData.slug = slugify(dto.title);
//   //   }
//   //   if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
//   //   if (dto.content !== undefined) {
//   //     updateData.content = dto.content;
//   //     updateData.plainText = this.extractPlainText(dto.content);
//   //     updateData.readingTime = this.calculateReadingTime(dto.content);
//   //   }
//   //   if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
//   //   if (dto.tags !== undefined) updateData.tags = dto.tags;
//   //   if (dto.accessType !== undefined) updateData.accessType = dto.accessType;
//   //   if (dto.coinPrice !== undefined) updateData.coinPrice = dto.coinPrice;
//   //   if (dto.coverImage !== undefined) updateData.coverImage = dto.coverImage;
//   //   if (dto.metaTitle !== undefined) updateData.metaTitle = dto.metaTitle;
//   //   if (dto.metaDescription !== undefined) updateData.metaDescription = dto.metaDescription;
//   //   if (dto.autoTranslate !== undefined) updateData.autoTranslate = dto.autoTranslate;
//   //   if (dto.targetLanguages !== undefined) updateData.targetLanguages = dto.targetLanguages;
//   //   if (dto.status !== undefined) {
//   //     updateData.status = dto.status;
//   //     // Set publishedAt if status changes to PUBLISHED
//   //     if (dto.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
//   //       updateData.publishedAt = new Date();
//   //     }
//   //   }

//   //   const updated = await this.prisma.article.update({
//   //     where: { slug: article.slug }, // Use original slug in case title changed
//   //     data: updateData,
//   //     include: {
//   //       category: true,
//   //       author: {
//   //         select: {
//   //           id: true,
//   //           name: true,
//   //           username: true,
//   //           picture: true,
//   //         },
//   //       },
//   //     },
//   //   });

//   //   // Check if we need to trigger translations
//   //   // Trigger if: 
//   //   // 1. Article is now published (or was already published)
//   //   // 2. Auto-translate is enabled
//   //   // 3. There are target languages
//   //   // 4. Content was changed OR status changed to PUBLISHED
//   //   const shouldTriggerTranslations = 
//   //     (updated.status === ArticleStatus.PUBLISHED) &&
//   //     updated.autoTranslate &&
//   //     updated.targetLanguages &&
//   //     updated.targetLanguages.length > 0 &&
//   //     (dto.content !== undefined || dto.status === ArticleStatus.PUBLISHED);

//   //   if (shouldTriggerTranslations) {
//   //     const existingTranslations = await this.prisma.articleTranslation.findMany({
//   //       where: { articleId: updated.id },
//   //       select: { language: true },
//   //     });

//   //     const existingLanguages = existingTranslations.map(t => t.language);
//   //     const languagesToTranslate = updated.targetLanguages.filter(lang => 
//   //       lang !== 'en' && !existingLanguages.includes(lang)
//   //     );

//   //     if (languagesToTranslate.length > 0) {
//   //       this.processTranslationsInBackground(updated.id, languagesToTranslate)
//   //         .then(result => {
//   //           this.logger.log(
//   //             `Updated translations for article "${updated.title}": ` +
//   //             `${result.successful} successful, ${result.failed} failed`
//   //           );
//   //         })
//   //         .catch(error => {
//   //           this.logger.error(`Background translation update failed for article ${updated.id}:`, error);
//   //         });
//   //     }
//   //   }

//   //   return updated;
//   // }
// // Update the existing listArticles method in article.service.ts
// async listArticles(options: {
//   page?: number;
//   limit?: number;
//   category?: string | string[];
//   tag?: string;
//   status?: ArticleStatus;
//   accessType?: ContentAccess | 'all';
//   featured?: boolean;
//   trending?: boolean;
//   language?: string; // Add this - UI language
//   authorId?: string;
//   search?: string;
//   sort?: string;
//   readingTime?: 'short' | 'medium' | 'long' | 'any';
// }) {
//   const page = options.page || 1;
//   const limit = Math.min(options.limit || 20, 100);
//   const skip = (page - 1) * limit;
//   const uiLanguage = options.language || 'en'; // Default to English

//   const where: any = {};

//   // Default to published articles unless specified
//   if (options.status !== undefined) {
//     where.status = options.status;
//   } else {
//     where.status = ArticleStatus.PUBLISHED;
//   }


//   // Handle category (could be string or array)
//   if (options.category) {
//     if (Array.isArray(options.category)) {
//       where.category = { slug: { in: options.category } };
//     } else {
//       where.category = { slug: options.category };
//     }
//   }

//   // Handle access type
//   if (options.accessType && options.accessType !== 'all') {
//     where.accessType = options.accessType as ContentAccess;
//   }

//   // Handle reading time
//   if (options.readingTime && options.readingTime !== 'any') {
//     const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
//     if (readingTimeCondition) {
//       where.readingTime = readingTimeCondition;
//     }
//   }

//   // Other existing filters...
//   if (options.tag) {
//     where.tags = { has: options.tag };
//   }

//   if (options.featured !== undefined) {
//     where.isFeatured = options.featured;
//   }

//   if (options.trending !== undefined) {
//     where.isTrending = options.trending;
//   }

//   if (options.authorId) {
//     where.authorId = options.authorId;
//   }

//   if (options.search) {
//     where.OR = [
//       { title: { contains: options.search, mode: 'insensitive' } },
//       { excerpt: { contains: options.search, mode: 'insensitive' } },
//       { plainText: { contains: options.search, mode: 'insensitive' } },
//     ];
//   }

//   // Get sort order
//   const orderBy = this.getSortOrder(options.sort || 'recent');

//   const [articles, total] = await Promise.all([
//     this.prisma.article.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy,
//       include: {
//         category: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//             icon: true,
//             color: true,
//           },
//         },
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//         // ADD THIS: Include translations for the UI language
//         translations: {
//           where: { 
//             language: uiLanguage,
//             status: TranslationStatus.COMPLETED 
//           },
//           select: {
//             title: true,
//             excerpt: true,
//           },
//         },
//       },
//     }),
//     this.prisma.article.count({ where }),
//   ]);

//   // Get counts for each article
//   const articlesWithCountsAndTranslations = await Promise.all(
//     articles.map(async (article) => {
//       const [commentCount, likeCount, viewCount] = await Promise.all([
//         this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
//         this.prisma.articleLike.count({ where: { articleId: article.id } }),
//         this.prisma.articleView.count({ where: { articleId: article.id } }),
//       ]);

//       // Get translation for this article
//       const translation = article.translations?.[0];
      
//       return {
//         ...article,
//         // Use translated title/excerpt if available, otherwise use original
//         title: translation?.title || article.title,
//         excerpt: translation?.excerpt || article.excerpt,
//         commentCount,
//         likeCount,
//         viewCount,
//         // Add translation info
//         hasTranslation: !!translation,
//         displayLanguage: uiLanguage,
//         // Remove translations array from final response
//         translations: undefined,
//       };
//     })
//   );

//   return {
//     articles: articlesWithCountsAndTranslations,
//     total,
//     page,
//     limit,
//     totalPages: Math.ceil(total / limit),
//     hasMore: total > skip + limit,
//   };
// }

//   async getDashboardStats(timeRange: string = '7days') {
//   const now = new Date();
//   const startDate = new Date();
  
//   // Calculate start date based on timeRange
//   switch (timeRange) {
//     case '7days':
//       startDate.setDate(now.getDate() - 7);
//       break;
//     case '30days':
//       startDate.setDate(now.getDate() - 30);
//       break;
//     case '90days':
//       startDate.setDate(now.getDate() - 90);
//       break;
//     case 'year':
//       startDate.setFullYear(now.getFullYear() - 1);
//       break;
//     default:
//       startDate.setDate(now.getDate() - 7);
//   }

//   try {
//     // Execute all queries in parallel
//     const [
//       totalArticles,
//       publishedArticles,
//       draftArticles,
//       premiumArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       monthlyGrowth,
//       topCategories,
//       recentActivity,
//     ] = await Promise.all([
//       // Total articles
//       this.prisma.article.count(),
      
//       // Published articles
//       this.prisma.article.count({
//         where: { status: ArticleStatus.PUBLISHED },
//       }),
      
//       // Draft articles
//       this.prisma.article.count({
//         where: { status: ArticleStatus.DRAFT },
//       }),
      
//       // Premium articles
//       this.prisma.article.count({
//         where: { 
//           accessType: ContentAccess.PREMIUM,
//           status: ArticleStatus.PUBLISHED,
//         },
//       }),
      
//       // Total views
//       this.prisma.articleView.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Total likes
//       this.prisma.articleLike.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Total comments
//       this.prisma.articleComment.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Monthly growth (calculated from last month)
//       this.calculateMonthlyGrowth(startDate),
      
//       // Top categories
//       this.getTopCategories(),
      
//       // Recent activity
//       this.getRecentActivity(),
//     ]);

//     return {
//       totalArticles,
//       publishedArticles,
//       draftArticles,
//       premiumArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       monthlyGrowth,
//       topCategories,
//       recentActivity,
//     };
//   } catch (error) {
//     this.logger.error('Error getting dashboard stats:', error);
//     // Return empty/default stats
//     return {
//       totalArticles: 0,
//       publishedArticles: 0,
//       draftArticles: 0,
//       premiumArticles: 0,
//       totalViews: 0,
//       totalLikes: 0,
//       totalComments: 0,
//       monthlyGrowth: 0,
//       topCategories: [],
//       recentActivity: [],
//     };
//   }
// }

// private async calculateMonthlyGrowth(startDate: Date): Promise<number> {
//   try {
//     const previousMonthStart = new Date(startDate);
//     previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
//     const [currentArticles, previousArticles] = await Promise.all([
//       this.prisma.article.count({
//         where: { 
//           createdAt: { gte: startDate },
//           status: ArticleStatus.PUBLISHED,
//         },
//       }),
//       this.prisma.article.count({
//         where: { 
//           createdAt: { 
//             gte: previousMonthStart,
//             lt: startDate,
//           },
//           status: ArticleStatus.PUBLISHED,
//         },
//       }),
//     ]);
    
//     if (previousArticles === 0) {
//       return currentArticles > 0 ? 100 : 0;
//     }
    
//     const growth = ((currentArticles - previousArticles) / previousArticles) * 100;
//     return Math.round(growth * 10) / 10; // Round to 1 decimal
//   } catch (error) {
//     this.logger.error('Error calculating monthly growth:', error);
//     return 0;
//   }
// }

// private async getTopCategories() {
//   try {
//     const categories = await this.prisma.articleCategory.findMany({
//       include: {
//         _count: {
//           select: { 
//             articles: {
//               where: { status: ArticleStatus.PUBLISHED }
//             } 
//           },
//         },
//       },
//       orderBy: {
//         articles: {
//           _count: 'desc',
//         },
//       },
//       take: 5,
//     });

//     // Process categories in parallel
//     const categoriesWithGrowth = await Promise.all(
//       categories.map(async (cat) => {
//         const growth = await this.calculateCategoryGrowth(cat.id);
//         return {
//           id: cat.id,
//           name: cat.name,
//           count: cat._count.articles,
//           color: cat.color,
//           growth: growth,
//         };
//       })
//     );

//     return categoriesWithGrowth;
//   } catch (error) {
//     this.logger.error('Error getting top categories:', error);
//     return [];
//   }
// }


// async getTrendingArticles(limit: number = 6, language: string = 'en') {
//   return this.prisma.article.findMany({
//     where: {
//       status: ArticleStatus.PUBLISHED,
//       // You can add isTrending: true if you have that field
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//         },
//       },
//       category: true,
//       // ADD THIS: Include translations
//       translations: {
//         where: { 
//           language: language,
//           status: TranslationStatus.COMPLETED 
//         },
//         select: {
//           title: true,
//           excerpt: true,
//         },
//       },
//     },
//     orderBy: [
//       { createdAt: 'desc' }
//     ],
//     take: limit,
//   }).then(articles => 
//     articles.map(article => {
//       const translation = article.translations?.[0];
//       return {
//         ...article,
//         title: translation?.title || article.title,
//         excerpt: translation?.excerpt || article.excerpt,
//         hasTranslation: !!translation,
//         displayLanguage: language,
//         translations: undefined,
//       };
//     })
//   );
// }

// private async calculateCategoryGrowth(categoryId: string): Promise<number> {
//   try {
//     const now = new Date();
//     const lastMonth = new Date();
//     lastMonth.setMonth(now.getMonth() - 1);
    
//     const [currentMonthArticles, lastMonthArticles] = await Promise.all([
//       this.prisma.article.count({
//         where: { 
//           categoryId,
//           status: ArticleStatus.PUBLISHED,
//           createdAt: { 
//             gte: new Date(now.getFullYear(), now.getMonth(), 1)
//           },
//         },
//       }),
//       this.prisma.article.count({
//         where: { 
//           categoryId,
//           status: ArticleStatus.PUBLISHED,
//           createdAt: { 
//             gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
//             lt: new Date(now.getFullYear(), now.getMonth(), 1),
//           },
//         },
//       }),
//     ]);
    
//     if (lastMonthArticles === 0) {
//       return currentMonthArticles > 0 ? 100 : 0;
//     }
    
//     const growth = ((currentMonthArticles - lastMonthArticles) / lastMonthArticles) * 100;
//     return Math.round(growth);
//   } catch (error) {
//     this.logger.error(`Error calculating growth for category ${categoryId}:`, error);
//     return 0;
//   }
// }

// private async getRecentActivity() {
//   try {
//     // Get recent published articles
//     const recentArticles = await this.prisma.article.findMany({
//       where: { 
//         status: ArticleStatus.PUBLISHED,
//         publishedAt: { not: null },
//       },
//       orderBy: { publishedAt: 'desc' },
//       take: 5,
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             picture: true,
//           },
//         },
//       },
//     });

//     // Get recent comments
//     const recentComments = await this.prisma.articleComment.findMany({
//       where: {
//         createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
//       },
//       orderBy: { createdAt: 'desc' },
//       take: 5,
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             picture: true,
//           },
//         },
//         article: {
//           select: {
//             id: true,
//             title: true,
//             slug: true,
//           },
//         },
//       },
//     });

//     // Format activities
//     const articleActivities = recentArticles.map(article => ({
//       id: article.id,
//       action: 'PUBLISH',
//       user: article.author.name,
//       target: article.title,
//       time: article.publishedAt!.toISOString(),
//       avatar: article.author.picture,
//     }));

//     const commentActivities = recentComments.map(comment => ({
//       id: comment.id,
//       action: 'COMMENT',
//       user: comment.user.name,
//       target: comment.article.title,
//       time: comment.createdAt.toISOString(),
//       avatar: comment.user.picture,
//     }));

//     // Combine and sort
//     const allActivities = [...articleActivities, ...commentActivities];
    
//     // Sort by time (newest first) and limit to 10
//     return allActivities
//       .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
//       .slice(0, 10);
//   } catch (error) {
//     this.logger.error('Error getting recent activity:', error);
//     return [];
//   }
// }

// async getRecentArticles(language: string = 'en') {
//   try {
//     const articles = await this.prisma.article.findMany({
//       where: { 
//         status: ArticleStatus.PUBLISHED,
//       },
//       orderBy: { publishedAt: 'desc' },
//       take: 10,
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//         category: {
//           select: {
//             id: true,
//             name: true,
//             color: true,
//           },
//         },
//         // ADD THIS: Include translations
//         translations: {
//           where: { 
//             language: language,
//             status: TranslationStatus.COMPLETED 
//           },
//           select: {
//             title: true,
//             excerpt: true,
//           },
//         },
//         _count: {
//           select: {
//             views: true,
//             likes: true,
//             comments: true,
//           },
//         },
//       },
//     });

//     return articles.map(article => {
//       const translation = article.translations?.[0];
//       return {
//         ...article,
//         title: translation?.title || article.title,
//         excerpt: translation?.excerpt || article.excerpt,
//         hasTranslation: !!translation,
//         displayLanguage: language,
//         viewCount: article._count?.views || 0,
//         likeCount: article._count?.likes || 0,
//         commentCount: article._count?.comments || 0,
//         translations: undefined,
//         _count: undefined,
//       };
//     });
//   } catch (error) {
//     this.logger.error('Error getting recent articles:', error);
//     return [];
//   }
// }


// async getTopArticles(language: string = 'en') {
//   try {
//     const articles = await this.prisma.article.findMany({
//       where: { 
//         status: ArticleStatus.PUBLISHED,
//       },
//       orderBy: [
//         { viewCount: 'desc' },
//         { likeCount: 'desc' },
//         { commentCount: 'desc' },
//       ],
//       take: 10,
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//         category: {
//           select: {
//             id: true,
//             name: true,
//             color: true,
//           },
//         },
//         // ADD THIS: Include translations
//         translations: {
//           where: { 
//             language: language,
//             status: TranslationStatus.COMPLETED 
//           },
//           select: {
//             title: true,
//             excerpt: true,
//           },
//         },
//       },
//     });

//     return articles.map(article => {
//       const translation = article.translations?.[0];
//       return {
//         ...article,
//         title: translation?.title || article.title,
//         excerpt: translation?.excerpt || article.excerpt,
//         hasTranslation: !!translation,
//         displayLanguage: language,
//         translations: undefined,
//       };
//     });
//   } catch (error) {
//     this.logger.error('Error getting top articles:', error);
//     return [];
//   }
// }


// // async getCommentsByArticleId(
// //   articleId: string, 
// //   page: number = 1, 
// //   limit: number = 10,
// //   currentUserId?: string
// // ) {
// //   console.log('========== getCommentsByArticleId START ==========');
// //   console.log('Article ID:', articleId);
// //   console.log('Page:', page);
// //   console.log('Limit:', limit);
  
// //   const skip = (page - 1) * limit;
  
// //   // Check if article exists
// //   const article = await this.prisma.article.findUnique({
// //     where: { id: articleId },
// //     select: { id: true, title: true, slug: true },
// //   });
  
// //   console.log('Article found:', article);
  
// //   if (!article) {
// //     console.log('Article not found, returning empty comments');
// //     return {
// //       comments: [],
// //       meta: {
// //         total: 0,
// //         page,
// //         limit,
// //         pages: 0,
// //       },
// //     };
// //   }
  
// //   console.log(`Looking for comments for article: ${article.title} (${article.slug})`);
  
// //   // Check if there are any comments at all
// //   const allCommentsCount = await this.prisma.articleComment.count({
// //     where: { articleId },
// //   });
  
// //   console.log(`Total comments in DB for this article: ${allCommentsCount}`);
  
// //   const [comments, total] = await Promise.all([
// //     this.prisma.articleComment.findMany({
// //       where: {
// //         articleId,
// //         parentId: null,
// //         status: 'ACTIVE',
// //       },
// //       include: {
// //         user: {
// //           select: {
// //             id: true,
// //             name: true,
// //             username: true,
// //             picture: true,
// //           },
// //         },
// //         replies: {
// //           where: { status: 'ACTIVE' },
// //           include: {
// //             user: {
// //               select: {
// //                 id: true,
// //                 name: true,
// //                 username: true,
// //                 picture: true,
// //               },
// //             },
// //           },
// //           orderBy: { createdAt: 'asc' },
// //         },
// //       },
// //       orderBy: [
// //         { isPinned: 'desc' },
// //         { createdAt: 'desc' }
// //       ],
// //       skip,
// //       take: limit,
// //     }),
// //     this.prisma.articleComment.count({
// //       where: {
// //         articleId,
// //         parentId: null,
// //         status: 'ACTIVE',
// //       },
// //     }),
// //   ]);

// //   console.log(`Query found ${comments.length} top-level comments`);
// //   console.log(`Total top-level comments (according to count): ${total}`);
  
// //   if (comments.length > 0) {
// //     console.log('First comment content:', comments[0].content);
// //     console.log('First comment user:', comments[0].user);
// //     console.log('First comment replies count:', comments[0].replies?.length);
// //   }
  
// //   // Format comments
// //   const formattedComments = comments.map((comment, index) => {
// //     console.log(`Processing comment ${index + 1}:`, {
// //       id: comment.id,
// //       contentLength: comment.content?.length,
// //       user: comment.user?.name,
// //       replyCount: comment.replies?.length
// //     });
    
// //     return {
// //       id: comment.id,
// //       content: comment.content,
// //       createdAt: comment.createdAt.toISOString(),
// //       updatedAt: comment.updatedAt.toISOString(),
// //       likeCount: comment.likeCount || 0,
// //       replyCount: comment.replies?.length || 0,
// //       isEdited: comment.isEdited,
// //       isPinned: comment.isPinned,
// //       isFeatured: comment.isFeatured,
// //       language: comment.language,
// //       user: comment.user,
// //       replies: comment.replies?.map(reply => ({
// //         id: reply.id,
// //         content: reply.content,
// //         createdAt: reply.createdAt.toISOString(),
// //         updatedAt: reply.updatedAt.toISOString(),
// //         likeCount: reply.likeCount || 0,
// //         isEdited: reply.isEdited,
// //         user: reply.user,
// //       })) || [],
// //     };
// //   });

// //   console.log(`Formatted ${formattedComments.length} comments`);
// //   console.log('========== getCommentsByArticleId END ==========');
  
// //   return {
// //     comments: formattedComments,
// //     meta: {
// //       total,
// //       page,
// //       limit,
// //       pages: Math.ceil(total / limit),
// //     },
// //   };
// // }

// async getArticleById(id: string) {
//   const article = await this.prisma.article.findUnique({
//     where: { id },
//   });

//   if (!article) {
//     throw new NotFoundException('Article not found');
//   }

//   return article;
// }

// async getRelatedArticlesByIdOrSlug(identifier: string, limit: number = 3) {
//   let article;
  
//   // Determine if identifier is ID or slug
//   if (identifier.length === 25 && !identifier.includes('-')) {
//     // ID
//     article = await this.prisma.article.findUnique({
//       where: { id: identifier },
//       select: {
//         id: true,
//         categoryId: true,
//         tags: true,
//         keywords: true,
//       },
//     });
//   } else {
//     // Slug
//     article = await this.prisma.article.findUnique({
//       where: { slug: identifier },
//       select: {
//         id: true,
//         categoryId: true,
//         tags: true,
//         keywords: true,
//       },
//     });
//   }

//   if (!article) {
//     throw new NotFoundException('Article not found');
//   }

//   // Get related articles
//   const relatedArticles = await this.prisma.article.findMany({
//     where: {
//       AND: [
//         { id: { not: article.id } },
//         { status: ArticleStatus.PUBLISHED },
//         {
//           OR: [
//             article.categoryId ? { categoryId: article.categoryId } : {},
//             article.tags?.length ? { tags: { hasSome: article.tags } } : {},
//             article.keywords?.length ? { keywords: { hasSome: article.keywords } } : {},
//           ].filter(condition => Object.keys(condition).length > 0),
//         },
//       ],
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//         },
//       },
//       category: true,
//       _count: {
//         select: {
//           views: true,
//           likes: true,
//         },
//       },
//     },
//     orderBy: { createdAt: 'desc' },
//     take: limit * 2, // Get more than needed
//   });

//   // Sort manually by engagement
//   const sortedArticles = [...relatedArticles].sort((a, b) => {
//     const aEngagement = (a._count?.views || 0) + (a._count?.likes || 0);
//     const bEngagement = (b._count?.views || 0) + (b._count?.likes || 0);
//     return bEngagement - aEngagement;
//   });

//   // Take only what we need and remove _count
//   const finalArticles = sortedArticles.slice(0, limit).map(({ _count, ...rest }) => rest);

//   return finalArticles;
// }


//   async likeArticle(articleId: string, userId: string, language: string = 'en') {
//     try {
//       // Check if article exists and is published
//       const article = await this.prisma.article.findUnique({
//         where: { id: articleId },
//         select: {
//           id: true,
//           title: true,
//           slug: true,
//           authorId: true, 
//           status: true,
//           accessType: true,
//         },
//       });

//       if (!article || article.status !== ArticleStatus.PUBLISHED) {
//         throw new NotFoundException('Article not found or not published');
//       }

//       // Check if already liked
//       const existing = await this.prisma.articleLike.findUnique({
//         where: {
//           articleId_userId_language: {
//             articleId,
//             userId,
//             language,
//           },
//         },
//       });

//       if (existing) {
//         // Unlike the article
//         await this.prisma.articleLike.delete({
//           where: {
//             articleId_userId_language: {
//               articleId,
//               userId,
//               language,
//             },
//           },
//         });

//         // Update like count (eventually consistent - could fail but that's okay)
//         try {
//           await this.prisma.article.update({
//             where: { id: articleId },
//             data: {
//               likeCount: { decrement: 1 },
//             },
//           });
//         } catch (updateError) {
//           this.logger.warn(`Failed to update like count for article ${articleId}:`, updateError);
//           // Continue anyway - we'll sync counts later if needed
//         }

//         return { liked: false, message: 'Article unliked' };
//       } else {
//         // Like the article
//         await this.prisma.articleLike.create({
//           data: {
//             articleId,
//             userId,
//             language,
//           },
//         });

//         // Update like count
//         try {
//           await this.prisma.article.update({
//             where: { id: articleId },
//             data: {
//               likeCount: { increment: 1 },
//             },
//           });
//         } catch (updateError) {
//           this.logger.warn(`Failed to update like count for article ${articleId}:`, updateError);
//           // Continue anyway
//         }

//         try {
//           await this.notificationService.notifyArticleLike(
//             article.authorId,
//             articleId,
//             userId
//           );
//         } catch (error) {
//           this.logger.error('Failed to send like notification', error);
//         }

//         return { liked: true, message: 'Article liked' };
//       }
//     } catch (error) {
//       this.logger.error(`Error in likeArticle:`, error);
//       throw error;
//     }


//   }




//   async saveArticle(articleId: string, userId: string, language: string = 'en') {
//   try {
//     // Check if article exists and is published
//     const article = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { status: true },
//     });

//     if (!article || article.status !== ArticleStatus.PUBLISHED) {
//       throw new NotFoundException('Article not found or not published');
//     }

//     // Check if already saved
//     const existing = await this.prisma.articleSave.findFirst({
//       where: {
//         articleId,
//         userId,
//         language,
//       },
//     });

//     if (existing) {
//       // Unsave the article
//       await this.prisma.articleSave.delete({
//         where: { id: existing.id },
//       });

//       // Update save count
//       try {
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             saveCount: { decrement: 1 },
//           },
//         });
//       } catch (updateError) {
//         this.logger.warn(`Failed to update save count for article ${articleId}:`, updateError);
//       }

//       return { saved: false, message: 'Article removed from saved' };
//     } else {
//       // Save the article
//       await this.prisma.articleSave.create({
//         data: {
//           articleId,
//           userId,
//           language,
//         },
//       });

//       // Update save count
//       try {
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             saveCount: { increment: 1 },
//           },
//         });
//       } catch (updateError) {
//         this.logger.warn(`Failed to update save count for article ${articleId}:`, updateError);
//       }

//       return { saved: true, message: 'Article saved successfully' };
//     }
//   } catch (error) {
//     this.logger.error(`Error in saveArticle:`, error);
//     throw error;
//   }
// }


// async trackArticleView(articleId: string, userId?: string, language: string = 'en') {
//   try {
//     // 1. Try to create view - will fail if duplicate due to unique constraint
//     const view = await this.prisma.articleView.create({
//       data: {
//         articleId,
//         userId: userId || null,
//         language,
//         ipAddress: '',
//         userAgent: '',
//       },
//     });

//     // 2. Update article counts
//     const updateData: any = {
//       viewCount: { increment: 1 },
//     };

//     // Check if this is first view from this user
//     if (userId) {
//       const previousUserViews = await this.prisma.articleView.count({
//         where: {
//           articleId,
//           userId,
//         },
//       });

//       if (previousUserViews === 1) { // This is the first one we just created
//         updateData.uniqueViewCount = { increment: 1 };
//       }
//     }

//     await this.prisma.article.update({
//       where: { id: articleId },
//       data: updateData,
//     });

//     return { 
//       success: true, 
//       message: 'View counted',
//       viewId: view.id,
//     };

//   } catch (error) {
//     // If duplicate, just return success - view already counted
//     if (error.code === 'P2002') {
//       return { 
//         success: true, 
//         message: 'View already counted (duplicate)',
//         isDuplicate: true,
//       };
//     }

//     // For other errors, log but don't fail
//     this.logger.debug('View tracking error (non-critical):', error.message);
//     return { 
//       success: true, // Still return success to frontend
//       message: 'View may have been counted',
//       error: error.message,
//     };
//   }
// }

//   async addComment(articleId: string, userId: string, dto: CommentDto) {
//     const article = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { status: true, 
//         accessType: true,  
//         authorId: true, 
//         title: true,    
//         slug: true, 
//       },
//     });

//     if (!article || article.status !== ArticleStatus.PUBLISHED) {
//       throw new NotFoundException('Article not found or not published');
//     }

//     // Check premium access for commenting on premium articles
//     if (article.accessType === ContentAccess.PREMIUM) {
//       const hasAccess = await this.checkPremiumAccess(userId, articleId);
//       if (!hasAccess) {
//         throw new ForbiddenException('You need premium access to comment on this article');
//       }
//     }

//     // Validate parent comment exists if provided
//     if (dto.parentId) {
//       const parentComment = await this.prisma.articleComment.findUnique({
//         where: { id: dto.parentId },
//       });

//       if (!parentComment || parentComment.articleId !== articleId) {
//         throw new BadRequestException('Invalid parent comment');
//       }
//     }

//     const comment = await this.prisma.$transaction(async (tx) => {
//       const newComment = await tx.articleComment.create({
//         data: {
//           content: dto.content,
//           articleId,
//           userId,
//           parentId: dto.parentId,
//           language: dto.language || 'en',
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               username: true,
//               picture: true,
//             },
//           },
//         },
//       });

//       // Update comment count
//       await tx.article.update({
//         where: { id: articleId },
//         data: {
//           commentCount: { increment: 1 },
//         },
//       });

//       return newComment;
//     });

//     try {
//       await this.notificationService.notifyArticleComment(
//         article.authorId,
//         articleId,
//         userId,
//         comment.id
//       );
//     } catch (error) {
//       this.logger.error('Failed to send comment notification', error);
//     }

//     // Track engagement
//     try {
//       await this.engagementService.trackEngagement(userId, articleId, 'COMMENT', { 
//         commentId: comment.id,
//         language: dto.language || 'en',
//       });
//     } catch (error) {
//       this.logger.warn(`Failed to track comment engagement for article ${articleId}:`, error);
//     }

//     return comment;
//   }



//   async likeComment(commentId: string, userId: string) {
//   const comment = await this.prisma.articleComment.findUnique({
//     where: { id: commentId },
//     select: { id: true, articleId: true, likeCount: true },
//   });

//   if (!comment) {
//     throw new NotFoundException('Comment not found');
//   }

//   // Check if already liked
//   const existingLike = await this.prisma.commentLike.findUnique({
//     where: {
//       commentId_userId: {
//         commentId,
//         userId,
//       },
//     },
//   });

//   if (existingLike) {
//     // Unlike
//     await this.prisma.$transaction([
//       this.prisma.commentLike.delete({
//         where: {
//           commentId_userId: {
//             commentId,
//             userId,
//           },
//         },
//       }),
//       this.prisma.articleComment.update({
//         where: { id: commentId },
//         data: {
//           likeCount: { decrement: 1 },
//         },
//       }),
//     ]);

//     return { liked: false, likeCount: comment.likeCount - 1 };
//   } else {
//     // Like
//     await this.prisma.$transaction([
//       this.prisma.commentLike.create({
//         data: {
//           commentId,
//           userId,
//         },
//       }),
//       this.prisma.articleComment.update({
//         where: { id: commentId },
//         data: {
//           likeCount: { increment: 1 },
//         },
//       }),
//     ]);

//     // Track engagement
//     try {
//       await this.engagementService.trackEngagement(userId, comment.articleId, 'LIKE', {
//         commentId,
//       });
//     } catch (error) {
//       this.logger.warn(`Failed to track comment like engagement:`, error);
//     }

//     return { liked: true, likeCount: comment.likeCount + 1 };
//   }
// }

// async unlikeComment(commentId: string, userId: string) {
//   return this.likeComment(commentId, userId); // Same logic - toggles like/unlike
// }

// async updateComment(commentId: string, userId: string, content: string) {
//   const comment = await this.prisma.articleComment.findUnique({
//     where: { id: commentId },
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           picture: true,
//         },
//       },
//     },
//   });

//   if (!comment) {
//     throw new NotFoundException('Comment not found');
//   }

//   // Check ownership
//   if (comment.userId !== userId) {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true },
//     });

//     const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
//     if (!isAdmin) {
//       throw new ForbiddenException('You can only edit your own comments');
//     }
//   }

//   // Update comment
//   const updated = await this.prisma.articleComment.update({
//     where: { id: commentId },
//     data: {
//       content,
//       isEdited: true,
//       updatedAt: new Date(),
//     },
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           picture: true,
//         },
//       },
//       replies: {
//         where: { status: 'ACTIVE' },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               picture: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'asc' },
//       },
//     },
//   });

//   return {
//     ...updated,
//     replyCount: updated.replies?.length || 0,
//   };
// }

// async deleteComment(commentId: string, userId: string) {
//   const comment = await this.prisma.articleComment.findUnique({
//     where: { id: commentId },
//     include: {
//       user: true,
//       replies: {
//         where: { status: 'ACTIVE' },
//       },
//     },
//   });

//   if (!comment) {
//     throw new NotFoundException('Comment not found');
//   }

//   // Check ownership or admin
//   const user = await this.prisma.user.findUnique({
//     where: { id: userId },
//     select: { role: true },
//   });

//   const isOwner = comment.userId === userId;
//   const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

//   if (!isOwner && !isAdmin) {
//     throw new ForbiddenException('You can only delete your own comments');
//   }

//   // Soft delete
//   const deleted = await this.prisma.articleComment.update({
//     where: { id: commentId },
//     data: {
//       status: 'DELETED',
//       content: isAdmin ? '[Removed by moderator]' : '[Deleted by user]',
//       isEdited: false,
//     },
//   });

//   // Update article comment count
//   await this.prisma.article.update({
//     where: { id: comment.articleId },
//     data: {
//       commentCount: { decrement: 1 },
//     },
//   });

//   return { success: true, message: 'Comment deleted' };
// }




// async getCommentsByArticleId(
//   articleId: string, 
//   page: number = 1, 
//   limit: number = 10,
//   currentUserId?: string,
//   depth: number = 2
// ) {
//   const skip = (page - 1) * limit;
  
//   const article = await this.prisma.article.findUnique({
//     where: { id: articleId },
//     select: { id: true, title: true, slug: true },
//   });
  
//   if (!article) {
//     return {
//       comments: [],
//       meta: {
//         total: 0,
//         page,
//         limit,
//         pages: 0,
//         hasMore: false,
//       },
//     };
//   }
  
//   // Build the include query dynamically based on depth
//   const buildInclude = (currentDepth: number): any => {
//     const include: any = {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//         },
//       },
//     };

//     // Add replies if we haven't reached the max depth
//     if (currentDepth > 0) {
//       include.replies = {
//         where: { status: 'ACTIVE' },
//         include: buildInclude(currentDepth - 1),
//         orderBy: { createdAt: 'asc' },
//         take: 3, // Limit nested replies
//       };
//     }

//     return include;
//   };

//   const [comments, total] = await Promise.all([
//     this.prisma.articleComment.findMany({
//       where: {
//         articleId,
//         parentId: null,
//         status: 'ACTIVE',
//       },
//       include: buildInclude(depth),
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

//   // Recursive function to process comments and check likes
//   const processComment = async (comment: any, userId?: string): Promise<any> => {
//     let isLiked = false;
//     let isOwn = false;
    
//     if (userId) {
//       const like = await this.prisma.commentLike.findUnique({
//         where: {
//           commentId_userId: {
//             commentId: comment.id,
//             userId,
//           },
//         },
//       });
//       isLiked = !!like;
//       isOwn = comment.userId === userId;
//     }

//     // Process replies recursively
//     let processedReplies: any[] = [];
//     if (comment.replies && comment.replies.length > 0) {
//       processedReplies = await Promise.all(
//         comment.replies.map(async (reply: any) => await processComment(reply, userId))
//       );
//     }

//     // Count total replies (not just the ones we loaded)
//     const totalReplyCount = await this.prisma.articleComment.count({
//       where: {
//         parentId: comment.id,
//         status: 'ACTIVE',
//       },
//     });

//     return {
//       id: comment.id,
//       content: comment.content,
//       createdAt: (comment.createdAt instanceof Date 
//         ? comment.createdAt 
//         : new Date(comment.createdAt)
//       ).toISOString(),
//       updatedAt: comment.updatedAt 
//         ? (comment.updatedAt instanceof Date 
//             ? comment.updatedAt 
//             : new Date(comment.updatedAt)
//           ).toISOString()
//         : null,
//       likeCount: comment.likeCount || 0,
//       replyCount: totalReplyCount,
//       isLiked,
//       isOwn,
//       isEdited: comment.isEdited || false,
//       isPinned: comment.isPinned || false,
//       isFeatured: comment.isFeatured || false,
//       language: comment.language || 'en',
//       user: comment.user || null,
//       replies: processedReplies,
//       hasMoreReplies: totalReplyCount > processedReplies.length,
//     };
//   };

//   const formattedComments = await Promise.all(
//     comments.map(async (comment) => await processComment(comment, currentUserId))
//   );
  
//   // Calculate hasMore - this is crucial!
//   const hasMore = total > skip + limit;
  
//   return {
//     comments: formattedComments,
//     meta: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(total / limit),
//       hasMore: hasMore,
//       nextPage: hasMore ? page + 1 : null,
//     },
//   };
// }


// async getCommentReplies(
//   commentId: string, 
//   page: number = 1, 
//   limit: number = 10,
//   currentUserId?: string
// ) {
//   const skip = (page - 1) * limit;

//   const [replies, total] = await Promise.all([
//     this.prisma.articleComment.findMany({
//       where: {
//         parentId: commentId,
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
//         // Include nested replies (1 level deep)
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
//           take: 2, // Get 2 nested replies initially
//         },
//       },
//       orderBy: { createdAt: 'asc' },
//       skip,
//       take: limit,
//     }),
//     this.prisma.articleComment.count({
//       where: {
//         parentId: commentId,
//         status: 'ACTIVE',
//       },
//     }),
//   ]);

//   // Process each reply
//   const processedReplies = await Promise.all(
//     replies.map(async (reply): Promise<any> => {
//       let isLiked = false;
//       let isOwn = false;
      
//       if (currentUserId) {
//         const like = await this.prisma.commentLike.findUnique({
//           where: {
//             commentId_userId: {
//               commentId: reply.id,
//               userId: currentUserId,
//             },
//           },
//         });
//         isLiked = !!like;
//         isOwn = reply.userId === currentUserId;
//       }

//       // Process nested replies
//       let processedNestedReplies: any[] = [];
//       if (reply.replies && reply.replies.length > 0) {
//         processedNestedReplies = await Promise.all(
//           reply.replies.map(async (nestedReply): Promise<any> => {
//             let nestedIsLiked = false;
//             let nestedIsOwn = false;
            
//             if (currentUserId) {
//               const nestedLike = await this.prisma.commentLike.findUnique({
//                 where: {
//                   commentId_userId: {
//                     commentId: nestedReply.id,
//                     userId: currentUserId,
//                   },
//                 },
//               });
//               nestedIsLiked = !!nestedLike;
//               nestedIsOwn = nestedReply.userId === currentUserId;
//             }
            
//             return {
//               id: nestedReply.id,
//               content: nestedReply.content,
//               createdAt: nestedReply.createdAt.toISOString(),
//               updatedAt: nestedReply.updatedAt.toISOString(),
//               likeCount: nestedReply.likeCount || 0,
//               isLiked: nestedIsLiked,
//               isOwn: nestedIsOwn,
//               isEdited: nestedReply.isEdited || false,
//               user: nestedReply.user || null,
//               replies: [], // Don't go deeper initially
//               hasMoreReplies: await this.prisma.articleComment.count({
//                 where: {
//                   parentId: nestedReply.id,
//                   status: 'ACTIVE',
//                 },
//               }) > 0,
//             };
//           })
//         );
//       }

//       // Count total replies for this comment
//       const totalReplyCount = await this.prisma.articleComment.count({
//         where: {
//           parentId: reply.id,
//           status: 'ACTIVE',
//         },
//       });

//       return {
//         id: reply.id,
//         content: reply.content,
//         createdAt: reply.createdAt.toISOString(),
//         updatedAt: reply.updatedAt.toISOString(),
//         likeCount: reply.likeCount || 0,
//         isLiked,
//         isOwn,
//         isEdited: reply.isEdited || false,
//         user: reply.user || null,
//         replies: processedNestedReplies,
//         replyCount: totalReplyCount,
//         hasMoreReplies: totalReplyCount > processedNestedReplies.length,
//       };
//     })
//   );

//   return {
//     replies: processedReplies,
//     meta: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(total / limit),
//       hasMore: total > skip + limit,
//       nextPage: total > skip + limit ? page + 1 : null,
//     },
//   };
// }
  

//   private async checkPremiumAccess(userId: string, articleId: string): Promise<boolean> {
//     // Check if user is the author (authors have free access to their own articles)
//     const article = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { authorId: true },
//     });

//     if (article?.authorId === userId) {
//       return true;
//     }

//     // Check subscription
//     const subscription = await this.prisma.userSubscription.findFirst({
//       where: {
//         userId,
//         status: 'ACTIVE',
//         currentPeriodEnd: { gt: new Date() },
//       },
//     });

//     if (subscription) return true;

//     // Check if user already purchased access
//     const existingAccess = await this.prisma.premiumAccess.findUnique({
//       where: {
//         userId_articleId: {
//           userId,
//           articleId,
//         },
//       },
//     });

//     if (existingAccess && existingAccess.accessUntil > new Date()) {
//       return true;
//     }

//     // Check wallet balance for coin purchase
//     const articleWithPrice = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { coinPrice: true },
//     });

//     if (articleWithPrice?.coinPrice && articleWithPrice.coinPrice > 0) {
//       const wallet = await this.prisma.wallet.findUnique({
//         where: { userId },
//       });

//       if (wallet && wallet.balance >= articleWithPrice.coinPrice) {
//         // Process coin payment
//         await this.processCoinPurchase(userId, articleId, articleWithPrice.coinPrice);
//         return true;
//       }
//     }

//     return false;
//   }

//   private async processCoinPurchase(userId: string, articleId: string, price: number) {
//     return await this.prisma.$transaction(async (tx) => {
//       const wallet = await tx.wallet.findUnique({ where: { userId } });
//       if (!wallet) {
//         throw new BadRequestException('Wallet not found');
//       }

//       if (wallet.balance < price) {
//         throw new BadRequestException('Insufficient balance');
//       }

//       // Deduct coins
//       await tx.wallet.update({
//         where: { userId },
//         data: {
//           balance: { decrement: price },
//         },
//       });

//       // Create transaction record
//       await tx.walletTransaction.create({
//         data: {
//           walletId: wallet.id,
//           amount: price,
//           type: 'DEBIT',
//           source: TransactionSource.ONE_TIME_PURCHASE,
//           description: `Purchased premium article: ${articleId}`,
//           userId,
//         },
//       });

//       // Log usage
//       await tx.usageLog.create({
//         data: {
//           userId,
//           action: UsageAction.TEMPLATE_PREMIUM,
//           cost: price,
//           metadata: { articleId, type: 'PREMIUM_ARTICLE_ACCESS' },
//         },
//       });

//       // Create premium access record
//       await tx.premiumAccess.create({
//         data: {
//           userId,
//           articleId,
//           amountPaid: price,
//           accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//         },
//       });

//       this.logger.log(`User ${userId} purchased article ${articleId} for ${price} coins`);
//     });
//   }

//   async deleteArticle(slug: string, userId: string, hardDelete: boolean = false) {
//     const article = await this.prisma.article.findUnique({
//       where: { slug },
//       select: { id: true, authorId: true, status: true },
//     });

//     if (!article) {
//       throw new NotFoundException('Article not found');
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true },
//     });

//     const canDelete = article.authorId === userId || 
//                      user?.role === 'ADMIN' || 
//                      user?.role === 'SUPER_ADMIN';

//     if (!canDelete) {
//       throw new ForbiddenException('Not authorized to delete this article');
//     }

//     if (hardDelete) {
//       // Hard delete - remove everything
//       await this.prisma.article.delete({
//         where: { id: article.id },
//       });
//       return { success: true, message: 'Article permanently deleted' };
//     } else {
//       // Soft delete - archive the article
//       await this.prisma.article.update({
//         where: { id: article.id },
//         data: { status: ArticleStatus.ARCHIVED },
//       });
//       return { success: true, message: 'Article archived' };
//     }
//   }

//   async publishArticle(slug: string, userId: string) {
//     const article = await this.prisma.article.findUnique({
//       where: { slug },
//       select: { id: true, authorId: true, status: true },
//     });

//     if (!article) {
//       throw new NotFoundException('Article not found');
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true },
//     });

//     const canPublish = article.authorId === userId || 
//                       user?.role === 'ADMIN' || 
//                       user?.role === 'SUPER_ADMIN';

//     if (!canPublish) {
//       throw new ForbiddenException('Not authorized to publish this article');
//     }

//     const updated = await this.prisma.article.update({
//       where: { id: article.id },
//       data: {
//         status: ArticleStatus.PUBLISHED,
//         publishedAt: new Date(),
//       },
//       include: {
//         category: true,
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//       },
//     });

//     // Trigger translations if auto-translate is enabled
//     if (updated.autoTranslate && updated.targetLanguages && updated.targetLanguages.length > 0) {
//       this.processTranslationsInBackground(updated.id, updated.targetLanguages)
//         .then(result => {
//           this.logger.log(
//             `Auto-translations triggered for published article "${updated.title}": ` +
//             `${result.successful} successful, ${result.failed} failed`
//           );
//         })
//         .catch(error => {
//           this.logger.error(`Auto-translation failed for published article ${updated.id}:`, error);
//         });
//     }

//     return updated;
//   }

//   private extractPlainText(content: any): string {
//     if (typeof content === 'string') return content;
    
//     try {
//       if (content && typeof content === 'object') {
//         // Handle TipTap JSON content
//         if (content.type === 'doc' && content.content) {
//           return this.extractTextFromNodes(content.content);
//         }
//         // Handle other structured content
//         if (content.text) return content.text;
//         if (content.content) return JSON.stringify(content.content);
//       }
//     } catch (error) {
//       this.logger.warn('Failed to extract plain text from content:', error);
//     }
    
//     return '';
//   }

//   private extractTextFromNodes(nodes: any[]): string {
//     let text = '';
//     for (const node of nodes) {
//       if (node.type === 'text' && node.text) {
//         text += node.text + ' ';
//       }
//       if (node.content && Array.isArray(node.content)) {
//         text += this.extractTextFromNodes(node.content);
//       }
//     }
//     return text.trim();
//   }

//   private calculateReadingTime(content: any): number {
//     const plainText = this.extractPlainText(content);
//     const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
//     const wordsPerMinute = 200; // Average reading speed
//     const minutes = wordCount / wordsPerMinute;
//     return Math.max(1, Math.ceil(minutes));
//   }

//   public getPreviewVersion(article: any) {
//     return {
//       id: article.id,
//       slug: article.slug,
//       title: article.title,
//       excerpt: article.excerpt,
//       preview: article.excerpt.substring(0, 200) + (article.excerpt.length > 200 ? '...' : ''),
//       category: article.category,
//       tags: article.tags,
//       accessType: article.accessType,
//       coinPrice: article.coinPrice,
//       author: article.author,
//       coverImage: article.coverImage,
//       readingTime: article.readingTime,
//       status: article.status,
//       isFeatured: article.isFeatured,
//       isTrending: article.isTrending,
//       viewCount: article.viewCount,
//       likeCount: article.likeCount,
//       commentCount: article.commentCount,
//       publishedAt: article.publishedAt,
//       availableLanguages: article.availableLanguages,
//       isPreview: true,
//       requiresPurchase: true,
//       createdAt: article.createdAt,
//       updatedAt: article.updatedAt,
//     };
//   }

//   private isPreviewVersion(article: any): boolean {
//     return article.isPreview === true;
//   }

//   // async getArticleStats(articleId: string) {
//   //   const article = await this.prisma.article.findUnique({
//   //     where: { id: articleId },
//   //     select: {
//   //       id: true,
//   //       title: true,
//   //       slug: true,
//   //       status: true,
//   //     },
//   //   });

//   //   if (!article) {
//   //     throw new NotFoundException('Article not found');
//   //   }

//   //   const [
//   //     views,
//   //     likes,
//   //     comments,
//   //     shares,
//   //     saves,
//   //     claps,
//   //     translations,
//   //   ] = await Promise.all([
//   //     this.prisma.articleView.count({ where: { articleId } }),
//   //     this.prisma.articleLike.count({ where: { articleId } }),
//   //     this.prisma.articleComment.count({ where: { articleId } }),
//   //     this.prisma.articleShare.count({ where: { articleId } }),
//   //     this.prisma.articleSave.count({ where: { articleId } }),
//   //     this.prisma.articleClap.aggregate({
//   //       where: { articleId },
//   //       _sum: { count: true },
//   //     }),
//   //     this.prisma.articleTranslation.count({ 
//   //       where: { 
//   //         articleId,
//   //         status: TranslationStatus.COMPLETED 
//   //       } 
//   //     }),
//   //   ]);

//   //   return {
//   //     article: {
//   //       id: article.id,
//   //       title: article.title,
//   //       slug: article.slug,
//   //       status: article.status,
//   //     },
//   //     stats: {
//   //       views,
//   //       likes,
//   //       comments,
//   //       shares,
//   //       saves,
//   //       claps: claps._sum.count || 0,
//   //       translations,
//   //     },
//   //     calculated: {
//   //       engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
//   //       avgClapsPerUser: likes > 0 ? (claps._sum.count || 0) / likes : 0,
//   //     },
//   //   };
//   // }


//   async purchaseArticle(articleId: string, userId: string, language: string = 'en') {
//     console.log('=== PURCHASE START ===');
//     console.log('Article ID:', articleId);
//     console.log('User ID:', userId);
    
//     try {
//       const article = await this.prisma.article.findUnique({
//         where: { id: articleId },
//         select: { 
//           id: true,
//           title: true,
//           accessType: true,
//           coinPrice: true,
//           authorId: true,
//           status: true 
//         },
//       });

//       console.log('Article found:', article);

//       if (!article || article.status !== ArticleStatus.PUBLISHED) {
//         console.log('Article not found or not published');
//         throw new NotFoundException('Article not found or not published');
//       }

//       if (article.accessType !== ContentAccess.PREMIUM) {
//         console.log('Article is not premium');
//         throw new BadRequestException('This article is not premium');
//       }

//       // Check if already has access
//       const existingAccess = await this.prisma.premiumAccess.findFirst({
//         where: {
//           userId,
//           articleId,
//           accessUntil: { gt: new Date() }
//         },
//       });

//       console.log('Existing access check:', existingAccess);

//       // If user already has access, return success
//       if (existingAccess) {
//         console.log('User already has access');
//         return {
//           success: true,
//           data: { purchased: true },
//           message: 'Already have access to this article',
//         };
//       }

//       // Check wallet balance
//       const wallet = await this.prisma.wallet.findUnique({
//         where: { userId },
//       });

//       console.log('Wallet found:', wallet);

//       if (!wallet || wallet.balance < article.coinPrice) {
//         console.log('Insufficient balance:', wallet?.balance, 'needed:', article.coinPrice);
//         throw new BadRequestException('Insufficient balance');
//       }

//       console.log('Proceeding with purchase...');
      
//       // Process purchase in transaction
//       const result = await this.prisma.$transaction(async (tx) => {
//         console.log('Starting transaction...');
        
//         // Deduct coins
//         const updatedWallet = await tx.wallet.update({
//           where: { userId },
//           data: {
//             balance: { decrement: article.coinPrice },
//           },
//         });
//         console.log('Coins deducted. New balance:', updatedWallet.balance);

//         // Create transaction record
//         const transaction = await tx.walletTransaction.create({
//           data: {
//             walletId: wallet.id,
//             amount: article.coinPrice,
//             type: 'DEBIT',
//             source: TransactionSource.ONE_TIME_PURCHASE,
//             description: `Purchased premium article: ${article.title}`,
//             userId,
//           },
//         });
//         console.log('Transaction created:', transaction.id);

//         // Create premium access record
//         const premiumAccess = await tx.premiumAccess.create({
//           data: {
//             userId,
//             articleId,
//             amountPaid: article.coinPrice,
//             accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//           },
//         });
//         console.log('PremiumAccess created:', premiumAccess.id);

//         // Log usage
//         await tx.usageLog.create({
//           data: {
//             userId,
//             action: UsageAction.TEMPLATE_PREMIUM,
//             cost: article.coinPrice,
//             metadata: { 
//               articleId, 
//               articleTitle: article.title,
//               type: 'PREMIUM_ARTICLE_PURCHASE' 
//             },
//           },
//         });
//         console.log('Usage logged');

//         return {
//           transaction,
//           premiumAccess,
//         };
//       });

//       console.log('=== PURCHASE COMPLETED SUCCESSFULLY ===');
      
//       return {
//         success: true,
//         data: { purchased: true },
//         message: 'Article purchased successfully',
//         transactionId: result.transaction.id,
//         premiumAccessId: result.premiumAccess.id,
//       };

//     } catch (error) {
//       console.error('=== PURCHASE FAILED ===');
//       console.error('Error:', error);
//       console.error('Error message:', error.message);
      
//       // Re-throw the error so it can be handled by the controller
//       throw error;
//     }
//   }



//   // Also update checkArticleAccess to remove language from query
//   async checkArticleAccess(articleId: string, userId: string, language: string = 'en') {
//     const article = await this.prisma.article.findUnique({
//       where: { id: articleId },
//       select: { 
//         id: true,
//         accessType: true,
//         authorId: true,
//         status: true 
//       },
//     });

//     if (!article || article.status !== ArticleStatus.PUBLISHED) {
//       return { hasAccess: false, reason: 'Article not found or not published' };
//     }

//     // Authors have access to their own articles
//     if (article.authorId === userId) {
//       return { hasAccess: true, reason: 'Author of article' };
//     }

//     // Free articles
//     if (article.accessType === ContentAccess.FREE) {
//       return { hasAccess: true, reason: 'Free article' };
//     }

//     // Check premium access (only if accessUntil is in the future)
//     const existingAccess = await this.prisma.premiumAccess.findFirst({
//       where: {
//         userId,
//         articleId,
//         accessUntil: { gt: new Date() }
//       },
//     });

//     if (existingAccess) {
//       return { 
//         hasAccess: true, 
//         reason: 'Already purchased',
//         accessUntil: existingAccess.accessUntil,
//         purchasedAt: existingAccess.createdAt 
//       };
//     }

//     // Check subscription
//     const subscription = await this.prisma.userSubscription.findFirst({
//       where: {
//         userId,
//         status: 'ACTIVE',
//         currentPeriodEnd: { gt: new Date() },
//       },
//     });

//     if (subscription) {
//       return { hasAccess: true, reason: 'Active subscription' };
//     }

//     return { hasAccess: false, reason: 'No access found' };
//   }




//   async getUserReadingStats(userId: string) {
//     console.log('📊 getUserReadingStats called for userId:', userId);
    
//     // Get counts from MULTIPLE sources, not just ArticleView
//     const [
//       viewedArticles,
//       savedArticles,
//       likedArticles,
//       commentedArticles
//     ] = await Promise.all([
//       // Articles viewed
//       this.prisma.articleView.findMany({
//         where: { userId },
//         select: { articleId: true },
//         distinct: ['articleId'],
//       }),
//       // Articles saved
//       this.prisma.articleSave.findMany({
//         where: { userId },
//         select: { articleId: true },
//         distinct: ['articleId'],
//       }),
//       // Articles liked
//       this.prisma.articleLike.findMany({
//         where: { userId },
//         select: { articleId: true },
//         distinct: ['articleId'],
//       }),
//       // Articles commented on
//       this.prisma.articleComment.findMany({
//         where: { userId },
//         select: { articleId: true },
//         distinct: ['articleId'],
//       }),
//     ]);
    
//     console.log('📊 Stats counts:', {
//       viewed: viewedArticles.length,
//       saved: savedArticles.length,
//       liked: likedArticles.length,
//       commented: commentedArticles.length,
//     });
    
//     // Combine all unique article interactions
//     const allArticleIds = new Set([
//       ...viewedArticles.map(v => v.articleId),
//       ...savedArticles.map(s => s.articleId),
//       ...likedArticles.map(l => l.articleId),
//       ...commentedArticles.map(c => c.articleId),
//     ]);
    
//     const totalArticlesRead = allArticleIds.size;
    
//     // Calculate total reading time based on ALL interactions
//     // Each interaction (view, save, like, comment) counts as engagement
//     const totalInteractions = viewedArticles.length + savedArticles.length + likedArticles.length + commentedArticles.length;
    
//     // Estimate reading time: 3 minutes per interaction
//     const totalReadingTime = totalInteractions * 3;

//     // Reading streak calculation - use ANY interaction, not just views
//     const streak = await this.calculateReadingStreakFromAllInteractions(userId);

//     // Favorite category using ALL interactions
//     let favoriteCategory = 'None';
//     try {
//       const categoryResult = await this.prisma.$queryRaw<{category: string, count: number}[]>`
//         SELECT ac.name as category, COUNT(DISTINCT a.id) as count
//         FROM (
//           -- Combine all user interactions
//           SELECT "articleId" FROM "ArticleView" WHERE "userId" = ${userId}
//           UNION
//           SELECT "articleId" FROM "ArticleSave" WHERE "userId" = ${userId}
//           UNION
//           SELECT "articleId" FROM "ArticleLike" WHERE "userId" = ${userId}
//           UNION
//           SELECT "articleId" FROM "ArticleComment" WHERE "userId" = ${userId}
//         ) user_articles
//         JOIN "Article" a ON user_articles."articleId" = a.id
//         JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
//         GROUP BY ac.name
//         ORDER BY count DESC
//         LIMIT 1
//       `;
//       favoriteCategory = categoryResult[0]?.category || 'None';
//     } catch (error) {
//       this.logger.warn('Could not calculate favorite category:', error);
//     }

//     // Weekly progress - use ALL interactions from this week
//     const weekStart = new Date();
//     weekStart.setDate(weekStart.getDate() - weekStart.getDay());
//     weekStart.setHours(0, 0, 0, 0);

//     const weeklyProgress = await Promise.all([
//       this.prisma.articleView.count({ where: { userId, createdAt: { gte: weekStart } } }),
//       this.prisma.articleSave.count({ where: { userId, createdAt: { gte: weekStart } } }),
//       this.prisma.articleLike.count({ where: { userId, createdAt: { gte: weekStart } } }),
//       this.prisma.articleComment.count({ where: { userId, createdAt: { gte: weekStart } } }),
//     ]).then(counts => counts.reduce((sum, count) => sum + count, 0));

//     // Get saved and liked counts
//     const savedArticlesCount = await this.prisma.articleSave.count({ where: { userId } });
//     const likedArticlesCount = await this.prisma.articleLike.count({ where: { userId } });

//     console.log('📊 Final stats:', {
//       totalArticlesRead,
//       totalReadingTime,
//       weeklyProgress,
//       streak,
//       favoriteCategory,
//     });

//     return {
//       totalArticlesRead,
//       totalReadingTime,
//       averageReadingTime: totalArticlesRead > 0 ? Math.round(totalReadingTime / totalArticlesRead) : 0,
//       favoriteCategory,
//       readingStreak: streak,
//       weeklyGoal: 5, // Default weekly goal
//       weeklyProgress: Math.min(weeklyProgress, 5), // Cap at weekly goal
//       savedArticlesCount,
//       likedArticlesCount,
//     };
//   }

//   // Updated streak calculation that includes all interactions
//   private async calculateReadingStreakFromAllInteractions(userId: string): Promise<number> {
//     // Get interaction dates from ALL sources
//     const interactionDates = await this.prisma.$queryRaw<{date: Date}[]>`
//       SELECT DATE("createdAt") as date
//       FROM (
//         SELECT "createdAt" FROM "ArticleView" WHERE "userId" = ${userId}
//         UNION
//         SELECT "createdAt" FROM "ArticleSave" WHERE "userId" = ${userId}
//         UNION
//         SELECT "createdAt" FROM "ArticleLike" WHERE "userId" = ${userId}
//         UNION
//         SELECT "createdAt" FROM "ArticleComment" WHERE "userId" = ${userId}
//       ) all_interactions
//       GROUP BY DATE("createdAt")
//       ORDER BY date DESC
//     `;

//     if (interactionDates.length === 0) return 0;

//     let streak = 0;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let currentDate = today;
    
//     // Convert raw dates to proper Date objects
//     const dates = interactionDates.map(item => {
//       const date = new Date(item.date);
//       date.setHours(0, 0, 0, 0);
//       return date;
//     });

//     // Check for consecutive days
//     for (let i = 0; i < dates.length; i++) {
//       const readDate = dates[i];
      
//       // Check if this date matches our current streak
//       if (readDate.getTime() === currentDate.getTime()) {
//         streak++;
//         currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
//       } else if (readDate.getTime() < currentDate.getTime()) {
//         // Skip past dates we missed
//         continue;
//       } else {
//         break; // Streak broken
//       }
//     }

//     console.log('📅 Streak calculation:', {
//       totalDates: dates.length,
//       streak,
//       dates: dates.slice(0, 5).map(d => d.toISOString().split('T')[0]), // First 5 dates for debugging
//     });

//     return streak;
//   }
    

//     async getUserSavedArticles(userId: string, page: number = 1, limit: number = 20) {
//     const skip = (page - 1) * limit;

//     // First get the saved article IDs
//     const saves = await this.prisma.articleSave.findMany({
//       where: { userId },
//       select: { 
//         articleId: true,
//         createdAt: true,
//         language: true,
//       },
//       orderBy: { createdAt: 'desc' },
//       skip,
//       take: limit,
//     });

//     // Get total count
//     const total = await this.prisma.articleSave.count({ where: { userId } });

//     if (saves.length === 0) {
//       return {
//         data: [],
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasMore: total > skip + limit,
//       };
//     }

//     // Get the actual articles
//     const articleIds = saves.map(save => save.articleId);
//     const articles = await this.prisma.article.findMany({
//       where: {
//         id: { in: articleIds },
//         status: ArticleStatus.PUBLISHED,
//       },
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//         category: true,
//         _count: {
//           select: {
//             views: true,
//             likes: true,
//             comments: true,
//           },
//         },
//       },
//     });

//     // Map saves to articles
//     const savesWithArticles = saves.map(save => {
//       const article = articles.find(a => a.id === save.articleId);
//       if (!article) return null;

//       return {
//         id: save.articleId, // Use articleId as the ID for removal
//         savedAt: save.createdAt,
//         language: save.language,
//         article: {
//           ...article,
//           viewCount: article._count?.views || 0,
//           likeCount: article._count?.likes || 0,
//           commentCount: article._count?.comments || 0,
//           _count: undefined, // Remove the _count object
//         },
//       };
//     }).filter(item => item !== null);

//     return {
//       data: savesWithArticles,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       hasMore: total > skip + limit,
//     };
//   }

//   async getUserPremiumAccess(userId: string) {
//     // Get purchased articles
//     const purchasedAccess = await this.prisma.premiumAccess.findMany({
//       where: {
//         userId,
//         accessUntil: { gt: new Date() },
//       },
//       include: {
//         article: {
//           include: {
//             author: {
//               select: {
//                 id: true,
//                 name: true,
//                 username: true,
//                 picture: true,
//               },
//             },
//             category: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     // Get subscription articles (if user has active subscription)
//     const subscription = await this.prisma.userSubscription.findFirst({
//       where: {
//         userId,
//         status: 'ACTIVE',
//         currentPeriodEnd: { gt: new Date() },
//       },
//     });

//     let subscriptionArticles: any[] = [];
//     if (subscription) {
//       // Get all premium articles
//       subscriptionArticles = await this.prisma.article.findMany({
//         where: {
//           accessType: ContentAccess.PREMIUM,
//           status: ArticleStatus.PUBLISHED,
//         },
//         include: {
//           author: {
//             select: {
//               id: true,
//               name: true,
//               username: true,
//               picture: true,
//             },
//           },
//           category: true,
//         },
//         take: 50,
//       });
//     }

//     // Combine both types of access
//     const allAccess = [
//       ...purchasedAccess.map(access => ({
//         id: access.id,
//         articleId: access.articleId,
//         article: access.article,
//         accessType: 'PURCHASED' as const,
//         accessUntil: access.accessUntil,
//         createdAt: access.createdAt,
//       })),
//       ...subscriptionArticles.map(article => ({
//         id: `sub-${article.id}`,
//         articleId: article.id,
//         article,
//         accessType: 'SUBSCRIPTION' as const,
//         accessUntil: subscription?.currentPeriodEnd,
//         createdAt: subscription?.createdAt || new Date(),
//       })),
//     ];

//     return {
//       data: allAccess,
//       hasSubscription: !!subscription,
//       subscriptionEnd: subscription?.currentPeriodEnd,
//       purchasedCount: purchasedAccess.length,
//       subscriptionCount: subscriptionArticles.length,
//     };
//   }


//   async updateReadingProfile(userId: string, dto: UpdateReadingProfileDto) {
//     try {
//       const updateData: any = {};

//       console.log('Updating reading profile for user:', userId);
//       console.log('Received DTO:', dto);

//       // Map readingLevel to difficultyPreference
//       if (dto.readingLevel) {
//         updateData.difficultyPreference = dto.readingLevel.toLowerCase();
//       }

//       // Handle preferredReadingTime as session duration
//       if (dto.preferredReadingTime !== undefined) {
//         const time = Number(dto.preferredReadingTime);
//         if (time < 1 || time > 240) {
//           throw new BadRequestException('Preferred reading time must be between 1 and 240 minutes');
//         }
//         updateData.preferredSessionDuration = time;
//       }

      

//       // Handle categories (preferredCategories from frontend)
//       if (dto.preferredCategories && Array.isArray(dto.preferredCategories)) {
//         console.log('Looking for categories:', dto.preferredCategories);
        
//         const categories = await this.prisma.articleCategory.findMany({
//           where: {
//             name: {
//               in: dto.preferredCategories,
//             },
//           },
//         });

//         console.log('Found categories:', categories.map(c => ({ id: c.id, name: c.name })));

//         if (categories.length > 0) {
//           updateData.favoriteCategories = {
//             set: categories.map(cat => ({ id: cat.id })),
//           };
//         } else {
//           // Clear categories if none found
//           updateData.favoriteCategories = { set: [] };
//         }
//       }

//       // Handle interests (interests from frontend)
//       if (dto.interests) {
//         updateData.favoriteTags = dto.interests;
//       }

//       // Handle notification preferences
//       if (dto.notifyNewArticles !== undefined) {
//         updateData.notifyNewArticles = dto.notifyNewArticles;
//       }
      
//       if (dto.notifyTrending !== undefined) {
//         updateData.notifyTrending = dto.notifyTrending;
//       }
      
//       if (dto.notifyPersonalized !== undefined) {
//         updateData.notifyPersonalized = dto.notifyPersonalized;
//       }
      
//       if (dto.digestFrequency) {
//         updateData.digestFrequency = dto.digestFrequency;
//       }

//       console.log('Final update data:', updateData);

//       // Check if profile exists
//       const existingProfile = await this.prisma.userReadingProfile.findUnique({
//         where: { userId },
//       });

//       let result;
//       if (existingProfile) {
//         // Update existing profile
//         result = await this.prisma.userReadingProfile.update({
//           where: { userId },
//           data: updateData,
//           include: {
//             favoriteCategories: true,
//           },
//         });
//       } else {
//         // Create new profile
//         result = await this.prisma.userReadingProfile.create({
//           data: {
//             userId,
//             ...updateData,
//           },
//           include: {
//             favoriteCategories: true,
//           },
//         });
//       }

//       console.log('Profile updated successfully:', result);

//       // Format response to match frontend expectations
//       return {
//         success: true,
//         message: 'Reading profile updated successfully',
//         data: {
//           preferredCategories: result.favoriteCategories?.map(cat => cat.name) || [],
//           readingLevel: result.difficultyPreference ? result.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : undefined,
//           preferredReadingTime: result.preferredSessionDuration || undefined,
//           interests: result.favoriteTags || [],
//           notifyNewArticles: result.notifyNewArticles,
//           notifyTrending: result.notifyTrending,
//           notifyPersonalized: result.notifyPersonalized,
//           digestFrequency: result.digestFrequency,
//         },
//       };

//     } catch (error) {
//       console.error('Error updating reading profile:', error);
      
//       if (error.code === 'P2025' || error.code === 'P2016') {
//         // Profile doesn't exist, create it
//         return this.createReadingProfile(userId, dto);
//       }
      
//       throw error;
//     }
//   }

//   // Helper method to create reading profile
//   async createReadingProfile(userId: string, dto: UpdateReadingProfileDto) {
//     const createData: any = {
//       userId,
//       difficultyPreference: dto.readingLevel ? dto.readingLevel.toLowerCase() : 'intermediate',
//     };

//     if (dto.preferredReadingTime !== undefined) {
//       createData.preferredSessionDuration = Number(dto.preferredReadingTime);
//     }

//     if (dto.interests) {
//       createData.favoriteTags = dto.interests;
//     }

//     // Handle categories if provided
//     let categories: any[] = [];
//     if (dto.preferredCategories && Array.isArray(dto.preferredCategories)) {
//       categories = await this.prisma.articleCategory.findMany({
//         where: {
//           name: {
//             in: dto.preferredCategories,
//           },
//         },
//       });
//     }

//     const newProfile = await this.prisma.userReadingProfile.create({
//       data: {
//         ...createData,
//         favoriteCategories: {
//           connect: categories.map(cat => ({ id: cat.id })),
//         },
//       },
//       include: {
//         favoriteCategories: true,
//       },
//     });

//     return {
//       success: true,
//       message: 'Reading profile created successfully',
//       data: {
//         preferredCategories: newProfile.favoriteCategories?.map(cat => cat.name) || [],
//         readingLevel: newProfile.difficultyPreference ? newProfile.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : undefined,
//         preferredReadingTime: newProfile.preferredSessionDuration || undefined,
//         interests: newProfile.favoriteTags || [],
//         notifyNewArticles: newProfile.notifyNewArticles,
//         notifyTrending: newProfile.notifyTrending,
//         notifyPersonalized: newProfile.notifyPersonalized,
//         digestFrequency: newProfile.digestFrequency,
//       },
//     };
//   }

//   // Add this method to get reading profile
//   // In article.service.ts - update the getReadingProfile method
//   async getReadingProfile(userId: string) {
//     try {
//       const profile = await this.prisma.userReadingProfile.findUnique({
//         where: { userId },
//         include: {
//           favoriteCategories: true,
//         },
//       });

//       if (!profile) {
//         return {
//           success: true,
//           data: {
//             preferredCategories: [],
//             readingLevel: 'INTERMEDIATE',
//             preferredReadingTime: 15, // Default value
//             interests: [],
//             notifyNewArticles: true,
//             notifyTrending: true,
//             notifyPersonalized: true,
//             digestFrequency: 'weekly',
//           },
//         };
//       }

//       return {
//         success: true,
//         data: {
//           preferredCategories: profile.favoriteCategories?.map(cat => cat.name) || [],
//           readingLevel: profile.difficultyPreference ? 
//             profile.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : 
//             'INTERMEDIATE',
//           // Use preferredSessionDuration (Int) instead of preferredReadingTime (String)
//           preferredReadingTime: profile.preferredSessionDuration || 15,
//           interests: profile.favoriteTags || [],
//           notifyNewArticles: profile.notifyNewArticles,
//           notifyTrending: profile.notifyTrending,
//           notifyPersonalized: profile.notifyPersonalized,
//           digestFrequency: profile.digestFrequency,
//         },
//       };

//     } catch (error) {
//       console.error('Error getting reading profile:', error);
//       return {
//         success: false,
//         message: 'Failed to get reading profile',
//       };
//     }
//   }


//     async getUserAchievements(userId: string): Promise<{
//       achievements: any[];
//       unlockedCount: number;
//       totalPoints: number;
//     }> {
//     const userStats = await this.getUserReadingStats(userId);
    
//     // Define achievement criteria based on user stats
//     const achievements = [
//       {
//         id: 'article_explorer',
//         title: 'Article Explorer',
//         description: 'Read your first 10 articles',
//         icon: 'book',
//         badgeColor: '#3B82F6',
//         progress: Math.min(userStats.totalArticlesRead, 10),
//         totalRequired: 10,
//         unlocked: userStats.totalArticlesRead >= 10,
//         rarity: 'COMMON' as const,
//         category: 'READING' as const,
//         points: 50,
//         shareable: true
//       },
//       {
//         id: 'reading_marathon',
//         title: 'Reading Marathon',
//         description: 'Read for 100 hours total',
//         icon: 'clock',
//         badgeColor: '#10B981',
//         progress: Math.min(userStats.totalReadingTime, 100),
//         totalRequired: 100,
//         unlocked: userStats.totalReadingTime >= 100,
//         rarity: 'RARE' as const,
//         category: 'READING' as const,
//         points: 150,
//         shareable: true
//       },
//       {
//         id: 'trend_setter',
//         title: 'Trend Setter',
//         description: 'Read 5 trending articles',
//         icon: 'fire',
//         badgeColor: '#EF4444',
//         progress: await this.getTrendingArticlesRead(userId),
//         totalRequired: 5,
//         unlocked: (await this.getTrendingArticlesRead(userId)) >= 5,
//         rarity: 'COMMON' as const,
//         category: 'ENGAGEMENT' as const,
//         points: 100,
//         shareable: true
//       },
//       {
//         id: 'knowledge_seeker',
//         title: 'Knowledge Seeker',
//         description: 'Read articles from 10 different categories',
//         icon: 'compass',
//         badgeColor: '#8B5CF6',
//         progress: await this.getUniqueCategoriesRead(userId),
//         totalRequired: 10,
//         unlocked: (await this.getUniqueCategoriesRead(userId)) >= 10,
//         rarity: 'RARE' as const,
//         category: 'READING' as const,
//         points: 200,
//         shareable: true
//       },
//       {
//         id: 'weekly_warrior',
//         title: 'Weekly Warrior',
//         description: 'Read 7 days in a row',
//         icon: 'calendar',
//         badgeColor: '#06B6D4',
//         progress: userStats.readingStreak,
//         totalRequired: 7,
//         unlocked: userStats.readingStreak >= 7,
//         rarity: 'EPIC' as const,
//         category: 'MILESTONE' as const,
//         points: 350,
//         shareable: true
//       },
//       {
//         id: 'community_champion',
//         title: 'Community Champion',
//         description: 'Get 50 likes on your comments',
//         icon: 'heart',
//         badgeColor: '#EC4899',
//         progress: await this.getCommentLikes(userId),
//         totalRequired: 50,
//         unlocked: (await this.getCommentLikes(userId)) >= 50,
//         rarity: 'EPIC' as const,
//         category: 'COMMUNITY' as const,
//         points: 300,
//         shareable: true
//       },
//       {
//         id: 'premium_pioneer',
//         title: 'Premium Pioneer',
//         description: 'Subscribe to premium for 3 months',
//         icon: 'crown',
//         badgeColor: '#F59E0B',
//         progress: await this.getPremiumMonths(userId),
//         totalRequired: 3,
//         unlocked: (await this.getPremiumMonths(userId)) >= 3,
//         rarity: 'LEGENDARY' as const,
//         category: 'PREMIUM' as const,
//         points: 500,
//         shareable: true
//       },
//       {
//         id: 'article_connoisseur',
//         title: 'Article Connoisseur',
//         description: 'Save 25 articles to read later',
//         icon: 'bookmark',
//         badgeColor: '#6366F1',
//         progress: userStats.savedArticlesCount,
//         totalRequired: 25,
//         unlocked: userStats.savedArticlesCount >= 25,
//         rarity: 'COMMON' as const,
//         category: 'ENGAGEMENT' as const,
//         points: 75,
//         shareable: true
//       },
//       {
//         id: 'reading_enthusiast',
//         title: 'Reading Enthusiast',
//         description: 'Like 50 articles',
//         icon: 'heart',
//         badgeColor: '#EC4899',
//         progress: userStats.likedArticlesCount,
//         totalRequired: 50,
//         unlocked: userStats.likedArticlesCount >= 50,
//         rarity: 'COMMON' as const,
//         category: 'ENGAGEMENT' as const,
//         points: 100,
//         shareable: true
//       },
//       {
//         id: 'content_curator',
//         title: 'Content Curator',
//         description: 'Create reading lists with 20+ articles',
//         icon: 'list',
//         badgeColor: '#8B5CF6',
//         progress: await this.getSavedArticlesCount(userId),
//         totalRequired: 20,
//         unlocked: (await this.getSavedArticlesCount(userId)) >= 20,
//         rarity: 'RARE' as const,
//         category: 'ENGAGEMENT' as const,
//         points: 200,
//         shareable: true
//       }
//     ];

//     // Filter to only include achievements user has started or completed
//     const relevantAchievements = achievements.filter(ach => 
//       ach.progress > 0 || ach.unlocked
//     );

//     return {
//       achievements: relevantAchievements,
//       unlockedCount: relevantAchievements.filter(a => a.unlocked).length,
//       totalPoints: relevantAchievements
//         .filter(a => a.unlocked)
//         .reduce((sum, a) => sum + a.points, 0)
//     };
//   }

//   // Add this helper method:
//   private async getSavedArticlesCount(userId: string): Promise<number> {
//     return await this.prisma.articleSave.count({
//       where: { userId }
//     });
//   }
//   private async getTrendingArticlesRead(userId: string): Promise<number> {
//     const trendingViews = await this.prisma.articleView.count({
//       where: {
//         userId,
//         article: {
//           isTrending: true
//         }
//       }
//     });
//     return trendingViews;
//   }

//   private async getUniqueCategoriesRead(userId: string): Promise<number> {
//     const uniqueCategories = await this.prisma.$queryRaw<{count: number}[]>`
//       SELECT COUNT(DISTINCT a."categoryId") as count
//       FROM "ArticleView" av
//       JOIN "Article" a ON av."articleId" = a.id
//       WHERE av."userId" = ${userId}
//     `;
//     return uniqueCategories[0]?.count || 0;
//   }

//   private async getCommentLikes(userId: string): Promise<number> {
//     const commentLikes = await this.prisma.commentLike.count({
//       where: {
//         comment: {
//           userId
//         }
//       }
//     });
//     return commentLikes;
//   }

//   private async getPremiumMonths(userId: string): Promise<number> {
//     try {
//       const subscription = await this.prisma.userSubscription.findFirst({
//         where: {
//           userId,
//           status: 'ACTIVE'
//         },
//         select: {
//           createdAt: true,
//           currentPeriodStart: true, // You might want to use this instead
//           currentPeriodEnd: true
//         }
//       });
      
//       if (!subscription) return 0;
      
//       // Use currentPeriodStart if available, fallback to createdAt
//       const dateField = subscription.currentPeriodStart || subscription.createdAt;
      
//       if (!dateField) return 0;
      
//       // Parse the date
//       let startDate: Date;
      
//       if (dateField instanceof Date) {
//         startDate = dateField;
//       } else if (typeof dateField === 'string') {
//         startDate = new Date(dateField);
//       } else if (typeof dateField === 'number') {
//         startDate = new Date(dateField);
//       } else {
//         return 0;
//       }
      
//       // Validate the date
//       if (isNaN(startDate.getTime())) {
//         return 0;
//       }
      
//       const now = new Date();
//       const diffMs = now.getTime() - startDate.getTime();
//       const monthsActive = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
      
//       return Math.max(0, monthsActive); // Ensure non-negative
//     } catch (error) {
//       this.logger.error(`Error calculating premium months for user ${userId}:`, error);
//       return 0;
//     }
//   }


//   async getAchievementStats(userId: string): Promise<{
//     totalPoints: number;
//     unlockedAchievements: number;
//     totalAchievements: number;
//     nextMilestone: {
//       name: string;
//       pointsNeeded: number;
//       progress: number;
//     };
//     topCategories: Array<{
//       category: string;
//       count: number;
//       color: string;
//     }>;
//     recentUnlocks: any[];
//   }> {
//     const achievements = await this.getUserAchievements(userId);
//     const userStats = await this.getUserReadingStats(userId);
    
//     // Calculate next milestone
//     const totalPoints = achievements.totalPoints;
//     const milestones = [
//       { name: 'Beginner Reader', points: 0 },
//       { name: 'Active Reader', points: 500 },
//       { name: 'Advanced Reader', points: 1000 },
//       { name: 'Master Reader', points: 2000 },
//       { name: 'Legendary Scholar', points: 5000 }
//     ];
    
//     const currentMilestone = milestones
//       .reverse()
//       .find(m => totalPoints >= m.points) || milestones[0];
      
//     const nextMilestone = milestones.find(m => m.points > totalPoints) || milestones[milestones.length - 1];
    
//     const progress = nextMilestone 
//       ? Math.min(100, (totalPoints / nextMilestone.points) * 100)
//       : 100;
    
//     // Get top categories
//     const topCategories = await this.prisma.$queryRaw<{category: string, count: number}[]>`
//       SELECT ac.name as category, COUNT(DISTINCT av."articleId") as count
//       FROM "ArticleView" av
//       JOIN "Article" a ON av."articleId" = a.id
//       JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
//       WHERE av."userId" = ${userId}
//       GROUP BY ac.name
//       ORDER BY count DESC
//       LIMIT 4
//     `;
    
//     const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
    
//     return {
//       totalPoints,
//       unlockedAchievements: achievements.unlockedCount,
//       totalAchievements: achievements.achievements.length,
//       nextMilestone: {
//         name: nextMilestone.name,
//         pointsNeeded: nextMilestone.points - totalPoints,
//         progress
//       },
//       topCategories: topCategories.map((cat, index) => ({
//         category: cat.category,
//         count: cat.count,
//         color: colors[index % colors.length]
//       })),
//       recentUnlocks: achievements.achievements
//         .filter(a => a.unlocked)
//         .sort((a, b) => {
//           // Sort by most recently unlocked (you'd need to track unlock dates)
//           return -1; // Placeholder
//         })
//         .slice(0, 3)
//     };
//   }

//   async getRecentProfileActivity(userId: string, limit: number = 20): Promise<any[]> {
//     const activities = await this.prisma.$queryRaw<RawActivityItem[]>`
//       WITH article_views AS (
//         SELECT 
//           av.id,
//           'VIEW' as type,
//           av."articleId",
//           av."createdAt" as timestamp,
//           NULL::integer as duration,  -- Cast NULL to specific type
//           NULL::jsonb as metadata,    -- Cast NULL to jsonb
//           'viewed' as action
//         FROM "ArticleView" av
//         WHERE av."userId" = ${userId}
//       ),
//       article_likes AS (
//         SELECT 
//           al.id,
//           'LIKE' as type,
//           al."articleId",
//           al."createdAt" as timestamp,
//           NULL::integer as duration,
//           jsonb_build_object('likes', 1) as metadata,
//           'liked' as action
//         FROM "ArticleLike" al
//         WHERE al."userId" = ${userId}
//       ),
//       article_saves AS (
//         SELECT 
//           asv.id,
//           'SAVE' as type,
//           asv."articleId",
//           asv."createdAt" as timestamp,
//           NULL::integer as duration,
//           NULL::jsonb as metadata,    -- Cast NULL to jsonb
//           'saved' as action
//         FROM "ArticleSave" asv
//         WHERE asv."userId" = ${userId}
//       ),
//       article_comments AS (
//         SELECT 
//           ac.id,
//           'COMMENT' as type,
//           ac."articleId",
//           ac."createdAt" as timestamp,
//           NULL::integer as duration,
//           jsonb_build_object('comment', ac.content) as metadata,
//           'commented on' as action
//         FROM "ArticleComment" ac
//         WHERE ac."userId" = ${userId}
//       )
      
//       SELECT * FROM (
//         SELECT * FROM article_views
//         UNION ALL
//         SELECT * FROM article_likes
//         UNION ALL
//         SELECT * FROM article_saves
//         UNION ALL
//         SELECT * FROM article_comments
//       ) combined
//       ORDER BY timestamp DESC
//       LIMIT ${limit}
//     `;

//     // Get article details for each activity
//     const enrichedActivities = await Promise.all(
//       activities.map(async (activity) => {
//         const article = await this.prisma.article.findUnique({
//           where: { id: activity.articleId },
//           select: {
//             id: true,
//             title: true,
//             slug: true,
//             coverImage: true,
//             category: {
//               select: {
//                 name: true,
//                 color: true
//               }
//             }
//           }
//         });
        
//         return {
//           id: activity.id,
//           type: activity.type,
//           article,
//           timestamp: activity.timestamp,
//           duration: activity.duration,
//           metadata: activity.metadata 
//             ? (typeof activity.metadata === 'object' 
//                 ? activity.metadata 
//                 : JSON.parse(activity.metadata))
//             : null
//         };
//       })
//     );

//     return enrichedActivities;
//   }


//   async getReadingStats(userId: string): Promise<{
//     today: {
//       articlesRead: number;
//       readingTime: number;
//       likesGiven: number;
//       commentsMade: number;
//     };
//     week: {
//       streakDays: number;
//       totalArticles: number;
//       totalTime: number;
//       progress: number;
//     };
//     topCategories: Array<{
//       name: string;
//       count: number;
//       color: string;
//     }>;
//   }> {
//     const now = new Date();
//     const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const weekStart = new Date(todayStart);
//     weekStart.setDate(weekStart.getDate() - 7);
    
//     const [todayStats, weekStats, topCategories] = await Promise.all([
//       // Today's stats
//       this.prisma.$queryRaw<{
//         articlesRead: number;
//         readingTime: number;
//         likesGiven: number;
//         commentsMade: number;
//       }[]>`
//         SELECT 
//           COUNT(DISTINCT av."articleId") as "articlesRead",
//           COUNT(av.id) * 5 as "readingTime", -- Approximate 5 minutes per view
//           COUNT(DISTINCT al.id) as "likesGiven",
//           COUNT(DISTINCT ac.id) as "commentsMade"
//         FROM "ArticleView" av
//         LEFT JOIN "ArticleLike" al ON al."userId" = av."userId" 
//           AND al."createdAt" >= ${todayStart}
//         LEFT JOIN "ArticleComment" ac ON ac."userId" = av."userId" 
//           AND ac."createdAt" >= ${todayStart}
//         WHERE av."userId" = ${userId}
//           AND av."createdAt" >= ${todayStart}
//       `,
      
//       // This week's stats
//       this.prisma.$queryRaw<{
//         streakDays: number;
//         totalArticles: number;
//         totalTime: number;
//       }[]>`
//         WITH reading_days AS (
//           SELECT 
//             DATE("createdAt") as date,
//             COUNT(DISTINCT "articleId") as articles
//           FROM "ArticleView"
//           WHERE "userId" = ${userId}
//             AND "createdAt" >= ${weekStart}
//           GROUP BY DATE("createdAt")
//         )
//         SELECT 
//           COUNT(*) as "streakDays",
//           COALESCE(SUM(articles), 0) as "totalArticles",
//           COALESCE(SUM(articles) * 5, 0) as "totalTime"
//         FROM reading_days
//       `,
      
//       // Top categories this week
//       this.prisma.$queryRaw<{name: string, count: number}[]>`
//         SELECT 
//           ac.name,
//           COUNT(DISTINCT av."articleId") as count
//         FROM "ArticleView" av
//         JOIN "Article" a ON av."articleId" = a.id
//         JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
//         WHERE av."userId" = ${userId}
//           AND av."createdAt" >= ${weekStart}
//         GROUP BY ac.name
//         ORDER BY count DESC
//         LIMIT 4
//       `
//     ]);
    
//     const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    
//     return {
//       today: todayStats[0] || {
//         articlesRead: 0,
//         readingTime: 0,
//         likesGiven: 0,
//         commentsMade: 0
//       },
//       week: {
//         ...(weekStats[0] || { streakDays: 0, totalArticles: 0, totalTime: 0 }),
//         progress: Math.min(100, ((weekStats[0]?.totalArticles || 0) / 20) * 100) // 20 articles weekly goal
//       },
//       topCategories: topCategories.map((cat, index) => ({
//         name: cat.name,
//         count: cat.count,
//         color: colors[index % colors.length]
//       }))
//     };
//   }


// // In article.service.ts, add this method:
// async calculateCompletionRate(userId: string): Promise<number> {
//   try {
//     // Use UserEngagement table since you don't have readingHistory
//     const engagements = await this.prisma.userEngagement.findMany({
//       where: { 
//         userId: userId,
//         // Look for any engagement that indicates reading
//         OR: [
//           { action: 'VIEW' },
//           { action: 'READ_COMPLETE' },
//           { action: 'LIKE' },
//           { action: 'COMMENT' },
//           { action: 'SAVE' }
//         ]
//       },
//       select: {
//         articleId: true,
//         action: true,
//       }
//     });

//     if (engagements.length === 0) return 0;

//     // Group by article to see which ones were interacted with
//     const articleInteractions = new Map<string, string[]>();
    
//     engagements.forEach((engagement: any) => {
//       const articleId = engagement.articleId;
//       if (!articleId) return;
      
//       if (!articleInteractions.has(articleId)) {
//         articleInteractions.set(articleId, []);
//       }
//       articleInteractions.get(articleId)!.push(engagement.action);
//     });

//     // Calculate completion rate based on engagement patterns
//     const articles = Array.from(articleInteractions.keys());
//     let totalCompletionScore = 0;

//     articles.forEach(articleId => {
//       const actions = articleInteractions.get(articleId) || [];
      
//       // Score each article based on engagement depth
//       let articleScore = 0;
      
//       if (actions.includes('READ_COMPLETE')) {
//         articleScore = 1.0; // 100% completed if marked as complete
//       } else if (actions.includes('COMMENT')) {
//         articleScore = 0.9; // 90% likely completed if commented
//       } else if (actions.includes('LIKE')) {
//         articleScore = 0.8; // 80% likely completed if liked
//       } else if (actions.includes('SAVE')) {
//         articleScore = 0.7; // 70% likely completed if saved
//       } else if (actions.includes('VIEW')) {
//         articleScore = 0.3; // 30% likely completed if only viewed
//       }
      
//       totalCompletionScore += articleScore;
//     });

//     const averageCompletionRate = totalCompletionScore / articles.length;
//     return Math.round(averageCompletionRate * 100);
//   } catch (error) {
//     console.log('Error calculating completion rate:', error);
//     return 0;
//   }
// }

//   async getArticlesWithAdvancedFilters(options: {
//     page?: number;
//     limit?: number;
//     category?: string | string[];
//     tag?: string;
//     status?: ArticleStatus;
//     accessType?: ContentAccess | 'all';
//     featured?: boolean;
//     trending?: boolean;
//     language?: string;
//     authorId?: string;
//     search?: string;
//     sort?: string;
//     readingTime?: 'short' | 'medium' | 'long' | 'any';
//     minRating?: number;
//     minViews?: number;
//     minLikes?: number;
//     contentType?: string;
//     readingLevel?: string;
//     authors?: string[];
//     languages?: string[];
//     tags?: string[];
//     categories?: string[];
    
//   }): Promise<any> { // Change return type to any or create proper interface
//     const page = options.page || 1;
//     const limit = Math.min(options.limit || 24, 100);
//     const skip = (page - 1) * limit;
//     const uiLanguage = options.language || 'en'; // Default to English

//     const where: any = { status: ArticleStatus.PUBLISHED };

//     // Handle category filter (single or array)
//     if (options.category) {
//       if (Array.isArray(options.category)) {
//         where.category = { slug: { in: options.category } };
//       } else {
//         where.category = { slug: options.category };
//       }
//     }

//     // Handle access type filter
//     if (options.accessType && options.accessType !== 'all') {
//       where.accessType = options.accessType as ContentAccess;
//     }

//     // Handle reading time filter
//     if (options.readingTime && options.readingTime !== 'any') {
//       const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
//       if (readingTimeCondition) {
//         where.readingTime = readingTimeCondition;
//       }
//     }

//     // Handle multiple authors filter
//     if (options.authors && options.authors.length > 0) {
//       where.authorId = { in: options.authors };
//     }

//     // Handle multiple languages filter
//     if (options.languages && options.languages.length > 0) {
//       if (options.languages.includes('en')) {
//         // If English is included, we need to include all articles (English original)
//         // and also check translations for other languages
//         const otherLanguages = options.languages.filter(lang => lang !== 'en');
//         if (otherLanguages.length > 0) {
//           where.OR = [
//             { availableLanguages: { hasSome: otherLanguages } },
//             { language: { in: otherLanguages } }
//           ];
//         }
//       } else {
//         where.OR = [
//           { availableLanguages: { hasSome: options.languages } },
//           { language: { in: options.languages } }
//         ];
//       }
//     }

//     // Handle multiple tags filter
//     if (options.tags && options.tags.length > 0) {
//       where.tags = { hasSome: options.tags };
//     }

//     // Handle multiple categories filter
//     if (options.categories && options.categories.length > 0) {
//       where.category = { slug: { in: options.categories } };
//     }

//     // Handle search
//     if (options.search) {
//       where.OR = [
//         { title: { contains: options.search, mode: 'insensitive' } },
//         { excerpt: { contains: options.search, mode: 'insensitive' } },
//         { plainText: { contains: options.search, mode: 'insensitive' } },
//       ];
//     }

//     // Handle featured and trending
//     if (options.featured !== undefined) {
//       where.isFeatured = options.featured;
//     }

//     if (options.trending !== undefined) {
//       where.isTrending = options.trending;
//     }

//     // Handle author filter
//     if (options.authorId) {
//       where.authorId = options.authorId;
//     }

//     // Get sort order
//     const orderBy = this.getSortOrder(options.sort || 'recent');

//     // First get count
//     const total = await this.prisma.article.count({ where });

//     // Then get articles with separate counts
//     const articles = await this.prisma.article.findMany({
//     where,
//     skip,
//     take: limit,
//     orderBy,
//     include: {
//       category: {
//         select: {
//           id: true,
//           name: true,
//           slug: true,
//           icon: true,
//           color: true,
//           description: true,
//         },
//       },
//       author: {
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//         },
//       },
//       // ADD THIS: Include translations
//       translations: {
//         where: { 
//           language: uiLanguage,
//           status: TranslationStatus.COMPLETED 
//         },
//         select: {
//           title: true,
//           excerpt: true,
//         },
//       },
//     },
//   });

//   // Get counts for each article separately
//   const articlesWithCounts = await Promise.all(
//     articles.map(async (article) => {
//       const [commentCount, likeCount, viewCount, saveCount] = await Promise.all([
//         this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
//         this.prisma.articleLike.count({ where: { articleId: article.id } }),
//         this.prisma.articleView.count({ where: { articleId: article.id } }),
//         this.prisma.articleSave.count({ where: { articleId: article.id } }),
//       ]);

//       // Get translation
//       const translation = article.translations?.[0];

//       return {
//         ...article,
//         // Apply translation
//         title: translation?.title || article.title,
//         excerpt: translation?.excerpt || article.excerpt,
//         commentCount,
//         likeCount,
//         viewCount,
//         saveCount,
//         isPremium: article.accessType === ContentAccess.PREMIUM,
//         hasTranslation: !!translation,
//         displayLanguage: uiLanguage,
//         // Remove translations array
//         translations: undefined,
//       };
//     })
//   );

//     return {
//       articles: articlesWithCounts,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       hasMore: total > skip + limit,
//     };
//   }
//   public async getAllAuthors(): Promise<any[]> {
//     try {
//       const authors = await this.prisma.user.findMany({
//         where: {
//           articles: {
//             some: {
//               status: ArticleStatus.PUBLISHED
//             }
//           }
//         },
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           picture: true,
//           // Remove bio if it doesn't exist in your User model
//           _count: {
//             select: {
//               articles: {
//                 where: { status: ArticleStatus.PUBLISHED }
//               }
//             }
//           }
//         },
//         orderBy: {
//           articles: {
//             _count: 'desc'
//           }
//         },
//         take: 50,
//       });

//       return authors.map(author => ({
//         id: author.id,
//         name: author.name,
//         username: author.username,
//         picture: author.picture,
//         articleCount: author._count.articles,
//       }));
//     } catch (error) {
//       this.logger.error('Error getting authors:', error);
//       return [];
//     }
//   }


//   // Add these methods to the ArticleService class

//   public getReadingTimeCondition(readingTime: string): any {
//     switch (readingTime) {
//       case 'short':
//         return { lte: 10 }; // ≤10 minutes
//       case 'medium':
//         return { gt: 10, lte: 20 }; // 10-20 minutes
//       case 'long':
//         return { gt: 20 }; // 20+ minutes
//       default:
//         return undefined;
//     }
//   }

//   public getSortOrder(sort: string): any {
//     switch (sort) {
//       case 'recent':
//         return { publishedAt: 'desc' };
//       case 'popular':
//         return { viewCount: 'desc' };
//       case 'trending':
//         return { trendingScore: 'desc' };
//       case 'reading_time':
//         return { readingTime: 'asc' };
//       case 'title_asc':
//         return { title: 'asc' };
//       case 'title_desc':
//         return { title: 'desc' };
//       case 'most_commented':
//         return { commentCount: 'desc' };
//       case 'most_saved':
//         return { saveCount: 'desc' };
//       case 'most_liked':
//         return { likeCount: 'desc' };
//       default:
//         return { publishedAt: 'desc' };
//     }
//   }

//   public async getAllTags(): Promise<{ name: string; count: number }[]> {
//     try {
//       // Get all articles with their tags
//       const articles = await this.prisma.article.findMany({
//         where: { status: ArticleStatus.PUBLISHED },
//         select: { tags: true },
//       });

//       // Count tag occurrences
//       const tagCounts: Record<string, number> = {};
//       articles.forEach(article => {
//         if (article.tags && Array.isArray(article.tags)) {
//           article.tags.forEach(tag => {
//             if (tag) {
//               tagCounts[tag] = (tagCounts[tag] || 0) + 1;
//             }
//           });
//         }
//       });

//       // Convert to array and sort by count
//       return Object.entries(tagCounts)
//         .map(([name, count]) => ({ name, count }))
//         .sort((a, b) => b.count - a.count);
//     } catch (error) {
//       this.logger.error('Error getting tags:', error);
//       return [];
//     }
//   }

//   public async getArticleStats(): Promise<any> {
//     const [
//       totalArticles,
//       freeArticles,
//       premiumArticles,
//       featuredArticles,
//       trendingArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       totalSaves
//     ] = await Promise.all([
//       // Total articles
//       this.prisma.article.count({ 
//         where: { status: ArticleStatus.PUBLISHED } 
//       }),
      
//       // Free articles
//       this.prisma.article.count({
//         where: { 
//           status: ArticleStatus.PUBLISHED,
//           accessType: ContentAccess.FREE 
//         },
//       }),
      
//       // Premium articles
//       this.prisma.article.count({
//         where: { 
//           status: ArticleStatus.PUBLISHED,
//           accessType: ContentAccess.PREMIUM 
//         },
//       }),
      
//       // Featured articles
//       this.prisma.article.count({
//         where: { 
//           status: ArticleStatus.PUBLISHED,
//           isFeatured: true 
//         },
//       }),
      
//       // Trending articles
//       this.prisma.article.count({
//         where: { 
//           status: ArticleStatus.PUBLISHED,
//           isTrending: true 
//         },
//       }),
      
//       // Total views
//       this.prisma.articleView.count(),
      
//       // Total likes
//       this.prisma.articleLike.count(),
      
//       // Total comments
//       this.prisma.articleComment.count(),
      
//       // Total saves
//       this.prisma.articleSave.count(),
//     ]);

//     return {
//       totalArticles,
//       freeArticles,
//       premiumArticles,
//       featuredArticles,
//       trendingArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       totalSaves,
//       averageRating: 4.5, // You'll need to implement ratings
//     };
//   }



//   public getArticlePreview(article: any) {
//     // Simple preview version without full content
//     return {
//       id: article.id,
//       slug: article.slug,
//       title: article.title,
//       excerpt: article.excerpt,
//       preview: article.excerpt?.substring(0, 200) + (article.excerpt?.length > 200 ? '...' : ''),
//       category: article.category,
//       tags: article.tags,
//       accessType: article.accessType,
//       coinPrice: article.coinPrice,
//       author: article.author,
//       coverImage: article.coverImage,
//       readingTime: article.readingTime,
//       status: article.status,
//       isFeatured: article.isFeatured,
//       isTrending: article.isTrending,
//       viewCount: article.viewCount || 0,
//       likeCount: article.likeCount || 0,
//       commentCount: article.commentCount || 0,
//       publishedAt: article.publishedAt,
//       availableLanguages: article.availableLanguages || [],
//       isPreview: true,
//       requiresPurchase: article.accessType === ContentAccess.PREMIUM,
//       createdAt: article.createdAt,
//       updatedAt: article.updatedAt,
//     };
//   }


//   // Add to the existing class
//   async getPublicUserReadingStats(userId: string) {
//     try {
//       // This is the same as getUserReadingStats but might have different privacy rules
//       return await this.getUserReadingStats(userId);
//     } catch (error) {
//       this.logger.error(`Failed to get public reading stats for user ${userId}:`, error);
//       return null;
//     }
//   }

//   async getPublicReadingProfile(userId: string) {
//     try {
//       const result = await this.getReadingProfile(userId);
//       if (result.success) {
//         return result.data;
//       }
//       return null;
//     } catch (error) {
//       this.logger.error(`Failed to get public reading profile for user ${userId}:`, error);
//       return null;
//     }
//   }

//   async getPublicUserAchievements(userId: string) {
//     try {
//       const achievements = await this.getUserAchievements(userId);
//       // Return only unlocked achievements for public view
//       return {
//         ...achievements,
//         achievements: achievements.achievements.filter(a => a.unlocked),
//       };
//     } catch (error) {
//       this.logger.error(`Failed to get public achievements for user ${userId}:`, error);
//       return null;
//     }
//   }

//   async getUserPublishedArticles(userId: string, page: number = 1, limit: number = 5) {
//     return this.listArticles({
//       authorId: userId,
//       status: ArticleStatus.PUBLISHED,
//       page,
//       limit,
//     });
//   }
// }




import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { 
  CreateArticleDto, 
  UpdateArticleDto, 
  CommentDto 
} from './dto/article.dto';
import { 
  UpdateReadingProfileDto 
} from './dto/recommendation.dto';  
import {  
  ContentAccess, 
  TransactionSource, 
  UsageAction, 
  TranslationStatus 
} from '@prisma/client';
import { slugify } from '../auth/utils/slugify';
import { EngagementService } from './engagement.service';
import { TranslationService } from './translation.service';
import { NotificationService } from '../notification/notification.service';

enum ArticleStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED'
}


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
    private notificationService: NotificationService,
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

  // FIX: Use status from DTO, but validate based on user role
  let finalStatus = dto.status || ArticleStatus.DRAFT;
  
  // Only allow publishing if user is admin
  if (finalStatus === ArticleStatus.PUBLISHED && 
      !(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
    finalStatus = ArticleStatus.DRAFT;
  }
  
  // Only allow scheduling if user is admin
  if (finalStatus === ArticleStatus.SCHEDULED && 
      !(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
    finalStatus = ArticleStatus.DRAFT;
  }

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
      // FIX: Use the calculated finalStatus
      status: finalStatus,
      publishedAt: finalStatus === ArticleStatus.PUBLISHED ? new Date() : null,
      scheduledFor: finalStatus === ArticleStatus.SCHEDULED ? dto.scheduledFor : null,

      isFeatured: dto.isFeatured || false,
      isTrending: dto.isTrending || false,
      isEditorPick: dto.isEditorPick || false,
      isPopular: dto.isPopular || false,
      featuredRanking: dto.featuredRanking || 3,
      trendingScore: dto.trendingScore || 50,
      contentType: dto.contentType || 'STANDARD',
      readingLevel: dto.readingLevel || 'INTERMEDIATE',
      timeToRead: dto.timeToRead || 5,
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
  if (finalStatus === ArticleStatus.PUBLISHED && 
      dto.autoTranslate !== false && 
      dto.targetLanguages && 
      dto.targetLanguages.length > 0) {
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

//  async getArticle(slug: string, userId?: string, language?: string) {
//   console.log('🔍 Service getArticle called:', { slug, language, userId });
  
//   try {
//     // First, get the basic article to check if it exists
//     const basicArticle = await this.prisma.article.findUnique({
//       where: { slug },
//       select: {
//         id: true,
//         slug: true,
//         status: true,
//         accessType: true,
//         authorId: true,
//       },
//     });

//     if (!basicArticle) {
//       console.log('❌ Article not found in database for slug:', slug);
//       throw new NotFoundException('Article not found');
//     }

//     // Check article status and user access
//     if (basicArticle.status !== ArticleStatus.PUBLISHED && userId) {
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: { role: true, id: true },
//       });

//       const canAccess = user && (
//         basicArticle.authorId === user.id ||
//         user.role === 'ADMIN' ||
//         user.role === 'SUPER_ADMIN'
//       );

//       if (!canAccess) {
//         throw new ForbiddenException('You do not have access to this article');
//       }
//     } else if (basicArticle.status !== ArticleStatus.PUBLISHED) {
//       throw new ForbiddenException('This article is not published');
//     }

//     // ========== PREMIUM ACCESS CHECK ==========
//     if (basicArticle.accessType === ContentAccess.PREMIUM && userId) {
//       const hasPremiumAccess = await this.prisma.premiumAccess.findFirst({
//         where: {
//           userId,
//           articleId: basicArticle.id,
//           accessUntil: { gt: new Date() }
//         },
//       });

//       const isAuthor = basicArticle.authorId === userId;
      
//       const hasSubscription = await this.prisma.userSubscription.findFirst({
//         where: {
//           userId,
//           status: 'ACTIVE',
//           currentPeriodEnd: { gt: new Date() },
//         },
//       });

//       console.log('💰 Premium access check:', {
//         userId,
//         articleId: basicArticle.id,
//         hasPremiumAccess: !!hasPremiumAccess,
//         isAuthor,
//         hasSubscription: !!hasSubscription,
//       });

//       if (!hasPremiumAccess && !isAuthor && !hasSubscription) {
//         console.log('🔒 User does not have access, returning preview');
//         // Fetch full article for preview
//         const fullArticle = await this.prisma.article.findUnique({
//           where: { slug },
//           include: {
//             category: true,
//             author: {
//               select: {
//                 id: true,
//                 name: true,
//                 username: true,
//                 picture: true,
//                 email: true,
//               },
//             },
//           },
//         });
        
//         if (!fullArticle) {
//           throw new NotFoundException('Article not found');
//         }
        
//         return this.getPreviewVersion(fullArticle);
//       }
//     }

//     // ========== FETCH FULL ARTICLE WITH TRANSLATION ==========
    
//     // Define translation type
//     type ArticleTranslationType = {
//       id: string;
//       title: string;
//       excerpt: string;
//       content: any;
//       plainText: string | null;
//       metaTitle: string | null;
//       metaDescription: string | null;
//       keywords: string[];
//       coverImage?: string | null;
//       qualityScore: number | null;
//       confidence: number | null;
//       needsReview: boolean;
//       language: string;
//     };

//     // Get translation if requested
//     let articleTranslation: ArticleTranslationType | null = null;
    
//     if (language && language !== 'en') {
//       console.log(`🌐 Looking for translation in ${language}`);
      
//       // Get translation separately
//       const translationResult = await this.prisma.articleTranslation.findFirst({
//         where: { 
//           articleId: basicArticle.id,
//           language, 
//           status: 'COMPLETED' 
//         },
//       });
      
//       if (translationResult) {
//         articleTranslation = translationResult as ArticleTranslationType;
//       }
//     }

//     // Fetch the full article
//     const article = await this.prisma.article.findUnique({
//       where: { slug },
//       include: {
//         category: true,
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!article) {
//       throw new NotFoundException('Article not found');
//     }

//     console.log('📄 Article loaded:', {
//       articleId: article.id,
//       title: article.title,
//       hasTranslation: !!articleTranslation,
//       language: language || 'en'
//     });

//     // ========== CRITICAL FIX: Get ALL Available Languages ==========
//     console.log('🌐 Starting available languages calculation for article:', article.id);
    
//     // Get ALL completed translations for this article
//     const allTranslations = await this.prisma.articleTranslation.findMany({
//       where: {
//         articleId: article.id,
//         status: TranslationStatus.COMPLETED,
//       },
//       select: {
//         language: true,
//         qualityScore: true,
//         confidence: true,
//       },
//     });

//     console.log('📊 Found translations:', {
//       count: allTranslations.length,
//       languages: allTranslations.map(t => t.language)
//     });

//     // Create a Set to store all unique languages
//     const allLanguagesSet = new Set<string>();
    
//     // 1. Always include English (original language)
//     allLanguagesSet.add('en');
    
//     // 2. Add languages from the article's availableLanguages array
//     if (article.availableLanguages && Array.isArray(article.availableLanguages)) {
//       article.availableLanguages.forEach(lang => {
//         if (lang && lang.trim() !== '') {
//           allLanguagesSet.add(lang);
//         }
//       });
//     }
    
//     // 3. Add languages from ArticleTranslation table
//     allTranslations.forEach(translation => {
//       if (translation.language && translation.language.trim() !== '') {
//         allLanguagesSet.add(translation.language);
//       }
//     });

//     // Convert Set to sorted array
//     const allAvailableLanguages = Array.from(allLanguagesSet).sort();
    
//     console.log('✅ Final available languages:', allAvailableLanguages);

//     // Update article's availableLanguages if needed (for consistency)
//     const currentArticleLanguages = article.availableLanguages?.sort() || [];
//     const shouldUpdate = JSON.stringify(currentArticleLanguages) !== JSON.stringify(allAvailableLanguages);
    
//     if (shouldUpdate) {
//       console.log('🔄 Updating article availableLanguages:', {
//         old: currentArticleLanguages,
//         new: allAvailableLanguages
//       });
      
//       try {
//         await this.prisma.article.update({
//           where: { id: article.id },
//           data: {
//             availableLanguages: allAvailableLanguages,
//           },
//         });
//         article.availableLanguages = allAvailableLanguages;
//       } catch (updateError) {
//         console.warn('⚠️ Failed to update availableLanguages:', updateError.message);
//       }
//     }

//     // ========== IMAGE URL TRANSFORMATION ==========
//     const transformImageUrl = (url: string | undefined | null): string => {
//       if (!url || url.trim() === '') return '';
      
//       const serverUrl = 'http://localhost:3000';
      
//       if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
//         return url;
//       }
      
//       if (url.startsWith('/')) {
//         return `${serverUrl}${url}`;
//       }
      
//       return `${serverUrl}/uploads/articles/${url}`;
//     };

//     if (article.coverImage) {
//       article.coverImage = transformImageUrl(article.coverImage);
//     }
    
//     if (article.author?.picture) {
//       article.author.picture = transformImageUrl(article.author.picture);
//     }

//     // Transform content URLs
//     const transformContentUrls = (content: any): any => {
//       if (!content) return content;
      
//       const serverUrl = 'http://localhost:3000';
      
//       if (typeof content === 'string') {
//         return content
//           .replace(/src="(\/uploads\/[^"]+)"/g, `src="${serverUrl}$1"`)
//           .replace(/src=(\/uploads\/[^"'\s>]+)/g, `src="${serverUrl}$1"`);
//       }
      
//       if (typeof content === 'object' && content.type === 'doc') {
//         const contentCopy = JSON.parse(JSON.stringify(content));
        
//         const fixImagesInContent = (node: any) => {
//           if (node.type === 'image' && node.attrs?.src) {
//             node.attrs.src = transformImageUrl(node.attrs.src);
//           }
          
//           if (node.content && Array.isArray(node.content)) {
//             node.content.forEach(fixImagesInContent);
//           }
//         };
        
//         if (contentCopy.content) {
//           contentCopy.content.forEach(fixImagesInContent);
//         }
        
//         return contentCopy;
//       }
      
//       return content;
//     };

//     article.content = transformContentUrls(article.content);

//     // ========== TRACK ENGAGEMENT ==========
//     if (userId && !this.isPreviewVersion(article)) {
//       try {
//         await this.engagementService.trackView(userId, article.id, language || 'en');
//         await this.engagementService.trackEngagement(userId, article.id, 'VIEW');
//       } catch (error) {
//         console.warn(`⚠️ Failed to track engagement for article ${article.id}:`, error.message);
//       }
//     }

//     // ========== HANDLE TRANSLATION REQUEST ==========
//     if (language && language !== 'en' && articleTranslation) {
//       console.log(`🌐 Processing translation to ${language}`);
      
//       // Transform translation URLs if needed
//       let transformedCoverImage = articleTranslation.coverImage 
//         ? transformImageUrl(articleTranslation.coverImage) 
//         : article.coverImage;
      
//       let transformedContent = articleTranslation.content 
//         ? transformContentUrls(articleTranslation.content) 
//         : article.content;
      
//       // Create merged article with translation
//       const translatedArticle = {
//         ...article,
//         // Override with translated fields
//         title: articleTranslation.title || article.title,
//         excerpt: articleTranslation.excerpt || article.excerpt,
//         content: transformedContent,
//         plainText: articleTranslation.plainText || article.plainText,
//         metaTitle: articleTranslation.metaTitle || article.metaTitle,
//         metaDescription: articleTranslation.metaDescription || article.metaDescription,
//         keywords: articleTranslation.keywords?.length > 0 ? articleTranslation.keywords : article.keywords,
//         coverImage: transformedCoverImage,
//         // Add translation metadata
//         isTranslated: true,
//         translationLanguage: language,
//         translationQuality: articleTranslation.qualityScore,
//         translationConfidence: articleTranslation.confidence,
//         translationNeedsReview: articleTranslation.needsReview,
//         // Use the ALL languages we calculated
//         availableLanguages: allAvailableLanguages,
//       };
      
//       console.log('✅ Returning translated article in', language);
//       return translatedArticle;
//     }

//     // ========== RETURN ORIGINAL ARTICLE ==========
//     console.log('✅ Returning original article in English');
    
//     return {
//       ...article,
//       availableLanguages: allAvailableLanguages,
//       language: language || 'en',
//       isTranslated: false,
//     };
    
//   } catch (error) {
//     console.error('❌ Error in getArticle:', error);
    
//     if (error instanceof NotFoundException || 
//         error instanceof ForbiddenException) {
//       throw error;
//     }
    
//     throw new BadRequestException(`Failed to load article: ${error.message}`);
//   }
// }

async getArticle(slug: string, userId?: string, language?: string) {
  console.log('🔍 Service getArticle called:', { slug, language, userId });
  console.log('🔍 ========== getArticle START ==========');
  console.log('📋 Input:', { slug, language, userId });
  console.log('🕒 Timestamp:', new Date().toISOString());

  try {
    // First, get the basic article to check if it exists
    const basicArticle = await this.prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        status: true,
        accessType: true,
        authorId: true,
      },
    });

    if (!basicArticle) {
      console.log('❌ Article not found in database for slug:', slug);
      throw new NotFoundException('Article not found');
    }

    // Check article status and user access
    if (basicArticle.status !== ArticleStatus.PUBLISHED && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, id: true },
      });

      const canAccess = user && (
        basicArticle.authorId === user.id ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN'
      );

      if (!canAccess) {
        throw new ForbiddenException('You do not have access to this article');
      }
    } else if (basicArticle.status !== ArticleStatus.PUBLISHED) {
      throw new ForbiddenException('This article is not published');
    }

    // ========== PREMIUM ACCESS CHECK ==========
    if (basicArticle.accessType === ContentAccess.PREMIUM && userId) {
      const hasPremiumAccess = await this.prisma.premiumAccess.findFirst({
        where: {
          userId,
          articleId: basicArticle.id,
          accessUntil: { gt: new Date() }
        },
      });

      const isAuthor = basicArticle.authorId === userId;
      
      const hasSubscription = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() },
        },
      });

      console.log('💰 Premium access check:', {
        userId,
        articleId: basicArticle.id,
        hasPremiumAccess: !!hasPremiumAccess,
        isAuthor,
        hasSubscription: !!hasSubscription,
      });

      if (!hasPremiumAccess && !isAuthor && !hasSubscription) {
        console.log('🔒 User does not have access, returning preview');
        // Fetch full article for preview with proper types
        const fullArticle = await this.prisma.article.findUnique({
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
            translations: {
              where: { status: TranslationStatus.COMPLETED },
              select: {
                language: true,
                title: true,
                excerpt: true,
              },
            },
          },
        });
        
        if (!fullArticle) {
          throw new NotFoundException('Article not found');
        }
        
        return this.getPreviewVersion(fullArticle);
      }
    }

    // ========== FETCH FULL ARTICLE WITH TRANSLATIONS ==========
    
    // Define the type for our article query
    type ArticleWithRelations = any; // We'll use 'any' to avoid complex type issues
    
    // Fetch the full article WITH translations included
  const article: ArticleWithRelations = await this.prisma.article.findUnique({
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
        translations: {
          where: { status: TranslationStatus.COMPLETED },
          select: {
            id: true,
            language: true,
            title: true,
            excerpt: true,
            content: true,
            plainText: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
            qualityScore: true,
            confidence: true,
            needsReview: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // ========== ADD EXTENSIVE DEBUG LOGGING HERE ==========
    console.log('📊 Article loaded - RAW DATA:', {
      articleId: article.id,
      originalTitle: article.title,
      originalExcerpt: article.excerpt?.substring(0, 100),
      hasTranslations: !!(article as any).translations,
      translationsCount: (article as any).translations?.length || 0,
      allTranslations: (article as any).translations?.map((t: any) => ({
        language: t.language,
        title: t.title?.substring(0, 50),
        excerpt: t.excerpt?.substring(0, 50)
      })) || 'none',
      requestedLanguage: language,
      currentLocaleFromParam: language
    });

    // Check what languages are available
    const allTranslations = (article as any).translations || [];
    console.log('🌐 Available translation languages:', allTranslations.map((t: any) => t.language));
    
    // Check specifically for French
    const frenchTranslations = allTranslations.filter((t: any) => 
      t.language === 'fr' || t.language === 'fr-FR'
    );
    console.log('🇫🇷 French translations found:', frenchTranslations.length);
    if (frenchTranslations.length > 0) {
      console.log('🇫🇷 French translation details:', frenchTranslations.map((t: any) => ({
        language: t.language,
        title: t.title,
        hasTitle: !!t.title,
        hasExcerpt: !!t.excerpt
      })));
    }

    console.log('📄 Article loaded:', {
      articleId: article.id,
      title: article.title,
      translationsCount: (article as any).translations?.length || 0,
      translations: (article as any).translations?.map((t: any) => ({ 
        language: t.language, 
        title: t.title?.substring(0, 30) 
      })),
    });

    // Cast to any to access translations safely
    const articleAny = article as any;
    const translationsArray = articleAny.translations || [];

    // ========== FORMAT TRANSLATIONS FOR FRONTEND ==========
    // Convert translations array to the format expected by frontend
    let formattedTranslations: Record<string, { title: string; excerpt: string }> = {};
    
    if (translationsArray && Array.isArray(translationsArray)) {
      translationsArray.forEach((translation: any) => {
        if (translation.language && translation.title) {
          formattedTranslations[translation.language] = {
            title: translation.title,
            excerpt: translation.excerpt || ''
          };
        }
      });
    }

    console.log('🔤 Formatted translations:', {
      keys: Object.keys(formattedTranslations),
      hasFrench: !!formattedTranslations['fr'],
      frenchTitle: formattedTranslations['fr']?.title
    });

    // ========== HANDLE LANGUAGE SELECTION ==========
    let finalLanguage = 'en';
    let selectedTranslation: any = null;

    if (language && language !== 'en') {
      console.log(`🌐 Looking for translation in ${language}`);
      
      // Try to find translation for requested language
      const translationForLanguage = translationsArray.find((t: any) => 
        t.language === language || 
        t.language === language.split('-')[0] // Match 'fr' for 'fr-FR'
      );

      if (translationForLanguage) {
        selectedTranslation = translationForLanguage;
        finalLanguage = language;
        console.log(`✅ Found translation for ${language}:`, translationForLanguage.title?.substring(0, 50));
      } else {
        console.log(`⚠️ No translation found for ${language}, falling back to English`);
        finalLanguage = 'en';
      }
    }

    // ========== GET ALL AVAILABLE LANGUAGES ==========
    const allLanguagesSet = new Set<string>();
    allLanguagesSet.add('en'); // Always include English
    
    // Add languages from translations
    if (translationsArray && Array.isArray(translationsArray)) {
      translationsArray.forEach((t: any) => {
        if (t.language && t.language.trim() !== '') {
          allLanguagesSet.add(t.language);
        }
      });
    }
    
    // Add languages from article.availableLanguages
    if (article.availableLanguages && Array.isArray(article.availableLanguages)) {
      article.availableLanguages.forEach((lang: string) => {
        if (lang && lang.trim() !== '') {
          allLanguagesSet.add(lang);
        }
      });
    }
    
    const allAvailableLanguages = Array.from(allLanguagesSet).sort();

    // Update article's availableLanguages if needed
    const currentArticleLanguages = article.availableLanguages?.sort() || [];
    if (JSON.stringify(currentArticleLanguages) !== JSON.stringify(allAvailableLanguages)) {
      try {
        await this.prisma.article.update({
          where: { id: article.id },
          data: { availableLanguages: allAvailableLanguages },
        });
        article.availableLanguages = allAvailableLanguages;
      } catch (updateError) {
        console.warn('⚠️ Failed to update availableLanguages:', updateError.message);
      }
    }

    // ========== IMAGE URL TRANSFORMATION ==========
    const transformImageUrl = (url: string | undefined | null): string => {
      if (!url || url.trim() === '') return '';
      const serverUrl = 'http://localhost:3000';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/')) return `${serverUrl}${url}`;
      return `${serverUrl}/uploads/articles/${url}`;
    };

    if (article.coverImage) article.coverImage = transformImageUrl(article.coverImage);
    if (articleAny.author?.picture) articleAny.author.picture = transformImageUrl(articleAny.author.picture);

    const transformContentUrls = (content: any): any => {
      if (!content) return content;
      if (typeof content === 'string') {
        const serverUrl = 'http://localhost:3000';
        return content
          .replace(/src="(\/uploads\/[^"]+)"/g, `src="${serverUrl}$1"`)
          .replace(/src=(\/uploads\/[^"'\s>]+)/g, `src="${serverUrl}$1"`);
      }
      if (typeof content === 'object' && content.type === 'doc') {
        const contentCopy = JSON.parse(JSON.stringify(content));
        const fixImagesInContent = (node: any) => {
          if (node.type === 'image' && node.attrs?.src) {
            node.attrs.src = transformImageUrl(node.attrs.src);
          }
          if (node.content && Array.isArray(node.content)) node.content.forEach(fixImagesInContent);
        };
        if (contentCopy.content) contentCopy.content.forEach(fixImagesInContent);
        return contentCopy;
      }
      return content;
    };

    article.content = transformContentUrls(article.content);

    // ========== TRACK ENGAGEMENT ==========
    if (userId && !this.isPreviewVersion(article)) {
      try {
        await this.engagementService.trackView(userId, article.id, finalLanguage);
        await this.engagementService.trackEngagement(userId, article.id, 'VIEW');
      } catch (error) {
        console.warn(`⚠️ Failed to track engagement for article ${article.id}:`, error.message);
      }
    }

    // ========== RETURN TRANSLATED OR ORIGINAL ARTICLE ==========
    if (selectedTranslation) {
      console.log(`🌐 Returning translated article in ${finalLanguage}`);
      
      // Apply image transformations to translation if needed
      const transformedCoverImage = selectedTranslation.coverImage 
        ? transformImageUrl(selectedTranslation.coverImage) 
        : article.coverImage;
      
      const transformedContent = selectedTranslation.content 
        ? transformContentUrls(selectedTranslation.content) 
        : article.content;

      return {
        ...article,
        // Include author object
        author: articleAny.author,
        category: articleAny.category,
        
        // Override with translated content
        title: selectedTranslation.title || article.title,
        excerpt: selectedTranslation.excerpt || article.excerpt,
        content: transformedContent,
        plainText: selectedTranslation.plainText || article.plainText,
        metaTitle: selectedTranslation.metaTitle || article.metaTitle,
        metaDescription: selectedTranslation.metaDescription || article.metaDescription,
        keywords: selectedTranslation.keywords?.length ? selectedTranslation.keywords : article.keywords,
        coverImage: transformedCoverImage,
        
        // Translation metadata
        translations: formattedTranslations, // Send formatted translations object
        isTranslated: true,
        translationLanguage: finalLanguage,
        translationQuality: selectedTranslation.qualityScore,
        translationConfidence: selectedTranslation.confidence,
        translationNeedsReview: selectedTranslation.needsReview,
        
        // Language info
        availableLanguages: allAvailableLanguages,
        language: finalLanguage,
      };
    }

    // At the very end, before returning, add:
    console.log('📤 Final response being sent:', {
      title: selectedTranslation ? selectedTranslation.title : article.title,
      isTranslated: !!selectedTranslation,
      translationLanguage: finalLanguage,
      translationsObjectKeys: Object.keys(formattedTranslations),
      availableLanguages: allAvailableLanguages
    });
    
    console.log('✅ ========== getArticle END ==========');

    // ========== RETURN ORIGINAL ARTICLE ==========
    console.log('✅ Returning original article in English');
    return {
      ...article,
      // Include author and category objects
      author: articleAny.author,
      category: articleAny.category,
      
      // Send formatted translations object
      translations: formattedTranslations,
      
      // Language info
      availableLanguages: allAvailableLanguages,
      language: finalLanguage,
      isTranslated: false,
    };

  } catch (error) {
    console.error('❌ Error in getArticle:', error);
    if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
    throw new BadRequestException(`Failed to load article: ${error.message}`);
  }
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
// Update the existing listArticles method in article.service.ts
// async listArticles(options: {
//   page?: number;
//   limit?: number;
//   category?: string | string[];
//   tag?: string;
//   status?: ArticleStatus;
//   accessType?: ContentAccess | 'all';
//   featured?: boolean;
//   trending?: boolean;
//   language?: string;
//   authorId?: string;
//   search?: string;
//   sort?: string;
//   readingTime?: 'short' | 'medium' | 'long' | 'any';
// }) {
//   const page = options.page || 1;
//   const limit = Math.min(options.limit || 20, 100);
//   const skip = (page - 1) * limit;

//   const where: any = {};

//   // Default to published articles unless specified
//   if (options.status !== undefined) {
//     where.status = options.status;
//   } else {
//     where.status = ArticleStatus.PUBLISHED;
//   }

//   // Handle category (could be string or array)
//   if (options.category) {
//     if (Array.isArray(options.category)) {
//       where.category = { slug: { in: options.category } };
//     } else {
//       where.category = { slug: options.category };
//     }
//   }

//   // Handle access type
//   if (options.accessType && options.accessType !== 'all') {
//     where.accessType = options.accessType as ContentAccess;
//   }

//   // Handle reading time
//   if (options.readingTime && options.readingTime !== 'any') {
//     const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
//     if (readingTimeCondition) {
//       where.readingTime = readingTimeCondition;
//     }
//   }

//   // Other existing filters...
//   if (options.tag) {
//     where.tags = { has: options.tag };
//   }

//   if (options.featured !== undefined) {
//     where.isFeatured = options.featured;
//   }

//   if (options.trending !== undefined) {
//     where.isTrending = options.trending;
//   }

//   if (options.authorId) {
//     where.authorId = options.authorId;
//   }

//   if (options.search) {
//     where.OR = [
//       { title: { contains: options.search, mode: 'insensitive' } },
//       { excerpt: { contains: options.search, mode: 'insensitive' } },
//       { plainText: { contains: options.search, mode: 'insensitive' } },
//     ];
//   }

//   // Get sort order
//   const orderBy = this.getSortOrder(options.sort || 'recent');

//   const [articles, total] = await Promise.all([
//     this.prisma.article.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy,
//       include: {
//         category: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//             icon: true,
//             color: true,
//           },
//         },
//         author: {
//           select: {
//             id: true,
//             name: true,
//             username: true,
//             picture: true,
//           },
//         },
//       },
//     }),
//     this.prisma.article.count({ where }),
//   ]);

//   // Get counts for each article
//   const articlesWithCounts = await Promise.all(
//     articles.map(async (article) => {
//       const [commentCount, likeCount, viewCount] = await Promise.all([
//         this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
//         this.prisma.articleLike.count({ where: { articleId: article.id } }),
//         this.prisma.articleView.count({ where: { articleId: article.id } }),
//       ]);

//       return {
//         ...article,
//         commentCount,
//         likeCount,
//         viewCount,
//       };
//     })
//   );

//   return {
//     articles: articlesWithCounts,
//     total,
//     page,
//     limit,
//     totalPages: Math.ceil(total / limit),
//     hasMore: total > skip + limit,
//   };
// }

//   async getDashboardStats(timeRange: string = '7days') {
//   const now = new Date();
//   const startDate = new Date();
  
//   // Calculate start date based on timeRange
//   switch (timeRange) {
//     case '7days':
//       startDate.setDate(now.getDate() - 7);
//       break;
//     case '30days':
//       startDate.setDate(now.getDate() - 30);
//       break;
//     case '90days':
//       startDate.setDate(now.getDate() - 90);
//       break;
//     case 'year':
//       startDate.setFullYear(now.getFullYear() - 1);
//       break;
//     default:
//       startDate.setDate(now.getDate() - 7);
//   }

//   try {
//     // Execute all queries in parallel
//     const [
//       totalArticles,
//       publishedArticles,
//       draftArticles,
//       premiumArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       monthlyGrowth,
//       topCategories,
//       recentActivity,
//     ] = await Promise.all([
//       // Total articles
//       this.prisma.article.count(),
      
//       // Published articles
//       this.prisma.article.count({
//         where: { status: ArticleStatus.PUBLISHED },
//       }),
      
//       // Draft articles
//       this.prisma.article.count({
//         where: { status: ArticleStatus.DRAFT },
//       }),
      
//       // Premium articles
//       this.prisma.article.count({
//         where: { 
//           accessType: ContentAccess.PREMIUM,
//           status: ArticleStatus.PUBLISHED,
//         },
//       }),
      
//       // Total views
//       this.prisma.articleView.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Total likes
//       this.prisma.articleLike.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Total comments
//       this.prisma.articleComment.count({
//         where: { createdAt: { gte: startDate } },
//       }),
      
//       // Monthly growth (calculated from last month)
//       this.calculateMonthlyGrowth(startDate),
      
//       // Top categories
//       this.getTopCategories(),
      
//       // Recent activity
//       this.getRecentActivity(),
//     ]);

//     return {
//       totalArticles,
//       publishedArticles,
//       draftArticles,
//       premiumArticles,
//       totalViews,
//       totalLikes,
//       totalComments,
//       monthlyGrowth,
//       topCategories,
//       recentActivity,
//     };
//   } catch (error) {
//     this.logger.error('Error getting dashboard stats:', error);
//     // Return empty/default stats
//     return {
//       totalArticles: 0,
//       publishedArticles: 0,
//       draftArticles: 0,
//       premiumArticles: 0,
//       totalViews: 0,
//       totalLikes: 0,
//       totalComments: 0,
//       monthlyGrowth: 0,
//       topCategories: [],
//       recentActivity: [],
//     };
//   }
// }


async listArticles(options: {
  page?: number;
  limit?: number;
  category?: string | string[];
  tag?: string;
  status?: ArticleStatus;
  accessType?: ContentAccess | 'all';
  featured?: boolean;
  trending?: boolean;
  language?: string;
  authorId?: string;
  search?: string;
  sort?: string;
  readingTime?: 'short' | 'medium' | 'long' | 'any';
}) {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};

  // Default to published articles unless specified
  if (options.status !== undefined) {
    where.status = options.status;
  } else {
    where.status = ArticleStatus.PUBLISHED;
  }

  // Handle category (could be string or array)
  if (options.category) {
    if (Array.isArray(options.category)) {
      where.category = { slug: { in: options.category } };
    } else {
      where.category = { slug: options.category };
    }
  }

  // Handle access type
  if (options.accessType && options.accessType !== 'all') {
    where.accessType = options.accessType as ContentAccess;
  }

  // Handle reading time
  if (options.readingTime && options.readingTime !== 'any') {
    const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
    if (readingTimeCondition) {
      where.readingTime = readingTimeCondition;
    }
  }

  // Other existing filters...
  if (options.tag) {
    where.tags = { has: options.tag };
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

  // ========== FIX: REMOVE language filter - include ALL articles ==========
  // DO NOT filter by language here. We'll handle translations in processing.

  // Get sort order
  const orderBy = this.getSortOrder(options.sort || 'recent');

  const [articles, total] = await Promise.all([
    this.prisma.article.findMany({
      where, // NO language filter here
      skip,
      take: limit,
      orderBy,
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
        // ========== FIX: Include translations if language specified ==========
        translations: options.language && options.language !== 'en' ? {
          where: { 
            OR: [
              { language: options.language },
              { language: options.language.split('-')[0] },
            ],
            status: TranslationStatus.COMPLETED 
          },
          select: {
            id: true,
            language: true,
            title: true,
            excerpt: true,
            // REMOVED: content and plainText if not in schema
            qualityScore: true,
            confidence: true,
          },
        } : undefined,
      },
    }),
    this.prisma.article.count({ where }),
  ]);

  // Get counts for each article
  const articlesWithCounts = await Promise.all(
    articles.map(async (article) => {
      const [commentCount, likeCount, viewCount] = await Promise.all([
        this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
        this.prisma.articleLike.count({ where: { articleId: article.id } }),
        this.prisma.articleView.count({ where: { articleId: article.id } }),
      ]);

      // ========== FIX: Apply translation if available, otherwise use English ==========
      let finalTitle = article.title;
      let finalExcerpt = article.excerpt;
      // Use English as default since article may not have language field
      let articleLanguage = 'en';
      let isTranslated = false;
      let translationQuality = undefined;
      let translationConfidence = undefined;

      // Cast to any to access translations
      const articleAny = article as any;
      const translationsArray = articleAny.translations || [];

      // Apply translation if requested and available
      if (options.language && options.language !== 'en' && translationsArray.length > 0) {
        // Try to find translation for requested language
        const translation = translationsArray.find((t: any) => {
          // Match exact language code or base language
          return t.language === options.language || 
                 t.language === options.language?.split('-')[0];
        });

        if (translation) {
          // Use translation
          finalTitle = translation.title || article.title;
          finalExcerpt = translation.excerpt || article.excerpt;
          articleLanguage = options.language;
          isTranslated = true;
          translationQuality = translation.qualityScore;
          translationConfidence = translation.confidence;
        }
        // If no translation found, keep English (default) - don't filter out!
      }

      // Get all available translations for this article
      const allTranslations = await this.prisma.articleTranslation.findMany({
        where: {
          articleId: article.id,
          status: TranslationStatus.COMPLETED
        },
        select: { 
          language: true, 
          title: true, 
          excerpt: true, 
          qualityScore: true,
          confidence: true,
          // Only include if these fields exist in your schema
          // content: true,
          // plainText: true,
        },
      });

      // Create translations object for frontend
      const translationsObject: Record<string, any> = {};
      
      // Always include English (original)
      translationsObject['en'] = {
        title: article.title,
        excerpt: article.excerpt,
        // Only include if these exist
        // content: article.content,
        // plainText: article.plainText,
        isOriginal: true,
        qualityScore: 5,
        confidence: 1,
      };

      // Add all other translations
      allTranslations.forEach(trans => {
        translationsObject[trans.language] = {
          title: trans.title,
          excerpt: trans.excerpt,
          // Only include if these fields exist
          // content: trans.content,
          // plainText: trans.plainText,
          isOriginal: false,
          qualityScore: trans.qualityScore || 3,
          confidence: trans.confidence || 0.9,
        };
      });

      // Get available languages array
      const availableLanguages = ['en', ...allTranslations.map(t => t.language)];

      return {
        ...article,
        title: finalTitle,
        excerpt: finalExcerpt,
        commentCount,
        likeCount,
        viewCount,
        // ========== New fields for translations ==========
        language: articleLanguage,
        isTranslated,
        translationQuality,
        translationConfidence,
        translations: translationsObject,
        availableLanguages,
        originalTitle: article.title, // Keep original for reference
        originalExcerpt: article.excerpt, // Keep original for reference
        hasTranslation: isTranslated,
      };
    })
  );

  return {
    articles: articlesWithCounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: total > skip + limit,
  };
}

async getDashboardStats(timeRange: string = '7days', adminId?: string) {
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

  // Build base where clause
  let whereClause: any = {};
  
  // If adminId is provided, filter to only admin's articles
  if (adminId) {
    whereClause.authorId = adminId;
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
      // Total articles (filtered by author if admin)
      this.prisma.article.count({ where: whereClause }),
      
      // Published articles
      this.prisma.article.count({
        where: { 
          ...whereClause,
          status: ArticleStatus.PUBLISHED 
        },
      }),
      
      // Draft articles
      this.prisma.article.count({
        where: { 
          ...whereClause,
          status: ArticleStatus.DRAFT 
        },
      }),
      
      // Premium articles
      this.prisma.article.count({
        where: { 
          ...whereClause,
          accessType: ContentAccess.PREMIUM,
          status: ArticleStatus.PUBLISHED,
        },
      }),
      
      // Total views (filtered by admin's articles if needed)
      this.prisma.articleView.count({
        where: { 
          createdAt: { gte: startDate },
          ...(adminId && {
            article: {
              authorId: adminId
            }
          })
        },
      }),
      
      // Total likes
      this.prisma.articleLike.count({
        where: { 
          createdAt: { gte: startDate },
          ...(adminId && {
            article: {
              authorId: adminId
            }
          })
        },
      }),
      
      // Total comments
      this.prisma.articleComment.count({
        where: { 
          createdAt: { gte: startDate },
          ...(adminId && {
            article: {
              authorId: adminId
            }
          })
        },
      }),
      
      // Monthly growth (calculated from last month)
      this.calculateMonthlyGrowth(startDate, adminId),
      
      // Top categories (filtered by admin if needed)
      this.getTopCategories(adminId),
      
      // Recent activity (filtered by admin if needed)
      this.getRecentActivity(adminId),
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
      isAdminView: !!adminId,
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
      isAdminView: !!adminId,
    };
  }
}

private async calculateMonthlyGrowth(startDate: Date, adminId?: string): Promise<number> {
  try {
    const previousMonthStart = new Date(startDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    // Build where clauses
    const currentWhere: any = { 
      createdAt: { gte: startDate },
      status: ArticleStatus.PUBLISHED,
    };
    
    const previousWhere: any = { 
      createdAt: { 
        gte: previousMonthStart,
        lt: startDate,
      },
      status: ArticleStatus.PUBLISHED,
    };
    
    // Add admin filter if provided
    if (adminId) {
      currentWhere.authorId = adminId;
      previousWhere.authorId = adminId;
    }
    
    const [currentArticles, previousArticles] = await Promise.all([
      this.prisma.article.count({ where: currentWhere }),
      this.prisma.article.count({ where: previousWhere }),
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


private async getTopCategories(adminId?: string) {
  try {
    // Build base where clause
    let whereClause: any = {};
    
    // If adminId is provided, filter to only admin's articles
    if (adminId) {
      whereClause.articles = {
        some: {
          authorId: adminId,
          status: ArticleStatus.PUBLISHED
        }
      };
    } else {
      whereClause.articles = {
        some: {
          status: ArticleStatus.PUBLISHED
        }
      };
    }
    
    const categories = await this.prisma.articleCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { 
            articles: {
              where: {
                status: ArticleStatus.PUBLISHED,
                ...(adminId && { authorId: adminId })
              }
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
        const growth = await this.calculateCategoryGrowth(cat.id, adminId);
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

private async calculateCategoryGrowth(categoryId: string, adminId?: string): Promise<number> {
  try {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    
    // Build where clauses
    const currentWhere: any = { 
      categoryId,
      status: ArticleStatus.PUBLISHED,
      createdAt: { 
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      },
    };
    
    const previousWhere: any = { 
      categoryId,
      status: ArticleStatus.PUBLISHED,
      createdAt: { 
        gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    };
    
    // Add admin filter if provided
    if (adminId) {
      currentWhere.authorId = adminId;
      previousWhere.authorId = adminId;
    }
    
    const [currentMonthArticles, lastMonthArticles] = await Promise.all([
      this.prisma.article.count({ where: currentWhere }),
      this.prisma.article.count({ where: previousWhere }),
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

private async getRecentActivity(adminId?: string) {
  try {
    // Build base where clauses
    const articleWhere: any = { 
      status: ArticleStatus.PUBLISHED,
      publishedAt: { not: null },
    };
    
    const commentWhere: any = {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    };
    
    // Add admin filter if provided
    if (adminId) {
      articleWhere.authorId = adminId;
      commentWhere.article = {
        authorId: adminId
      };
    }

    // Get recent published articles
    const recentArticles = await this.prisma.article.findMany({
      where: articleWhere,
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
      where: commentWhere,
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
      isAdminActivity: !!adminId,
    }));

    const commentActivities = recentComments.map(comment => ({
      id: comment.id,
      action: 'COMMENT',
      user: comment.user.name,
      target: comment.article.title,
      time: comment.createdAt.toISOString(),
      avatar: comment.user.picture,
      isAdminActivity: !!adminId,
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

async getRecentArticles(adminId?: string) {
  try {
    const whereClause: any = { 
      status: ArticleStatus.PUBLISHED,
    };
    
    // Add admin filter if provided
    if (adminId) {
      whereClause.authorId = adminId;
    }
    
    return await this.prisma.article.findMany({
      where: whereClause,
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

async getTopArticles(adminId?: string) {
  try {
    const whereClause: any = { 
      status: ArticleStatus.PUBLISHED,
    };
    
    // Add admin filter if provided
    if (adminId) {
      whereClause.authorId = adminId;
    }
    
    return await this.prisma.article.findMany({
      where: whereClause,
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

async getRelatedArticlesByIdOrSlug(identifier: string, limit: number = 3, language?: string) {
  try {
    // Get the article to find related content
    const article = await this.prisma.article.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ],
        status: ArticleStatus.PUBLISHED
      },
      select: {
        id: true,
        title: true,
        categoryId: true,
        tags: true,
      }
    });

    if (!article) {
      return [];
    }

    const where: any = {
      status: ArticleStatus.PUBLISHED,
      id: { not: article.id }, // Exclude current article
      OR: [
        { categoryId: article.categoryId },
        { tags: { hasSome: article.tags || [] } }
      ]
    };

    // Get related articles
    const relatedArticles = await this.prisma.article.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
            // isVerified: true,
          },
        },
        // Include translations if language is specified
        translations: language && language !== 'en' ? {
          where: { 
            OR: [
              { language: language },
              { language: language.split('-')[0] },
            ],
            status: TranslationStatus.COMPLETED 
          },
          select: {
            id: true,
            language: true,
            title: true,
            excerpt: true,
            qualityScore: true,
            confidence: true,
          },
        } : undefined,
      },
    });

    // Process articles to apply translations
    const processedArticles = await Promise.all(
      relatedArticles.map(async (article) => {
        // Get counts
        const [commentCount, likeCount, viewCount] = await Promise.all([
          this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
          this.prisma.articleLike.count({ where: { articleId: article.id } }),
          this.prisma.articleView.count({ where: { articleId: article.id } }),
        ]);

        // Apply translation if available
        let finalTitle = article.title;
        let finalExcerpt = article.excerpt;
        let isTranslated = false;

        const articleAny = article as any;
        const translationsArray = articleAny.translations || [];

        if (language && language !== 'en' && translationsArray.length > 0) {
          const translation = translationsArray.find((t: any) => {
            return t.language === language || 
                   t.language === language?.split('-')[0];
          });

          if (translation) {
            finalTitle = translation.title || article.title;
            finalExcerpt = translation.excerpt || article.excerpt;
            isTranslated = true;
          }
        }

        // Get available languages
        const allTranslations = await this.prisma.articleTranslation.findMany({
          where: {
            articleId: article.id,
            status: TranslationStatus.COMPLETED
          },
          select: { language: true, title: true, excerpt: true },
        });

        const translationsObject: Record<string, any> = {};
        translationsObject['en'] = {
          title: article.title,
          excerpt: article.excerpt,
          isOriginal: true,
        };

        allTranslations.forEach(trans => {
          translationsObject[trans.language] = {
            title: trans.title,
            excerpt: trans.excerpt,
            isOriginal: false,
          };
        });

        const availableLanguages = ['en', ...allTranslations.map(t => t.language)];

        return {
          ...article,
          title: finalTitle,
          excerpt: finalExcerpt,
          commentCount,
          likeCount,
          viewCount,
          translations: translationsObject,
          availableLanguages,
          language: language || 'en',
          isTranslated,
        };
      })
    );

    return processedArticles;
  } catch (error) {
    console.error('Error getting related articles:', error);
    return [];
  }
}

  async likeArticle(articleId: string, userId: string, language: string = 'en') {
    try {
      // Check if article exists and is published
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          slug: true,
          authorId: true, 
          status: true,
          accessType: true,
        },
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

        try {
          await this.notificationService.notifyArticleLike(
            article.authorId,
            articleId,
            userId
          );
        } catch (error) {
          this.logger.error('Failed to send like notification', error);
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
      select: { status: true, 
        accessType: true,  
        authorId: true, 
        title: true,    
        slug: true, 
      },
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

    try {
      await this.notificationService.notifyArticleComment(
        article.authorId,
        articleId,
        userId,
        comment.id
      );
    } catch (error) {
      this.logger.error('Failed to send comment notification', error);
    }

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

  public getPreviewVersion(article: any) {
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

  // async getArticleStats(articleId: string) {
  //   const article = await this.prisma.article.findUnique({
  //     where: { id: articleId },
  //     select: {
  //       id: true,
  //       title: true,
  //       slug: true,
  //       status: true,
  //     },
  //   });

  //   if (!article) {
  //     throw new NotFoundException('Article not found');
  //   }

  //   const [
  //     views,
  //     likes,
  //     comments,
  //     shares,
  //     saves,
  //     claps,
  //     translations,
  //   ] = await Promise.all([
  //     this.prisma.articleView.count({ where: { articleId } }),
  //     this.prisma.articleLike.count({ where: { articleId } }),
  //     this.prisma.articleComment.count({ where: { articleId } }),
  //     this.prisma.articleShare.count({ where: { articleId } }),
  //     this.prisma.articleSave.count({ where: { articleId } }),
  //     this.prisma.articleClap.aggregate({
  //       where: { articleId },
  //       _sum: { count: true },
  //     }),
  //     this.prisma.articleTranslation.count({ 
  //       where: { 
  //         articleId,
  //         status: TranslationStatus.COMPLETED 
  //       } 
  //     }),
  //   ]);

  //   return {
  //     article: {
  //       id: article.id,
  //       title: article.title,
  //       slug: article.slug,
  //       status: article.status,
  //     },
  //     stats: {
  //       views,
  //       likes,
  //       comments,
  //       shares,
  //       saves,
  //       claps: claps._sum.count || 0,
  //       translations,
  //     },
  //     calculated: {
  //       engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
  //       avgClapsPerUser: likes > 0 ? (claps._sum.count || 0) / likes : 0,
  //     },
  //   };
  // }


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
    console.log('📊 getUserReadingStats called for userId:', userId);
    
    // Get counts from MULTIPLE sources, not just ArticleView
    const [
      viewedArticles,
      savedArticles,
      likedArticles,
      commentedArticles
    ] = await Promise.all([
      // Articles viewed
      this.prisma.articleView.findMany({
        where: { userId },
        select: { articleId: true },
        distinct: ['articleId'],
      }),
      // Articles saved
      this.prisma.articleSave.findMany({
        where: { userId },
        select: { articleId: true },
        distinct: ['articleId'],
      }),
      // Articles liked
      this.prisma.articleLike.findMany({
        where: { userId },
        select: { articleId: true },
        distinct: ['articleId'],
      }),
      // Articles commented on
      this.prisma.articleComment.findMany({
        where: { userId },
        select: { articleId: true },
        distinct: ['articleId'],
      }),
    ]);
    
    console.log('📊 Stats counts:', {
      viewed: viewedArticles.length,
      saved: savedArticles.length,
      liked: likedArticles.length,
      commented: commentedArticles.length,
    });
    
    // Combine all unique article interactions
    const allArticleIds = new Set([
      ...viewedArticles.map(v => v.articleId),
      ...savedArticles.map(s => s.articleId),
      ...likedArticles.map(l => l.articleId),
      ...commentedArticles.map(c => c.articleId),
    ]);
    
    const totalArticlesRead = allArticleIds.size;
    
    // Calculate total reading time based on ALL interactions
    // Each interaction (view, save, like, comment) counts as engagement
    const totalInteractions = viewedArticles.length + savedArticles.length + likedArticles.length + commentedArticles.length;
    
    // Estimate reading time: 3 minutes per interaction
    const totalReadingTime = totalInteractions * 3;

    // Reading streak calculation - use ANY interaction, not just views
    const streak = await this.calculateReadingStreakFromAllInteractions(userId);

    // Favorite category using ALL interactions
    let favoriteCategory = 'None';
    try {
      const categoryResult = await this.prisma.$queryRaw<{category: string, count: number}[]>`
        SELECT ac.name as category, COUNT(DISTINCT a.id) as count
        FROM (
          -- Combine all user interactions
          SELECT "articleId" FROM "ArticleView" WHERE "userId" = ${userId}
          UNION
          SELECT "articleId" FROM "ArticleSave" WHERE "userId" = ${userId}
          UNION
          SELECT "articleId" FROM "ArticleLike" WHERE "userId" = ${userId}
          UNION
          SELECT "articleId" FROM "ArticleComment" WHERE "userId" = ${userId}
        ) user_articles
        JOIN "Article" a ON user_articles."articleId" = a.id
        JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
        GROUP BY ac.name
        ORDER BY count DESC
        LIMIT 1
      `;
      favoriteCategory = categoryResult[0]?.category || 'None';
    } catch (error) {
      this.logger.warn('Could not calculate favorite category:', error);
    }

    // Weekly progress - use ALL interactions from this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyProgress = await Promise.all([
      this.prisma.articleView.count({ where: { userId, createdAt: { gte: weekStart } } }),
      this.prisma.articleSave.count({ where: { userId, createdAt: { gte: weekStart } } }),
      this.prisma.articleLike.count({ where: { userId, createdAt: { gte: weekStart } } }),
      this.prisma.articleComment.count({ where: { userId, createdAt: { gte: weekStart } } }),
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0));

    // Get saved and liked counts
    const savedArticlesCount = await this.prisma.articleSave.count({ where: { userId } });
    const likedArticlesCount = await this.prisma.articleLike.count({ where: { userId } });

    console.log('📊 Final stats:', {
      totalArticlesRead,
      totalReadingTime,
      weeklyProgress,
      streak,
      favoriteCategory,
    });

    return {
      totalArticlesRead,
      totalReadingTime,
      averageReadingTime: totalArticlesRead > 0 ? Math.round(totalReadingTime / totalArticlesRead) : 0,
      favoriteCategory,
      readingStreak: streak,
      weeklyGoal: 5, // Default weekly goal
      weeklyProgress: Math.min(weeklyProgress, 5), // Cap at weekly goal
      savedArticlesCount,
      likedArticlesCount,
    };
  }

  // Updated streak calculation that includes all interactions
  private async calculateReadingStreakFromAllInteractions(userId: string): Promise<number> {
    // Get interaction dates from ALL sources
    const interactionDates = await this.prisma.$queryRaw<{date: Date}[]>`
      SELECT DATE("createdAt") as date
      FROM (
        SELECT "createdAt" FROM "ArticleView" WHERE "userId" = ${userId}
        UNION
        SELECT "createdAt" FROM "ArticleSave" WHERE "userId" = ${userId}
        UNION
        SELECT "createdAt" FROM "ArticleLike" WHERE "userId" = ${userId}
        UNION
        SELECT "createdAt" FROM "ArticleComment" WHERE "userId" = ${userId}
      ) all_interactions
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    if (interactionDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = today;
    
    // Convert raw dates to proper Date objects
    const dates = interactionDates.map(item => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    // Check for consecutive days
    for (let i = 0; i < dates.length; i++) {
      const readDate = dates[i];
      
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

    console.log('📅 Streak calculation:', {
      totalDates: dates.length,
      streak,
      dates: dates.slice(0, 5).map(d => d.toISOString().split('T')[0]), // First 5 dates for debugging
    });

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


  async updateReadingProfile(userId: string, dto: UpdateReadingProfileDto) {
    try {
      const updateData: any = {};

      console.log('Updating reading profile for user:', userId);
      console.log('Received DTO:', dto);

      // Map readingLevel to difficultyPreference
      if (dto.readingLevel) {
        updateData.difficultyPreference = dto.readingLevel.toLowerCase();
      }

      // Handle preferredReadingTime as session duration
      if (dto.preferredReadingTime !== undefined) {
        const time = Number(dto.preferredReadingTime);
        if (time < 1 || time > 240) {
          throw new BadRequestException('Preferred reading time must be between 1 and 240 minutes');
        }
        updateData.preferredSessionDuration = time;
      }

      

      // Handle categories (preferredCategories from frontend)
      if (dto.preferredCategories && Array.isArray(dto.preferredCategories)) {
        console.log('Looking for categories:', dto.preferredCategories);
        
        const categories = await this.prisma.articleCategory.findMany({
          where: {
            name: {
              in: dto.preferredCategories,
            },
          },
        });

        console.log('Found categories:', categories.map(c => ({ id: c.id, name: c.name })));

        if (categories.length > 0) {
          updateData.favoriteCategories = {
            set: categories.map(cat => ({ id: cat.id })),
          };
        } else {
          // Clear categories if none found
          updateData.favoriteCategories = { set: [] };
        }
      }

      // Handle interests (interests from frontend)
      if (dto.interests) {
        updateData.favoriteTags = dto.interests;
      }

      // Handle notification preferences
      if (dto.notifyNewArticles !== undefined) {
        updateData.notifyNewArticles = dto.notifyNewArticles;
      }
      
      if (dto.notifyTrending !== undefined) {
        updateData.notifyTrending = dto.notifyTrending;
      }
      
      if (dto.notifyPersonalized !== undefined) {
        updateData.notifyPersonalized = dto.notifyPersonalized;
      }
      
      if (dto.digestFrequency) {
        updateData.digestFrequency = dto.digestFrequency;
      }

      console.log('Final update data:', updateData);

      // Check if profile exists
      const existingProfile = await this.prisma.userReadingProfile.findUnique({
        where: { userId },
      });

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await this.prisma.userReadingProfile.update({
          where: { userId },
          data: updateData,
          include: {
            favoriteCategories: true,
          },
        });
      } else {
        // Create new profile
        result = await this.prisma.userReadingProfile.create({
          data: {
            userId,
            ...updateData,
          },
          include: {
            favoriteCategories: true,
          },
        });
      }

      console.log('Profile updated successfully:', result);

      // Format response to match frontend expectations
      return {
        success: true,
        message: 'Reading profile updated successfully',
        data: {
          preferredCategories: result.favoriteCategories?.map(cat => cat.name) || [],
          readingLevel: result.difficultyPreference ? result.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : undefined,
          preferredReadingTime: result.preferredSessionDuration || undefined,
          interests: result.favoriteTags || [],
          notifyNewArticles: result.notifyNewArticles,
          notifyTrending: result.notifyTrending,
          notifyPersonalized: result.notifyPersonalized,
          digestFrequency: result.digestFrequency,
        },
      };

    } catch (error) {
      console.error('Error updating reading profile:', error);
      
      if (error.code === 'P2025' || error.code === 'P2016') {
        // Profile doesn't exist, create it
        return this.createReadingProfile(userId, dto);
      }
      
      throw error;
    }
  }

  // Helper method to create reading profile
  async createReadingProfile(userId: string, dto: UpdateReadingProfileDto) {
    const createData: any = {
      userId,
      difficultyPreference: dto.readingLevel ? dto.readingLevel.toLowerCase() : 'intermediate',
    };

    if (dto.preferredReadingTime !== undefined) {
      createData.preferredSessionDuration = Number(dto.preferredReadingTime);
    }

    if (dto.interests) {
      createData.favoriteTags = dto.interests;
    }

    // Handle categories if provided
    let categories: any[] = [];
    if (dto.preferredCategories && Array.isArray(dto.preferredCategories)) {
      categories = await this.prisma.articleCategory.findMany({
        where: {
          name: {
            in: dto.preferredCategories,
          },
        },
      });
    }

    const newProfile = await this.prisma.userReadingProfile.create({
      data: {
        ...createData,
        favoriteCategories: {
          connect: categories.map(cat => ({ id: cat.id })),
        },
      },
      include: {
        favoriteCategories: true,
      },
    });

    return {
      success: true,
      message: 'Reading profile created successfully',
      data: {
        preferredCategories: newProfile.favoriteCategories?.map(cat => cat.name) || [],
        readingLevel: newProfile.difficultyPreference ? newProfile.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : undefined,
        preferredReadingTime: newProfile.preferredSessionDuration || undefined,
        interests: newProfile.favoriteTags || [],
        notifyNewArticles: newProfile.notifyNewArticles,
        notifyTrending: newProfile.notifyTrending,
        notifyPersonalized: newProfile.notifyPersonalized,
        digestFrequency: newProfile.digestFrequency,
      },
    };
  }

  // Add this method to get reading profile
  // In article.service.ts - update the getReadingProfile method
  async getReadingProfile(userId: string) {
    try {
      const profile = await this.prisma.userReadingProfile.findUnique({
        where: { userId },
        include: {
          favoriteCategories: true,
        },
      });

      if (!profile) {
        return {
          success: true,
          data: {
            preferredCategories: [],
            readingLevel: 'INTERMEDIATE',
            preferredReadingTime: 15, // Default value
            interests: [],
            notifyNewArticles: true,
            notifyTrending: true,
            notifyPersonalized: true,
            digestFrequency: 'weekly',
          },
        };
      }

      return {
        success: true,
        data: {
          preferredCategories: profile.favoriteCategories?.map(cat => cat.name) || [],
          readingLevel: profile.difficultyPreference ? 
            profile.difficultyPreference.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' : 
            'INTERMEDIATE',
          // Use preferredSessionDuration (Int) instead of preferredReadingTime (String)
          preferredReadingTime: profile.preferredSessionDuration || 15,
          interests: profile.favoriteTags || [],
          notifyNewArticles: profile.notifyNewArticles,
          notifyTrending: profile.notifyTrending,
          notifyPersonalized: profile.notifyPersonalized,
          digestFrequency: profile.digestFrequency,
        },
      };

    } catch (error) {
      console.error('Error getting reading profile:', error);
      return {
        success: false,
        message: 'Failed to get reading profile',
      };
    }
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
    try {
      const subscription = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        select: {
          createdAt: true,
          currentPeriodStart: true, // You might want to use this instead
          currentPeriodEnd: true
        }
      });
      
      if (!subscription) return 0;
      
      // Use currentPeriodStart if available, fallback to createdAt
      const dateField = subscription.currentPeriodStart || subscription.createdAt;
      
      if (!dateField) return 0;
      
      // Parse the date
      let startDate: Date;
      
      if (dateField instanceof Date) {
        startDate = dateField;
      } else if (typeof dateField === 'string') {
        startDate = new Date(dateField);
      } else if (typeof dateField === 'number') {
        startDate = new Date(dateField);
      } else {
        return 0;
      }
      
      // Validate the date
      if (isNaN(startDate.getTime())) {
        return 0;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();
      const monthsActive = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
      
      return Math.max(0, monthsActive); // Ensure non-negative
    } catch (error) {
      this.logger.error(`Error calculating premium months for user ${userId}:`, error);
      return 0;
    }
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


// In article.service.ts, add this method:
async calculateCompletionRate(userId: string): Promise<number> {
  try {
    // Use UserEngagement table since you don't have readingHistory
    const engagements = await this.prisma.userEngagement.findMany({
      where: { 
        userId: userId,
        // Look for any engagement that indicates reading
        OR: [
          { action: 'VIEW' },
          { action: 'READ_COMPLETE' },
          { action: 'LIKE' },
          { action: 'COMMENT' },
          { action: 'SAVE' }
        ]
      },
      select: {
        articleId: true,
        action: true,
      }
    });

    if (engagements.length === 0) return 0;

    // Group by article to see which ones were interacted with
    const articleInteractions = new Map<string, string[]>();
    
    engagements.forEach((engagement: any) => {
      const articleId = engagement.articleId;
      if (!articleId) return;
      
      if (!articleInteractions.has(articleId)) {
        articleInteractions.set(articleId, []);
      }
      articleInteractions.get(articleId)!.push(engagement.action);
    });

    // Calculate completion rate based on engagement patterns
    const articles = Array.from(articleInteractions.keys());
    let totalCompletionScore = 0;

    articles.forEach(articleId => {
      const actions = articleInteractions.get(articleId) || [];
      
      // Score each article based on engagement depth
      let articleScore = 0;
      
      if (actions.includes('READ_COMPLETE')) {
        articleScore = 1.0; // 100% completed if marked as complete
      } else if (actions.includes('COMMENT')) {
        articleScore = 0.9; // 90% likely completed if commented
      } else if (actions.includes('LIKE')) {
        articleScore = 0.8; // 80% likely completed if liked
      } else if (actions.includes('SAVE')) {
        articleScore = 0.7; // 70% likely completed if saved
      } else if (actions.includes('VIEW')) {
        articleScore = 0.3; // 30% likely completed if only viewed
      }
      
      totalCompletionScore += articleScore;
    });

    const averageCompletionRate = totalCompletionScore / articles.length;
    return Math.round(averageCompletionRate * 100);
  } catch (error) {
    console.log('Error calculating completion rate:', error);
    return 0;
  }
}

  // async getArticlesWithAdvancedFilters(options: {
  //   page?: number;
  //   limit?: number;
  //   category?: string | string[];
  //   tag?: string;
  //   status?: ArticleStatus;
  //   accessType?: ContentAccess | 'all';
  //   featured?: boolean;
  //   trending?: boolean;
  //   language?: string;
  //   authorId?: string;
  //   search?: string;
  //   sort?: string;
  //   readingTime?: 'short' | 'medium' | 'long' | 'any';
  //   minRating?: number;
  //   minViews?: number;
  //   minLikes?: number;
  //   contentType?: string;
  //   readingLevel?: string;
  //   authors?: string[];
  //   languages?: string[];
  //   tags?: string[];
  //   categories?: string[];
  // }): Promise<any> { // Change return type to any or create proper interface
  //   const page = options.page || 1;
  //   const limit = Math.min(options.limit || 24, 100);
  //   const skip = (page - 1) * limit;

  //   const where: any = { status: ArticleStatus.PUBLISHED };

  //   // Handle category filter (single or array)
  //   if (options.category) {
  //     if (Array.isArray(options.category)) {
  //       where.category = { slug: { in: options.category } };
  //     } else {
  //       where.category = { slug: options.category };
  //     }
  //   }

  //   // Handle access type filter
  //   if (options.accessType && options.accessType !== 'all') {
  //     where.accessType = options.accessType as ContentAccess;
  //   }

  //   // Handle reading time filter
  //   if (options.readingTime && options.readingTime !== 'any') {
  //     const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
  //     if (readingTimeCondition) {
  //       where.readingTime = readingTimeCondition;
  //     }
  //   }

  //   // Handle multiple authors filter
  //   if (options.authors && options.authors.length > 0) {
  //     where.authorId = { in: options.authors };
  //   }

  //   // Handle multiple languages filter
  //   if (options.languages && options.languages.length > 0) {
  //     if (options.languages.includes('en')) {
  //       // If English is included, we need to include all articles (English original)
  //       // and also check translations for other languages
  //       const otherLanguages = options.languages.filter(lang => lang !== 'en');
  //       if (otherLanguages.length > 0) {
  //         where.OR = [
  //           { availableLanguages: { hasSome: otherLanguages } },
  //           { language: { in: otherLanguages } }
  //         ];
  //       }
  //     } else {
  //       where.OR = [
  //         { availableLanguages: { hasSome: options.languages } },
  //         { language: { in: options.languages } }
  //       ];
  //     }
  //   }

  //   // Handle multiple tags filter
  //   if (options.tags && options.tags.length > 0) {
  //     where.tags = { hasSome: options.tags };
  //   }

  //   // Handle multiple categories filter
  //   if (options.categories && options.categories.length > 0) {
  //     where.category = { slug: { in: options.categories } };
  //   }

  //   // Handle search
  //   if (options.search) {
  //     where.OR = [
  //       { title: { contains: options.search, mode: 'insensitive' } },
  //       { excerpt: { contains: options.search, mode: 'insensitive' } },
  //       { plainText: { contains: options.search, mode: 'insensitive' } },
  //     ];
  //   }

  //   // Handle featured and trending
  //   if (options.featured !== undefined) {
  //     where.isFeatured = options.featured;
  //   }

  //   if (options.trending !== undefined) {
  //     where.isTrending = options.trending;
  //   }

  //   // Handle author filter
  //   if (options.authorId) {
  //     where.authorId = options.authorId;
  //   }

  //   // Get sort order
  //   const orderBy = this.getSortOrder(options.sort || 'recent');

  //   // First get count
  //   const total = await this.prisma.article.count({ where });

  //   // Then get articles with separate counts
  //   const articles = await this.prisma.article.findMany({
  //     where,
  //     skip,
  //     take: limit,
  //     orderBy,
  //     include: {
  //       category: {
  //         select: {
  //           id: true,
  //           name: true,
  //           slug: true,
  //           icon: true,
  //           color: true,
  //           description: true,
  //         },
  //       },
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

  //   // Get counts for each article separately
  //   const articlesWithCounts = await Promise.all(
  //     articles.map(async (article) => {
  //       const [commentCount, likeCount, viewCount, saveCount] = await Promise.all([
  //         this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
  //         this.prisma.articleLike.count({ where: { articleId: article.id } }),
  //         this.prisma.articleView.count({ where: { articleId: article.id } }),
  //         this.prisma.articleSave.count({ where: { articleId: article.id } }),
  //       ]);

  //       return {
  //         ...article,
  //         commentCount,
  //         likeCount,
  //         viewCount,
  //         saveCount,
  //         isPremium: article.accessType === ContentAccess.PREMIUM,
  //       };
  //     })
  //   );

  //   return {
  //     articles: articlesWithCounts,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //     hasMore: total > skip + limit,
  //   };
  // }


  async getArticlesWithAdvancedFilters(options: {
  page?: number;
  limit?: number;
  category?: string | string[];
  tag?: string;
  status?: ArticleStatus;
  accessType?: ContentAccess | 'all';
  featured?: boolean;
  trending?: boolean;
  language?: string; // Add this parameter
  authorId?: string;
  search?: string;
  sort?: string;
  readingTime?: 'short' | 'medium' | 'long' | 'any';
  authors?: string[];
  languages?: string[];
  tags?: string[];
  categories?: string[];
}): Promise<any> {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 24, 100);
  const skip = (page - 1) * limit;

  // DEBUG LOG
  console.log('🔍 getArticlesWithAdvancedFilters called with:', {
    language: options.language,
    languages: options.languages,
    page,
    limit,
    search: options.search,
    sort: options.sort
  });

  const where: any = { status: ArticleStatus.PUBLISHED };

  // Handle category filter (single or array)
  if (options.category) {
    if (Array.isArray(options.category)) {
      where.category = { slug: { in: options.category } };
    } else {
      where.category = { slug: options.category };
    }
  }

  // Handle access type filter
  if (options.accessType && options.accessType !== 'all') {
    where.accessType = options.accessType as ContentAccess;
  }

  // Handle reading time filter
  if (options.readingTime && options.readingTime !== 'any') {
    const readingTimeCondition = this.getReadingTimeCondition(options.readingTime);
    if (readingTimeCondition) {
      where.readingTime = readingTimeCondition;
    }
  }

  // Handle multiple authors filter
  if (options.authors && options.authors.length > 0) {
    where.authorId = { in: options.authors };
  }

  // ========== CRITICAL: HANDLE LANGUAGE FILTERS ==========
  // Handle single language parameter (from frontend language selector)
  if (options.language) {
    console.log('🌐 Processing single language filter:', options.language);
    
    if (options.language === 'en') {
      // For English, we want articles that are originally in English OR have English translations
      // English is always available since original content is English
      // No filter needed for English
    } else {
      // For other languages, filter articles that have this language available
      // Either in availableLanguages array OR have a translation
      where.availableLanguages = { has: options.language };
    }
  }

  // Handle multiple languages filter (from advanced filter UI)
  if (options.languages && options.languages.length > 0) {
    console.log('🌐 Processing multiple languages filter:', options.languages);
    where.availableLanguages = { hasSome: options.languages };
  }

  // Handle multiple tags filter
  if (options.tags && options.tags.length > 0) {
    where.tags = { hasSome: options.tags };
  }

  // Handle multiple categories filter
  if (options.categories && options.categories.length > 0) {
    where.category = { slug: { in: options.categories } };
  }

  // Handle search
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { excerpt: { contains: options.search, mode: 'insensitive' } },
      { plainText: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  // Handle featured and trending
  if (options.featured !== undefined) {
    where.isFeatured = options.featured;
  }

  if (options.trending !== undefined) {
    where.isTrending = options.trending;
  }

  // Handle author filter
  if (options.authorId) {
    where.authorId = options.authorId;
  }

  console.log('📊 Final WHERE clause:', JSON.stringify(where, null, 2));

  // Get sort order
  const orderBy = this.getSortOrder(options.sort || 'recent');

  // First get count
  const total = await this.prisma.article.count({ where });

  // ========== FETCH ARTICLES WITH TRANSLATIONS ==========
  const articles = await this.prisma.article.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          description: true,
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
      // IMPORTANT: Fetch translations for the requested language
      translations: options.language && options.language !== 'en' ? {
        where: { 
          language: options.language,
          status: TranslationStatus.COMPLETED 
        },
        select: {
          id: true,
          language: true,
          title: true,
          excerpt: true,
          content: true,
          plainText: true,
          metaTitle: true,
          metaDescription: true,
          qualityScore: true,
          confidence: true,
        },
      } : undefined,
    },
  });

  console.log(`📊 Found ${articles.length} articles, requested language: ${options.language || 'en'}`);

  // ========== PROCESS ARTICLES AND APPLY TRANSLATIONS ==========
  const articlesWithCounts = await Promise.all(
    articles.map(async (article) => {
      // Get counts
      const [commentCount, likeCount, viewCount, saveCount] = await Promise.all([
        this.prisma.articleComment.count({ where: { articleId: article.id, status: 'ACTIVE' } }),
        this.prisma.articleLike.count({ where: { articleId: article.id } }),
        this.prisma.articleView.count({ where: { articleId: article.id } }),
        this.prisma.articleSave.count({ where: { articleId: article.id } }),
      ]);

      // ========== HANDLE TRANSLATION ==========
      const articleAny = article as any;
      const translationsArray = articleAny.translations || [];
      
      let finalTitle = article.title;
      let finalExcerpt = article.excerpt;
      let finalContent = article.content;
      let finalPlainText = article.plainText;
      let finalMetaTitle = article.metaTitle;
      let finalMetaDescription = article.metaDescription;
      let articleLanguage = 'en';
      let isTranslated = false;
      let translationQuality = undefined;
      let translationConfidence = undefined;

      // Apply translation if requested language is not English and translation exists
      if (options.language && options.language !== 'en' && translationsArray.length > 0) {
        const translation = translationsArray.find((t: any) => 
          t.language === options.language || 
          t.language === options.language?.split('-')[0]
        );

        if (translation) {
          console.log(`🌐 Applying ${options.language} translation to article ${article.id}:`, {
            originalTitle: article.title?.substring(0, 30),
            translatedTitle: translation.title?.substring(0, 30)
          });

          finalTitle = translation.title || article.title;
          finalExcerpt = translation.excerpt || article.excerpt;
          finalContent = translation.content || article.content;
          finalPlainText = translation.plainText || article.plainText;
          finalMetaTitle = translation.metaTitle || article.metaTitle;
          finalMetaDescription = translation.metaDescription || article.metaDescription;
          articleLanguage = options.language;
          isTranslated = true;
          translationQuality = translation.qualityScore;
          translationConfidence = translation.confidence;
        }
      }

      // Get ALL available languages for this article
      const allTranslations = await this.prisma.articleTranslation.findMany({
        where: {
          articleId: article.id,
          status: TranslationStatus.COMPLETED
        },
        select: {
          language: true,
          title: true,
          excerpt: true,
          qualityScore: true,
        },
      });

      // Create translations object for frontend
      const translationsObject: Record<string, any> = {};
      
      // Always include English (original)
      translationsObject['en'] = {
        title: article.title,
        excerpt: article.excerpt,
        isOriginal: true,
        qualityScore: 5,
      };

      // Add all other translations
      allTranslations.forEach(trans => {
        translationsObject[trans.language] = {
          title: trans.title,
          excerpt: trans.excerpt,
          isOriginal: false,
          qualityScore: trans.qualityScore || 3,
        };
      });

      // Get available languages array
      const availableLanguages = ['en', ...allTranslations.map(t => t.language)];

      // Update article's availableLanguages if needed (for consistency)
      const currentArticleLanguages = article.availableLanguages?.sort() || [];
      const shouldUpdate = JSON.stringify(currentArticleLanguages) !== JSON.stringify(availableLanguages.sort());
      
      if (shouldUpdate) {
        try {
          await this.prisma.article.update({
            where: { id: article.id },
            data: {
              availableLanguages: availableLanguages,
            },
          });
        } catch (updateError) {
          console.warn(`⚠️ Failed to update availableLanguages for article ${article.id}:`, updateError.message);
        }
      }

      // Apply image URL transformations if needed
      const transformImageUrl = (url: string | undefined | null): string => {
        if (!url || url.trim() === '') return '';
        const serverUrl = 'http://localhost:3000';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
        if (url.startsWith('/')) return `${serverUrl}${url}`;
        return `${serverUrl}/uploads/articles/${url}`;
      };

      // Transform cover image if present
      let coverImage = article.coverImage;
      if (coverImage) {
        coverImage = transformImageUrl(coverImage);
      }

      // Transform author picture if present
      let authorWithPicture = { ...article.author };
      if (article.author?.picture) {
        authorWithPicture.picture = transformImageUrl(article.author.picture);
      }

      return {
        ...article,
        // Override with translated fields if applicable
        title: finalTitle,
        excerpt: finalExcerpt,
        content: finalContent,
        plainText: finalPlainText,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        coverImage,
        author: authorWithPicture,
        
        // Counts
        commentCount,
        likeCount,
        viewCount,
        saveCount,
        
        // Premium status
        isPremium: article.accessType === ContentAccess.PREMIUM,
        
        // Language information
        language: articleLanguage,
        isTranslated,
        translationQuality,
        translationConfidence,
        
        // Translations for frontend
        translations: translationsObject,
        availableLanguages,
        
        // Original IDs for reference
        originalTitle: article.title,
        originalExcerpt: article.excerpt,
      };
    })
  );

  console.log('✅ Processed articles:', {
    totalProcessed: articlesWithCounts.length,
    withTranslations: articlesWithCounts.filter(a => a.isTranslated).length,
    requestedLanguage: options.language || 'en',
    firstArticle: articlesWithCounts[0] ? {
      title: articlesWithCounts[0].title?.substring(0, 30),
      language: articlesWithCounts[0].language,
      isTranslated: articlesWithCounts[0].isTranslated,
      availableLanguages: articlesWithCounts[0].availableLanguages,
      translationsCount: Object.keys(articlesWithCounts[0].translations || {}).length
    } : 'no articles'
  });

  return {
    articles: articlesWithCounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: total > skip + limit,
    filtersApplied: {
      language: options.language,
      languages: options.languages,
      search: options.search,
      category: options.category,
      sort: options.sort,
    }
  };
}

  public async getAllAuthors(): Promise<any[]> {
    try {
      const authors = await this.prisma.user.findMany({
        where: {
          articles: {
            some: {
              status: ArticleStatus.PUBLISHED
            }
          }
        },
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
          // Remove bio if it doesn't exist in your User model
          _count: {
            select: {
              articles: {
                where: { status: ArticleStatus.PUBLISHED }
              }
            }
          }
        },
        orderBy: {
          articles: {
            _count: 'desc'
          }
        },
        take: 50,
      });

      return authors.map(author => ({
        id: author.id,
        name: author.name,
        username: author.username,
        picture: author.picture,
        articleCount: author._count.articles,
      }));
    } catch (error) {
      this.logger.error('Error getting authors:', error);
      return [];
    }
  }


  // Add these methods to the ArticleService class

  public getReadingTimeCondition(readingTime: string): any {
    switch (readingTime) {
      case 'short':
        return { lte: 10 }; // ≤10 minutes
      case 'medium':
        return { gt: 10, lte: 20 }; // 10-20 minutes
      case 'long':
        return { gt: 20 }; // 20+ minutes
      default:
        return undefined;
    }
  }

  public getSortOrder(sort: string): any {
    switch (sort) {
      case 'recent':
        return { publishedAt: 'desc' };
      case 'popular':
        return { viewCount: 'desc' };
      case 'trending':
        return { trendingScore: 'desc' };
      case 'reading_time':
        return { readingTime: 'asc' };
      case 'title_asc':
        return { title: 'asc' };
      case 'title_desc':
        return { title: 'desc' };
      case 'most_commented':
        return { commentCount: 'desc' };
      case 'most_saved':
        return { saveCount: 'desc' };
      case 'most_liked':
        return { likeCount: 'desc' };
      default:
        return { publishedAt: 'desc' };
    }
  }

  public async getAllTags(): Promise<{ name: string; count: number }[]> {
    try {
      // Get all articles with their tags
      const articles = await this.prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        select: { tags: true },
      });

      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      articles.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => {
            if (tag) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      // Convert to array and sort by count
      return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      this.logger.error('Error getting tags:', error);
      return [];
    }
  }

  public async getArticleStats(): Promise<any> {
    const [
      totalArticles,
      freeArticles,
      premiumArticles,
      featuredArticles,
      trendingArticles,
      totalViews,
      totalLikes,
      totalComments,
      totalSaves
    ] = await Promise.all([
      // Total articles
      this.prisma.article.count({ 
        where: { status: ArticleStatus.PUBLISHED } 
      }),
      
      // Free articles
      this.prisma.article.count({
        where: { 
          status: ArticleStatus.PUBLISHED,
          accessType: ContentAccess.FREE 
        },
      }),
      
      // Premium articles
      this.prisma.article.count({
        where: { 
          status: ArticleStatus.PUBLISHED,
          accessType: ContentAccess.PREMIUM 
        },
      }),
      
      // Featured articles
      this.prisma.article.count({
        where: { 
          status: ArticleStatus.PUBLISHED,
          isFeatured: true 
        },
      }),
      
      // Trending articles
      this.prisma.article.count({
        where: { 
          status: ArticleStatus.PUBLISHED,
          isTrending: true 
        },
      }),
      
      // Total views
      this.prisma.articleView.count(),
      
      // Total likes
      this.prisma.articleLike.count(),
      
      // Total comments
      this.prisma.articleComment.count(),
      
      // Total saves
      this.prisma.articleSave.count(),
    ]);

    return {
      totalArticles,
      freeArticles,
      premiumArticles,
      featuredArticles,
      trendingArticles,
      totalViews,
      totalLikes,
      totalComments,
      totalSaves,
      averageRating: 4.5, // You'll need to implement ratings
    };
  }



  public getArticlePreview(article: any) {
    // Simple preview version without full content
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      preview: article.excerpt?.substring(0, 200) + (article.excerpt?.length > 200 ? '...' : ''),
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
      viewCount: article.viewCount || 0,
      likeCount: article.likeCount || 0,
      commentCount: article.commentCount || 0,
      publishedAt: article.publishedAt,
      availableLanguages: article.availableLanguages || [],
      isPreview: true,
      requiresPurchase: article.accessType === ContentAccess.PREMIUM,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }


  // Add to the existing class
  async getPublicUserReadingStats(userId: string) {
    try {
      // This is the same as getUserReadingStats but might have different privacy rules
      return await this.getUserReadingStats(userId);
    } catch (error) {
      this.logger.error(`Failed to get public reading stats for user ${userId}:`, error);
      return null;
    }
  }

  async getPublicReadingProfile(userId: string) {
    try {
      const result = await this.getReadingProfile(userId);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get public reading profile for user ${userId}:`, error);
      return null;
    }
  }

  async getPublicUserAchievements(userId: string) {
    try {
      const achievements = await this.getUserAchievements(userId);
      // Return only unlocked achievements for public view
      return {
        ...achievements,
        achievements: achievements.achievements.filter(a => a.unlocked),
      };
    } catch (error) {
      this.logger.error(`Failed to get public achievements for user ${userId}:`, error);
      return null;
    }
  }

  async getUserPublishedArticles(userId: string, page: number = 1, limit: number = 5) {
    return this.listArticles({
      authorId: userId,
      status: ArticleStatus.PUBLISHED,
      page,
      limit,
    });
  }



  // ========== SUPER_ADMIN METHODS ==========
  

async getSystemStats() {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalSuperAdmins,
      totalArticles,
      totalRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count(),
      
      // Total admins (excluding super admins)
      this.prisma.user.count({ 
        where: { role: 'ADMIN' } 
      }),
      
      // Total super admins
      this.prisma.user.count({ 
        where: { role: 'SUPER_ADMIN' } 
      }),
      
      // Total articles
      this.prisma.article.count(),
      
      // Total revenue from wallet transactions
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEBIT' }
      }),
      
      // Active subscriptions
      this.prisma.userSubscription.count({ 
        where: { 
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        } 
      }),
    ]);

    // Get active users using groupBy instead of distinct
    const dailyActiveUsersResult = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
    });

    const monthlyActiveUsersResult = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
    });

    // System health check
    const systemHealth = await this.checkSystemHealth();

    // Get storage statistics
    const storageStats = await this.getStorageStatistics();
    
    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics();

    return {
      // User statistics
      users: {
        total: totalUsers,
        admins: totalAdmins,
        superAdmins: totalSuperAdmins,
        dailyActive: dailyActiveUsersResult.length,
        monthlyActive: monthlyActiveUsersResult.length,
        growthRate: await this.calculateUserGrowthRate(),
      },
      
      // Content statistics
      content: {
        totalArticles: totalArticles,
        publishedArticles: await this.prisma.article.count({ 
          where: { status: ArticleStatus.PUBLISHED } 
        }),
        draftArticles: await this.prisma.article.count({ 
          where: { status: ArticleStatus.DRAFT } 
        }),
        premiumArticles: await this.prisma.article.count({ 
          where: { 
            status: ArticleStatus.PUBLISHED,
            accessType: ContentAccess.PREMIUM 
          } 
        }),
        totalTranslations: await this.prisma.articleTranslation.count(),
      },
      
      // Financial statistics
      financial: {
        totalRevenue: totalRevenue._sum.amount || 0,
        activeSubscriptions: activeSubscriptions,
        monthlyRecurringRevenue: await this.calculateMRR(),
        averageTransactionValue: await this.calculateATV(),
        topEarningArticles: await this.getTopEarningArticles(10),
      },
      
      // Engagement statistics
      engagement: {
        totalViews: await this.prisma.articleView.count(),
        totalLikes: await this.prisma.articleLike.count(),
        totalComments: await this.prisma.articleComment.count(),
        totalSaves: await this.prisma.articleSave.count(),
        averageEngagementRate: await this.calculateAverageEngagementRate(),
      },
      
      // System information
      system: {
        health: systemHealth,
        storage: storageStats,
        performance: performanceMetrics,
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      
      // Recent activity
      recentActivity: {
        newUsers: await this.getRecentUsers(5),
        newArticles: await this.getRecentArticles(),
        systemAlerts: await this.getSystemAlerts(),
      }
    };
  } catch (error) {
    this.logger.error('Error getting system stats:', error);
    throw new BadRequestException('Failed to retrieve system statistics');
  }
}



async getAllUsers(page: number = 1, limit: number = 20, filters?: {
  role?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (filters) {
      if (filters.role) {
        where.role = filters.role;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }
    }
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          picture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              articles: {
                where: { status: ArticleStatus.PUBLISHED }
              },
              articleComments: {
                where: { status: 'ACTIVE' }
              },
              articleLikes: true,
              articleSaves: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Enhance user data with additional statistics
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        // Get reading statistics
        const readingStats = await this.getUserReadingStats(user.id);
        
        // Get premium access information
        const premiumAccess = await this.prisma.premiumAccess.count({
          where: { 
            userId: user.id,
            accessUntil: { gt: new Date() }
          }
        });
        
        // Get subscription information
        const subscription = await this.prisma.userSubscription.findFirst({
          where: { 
            userId: user.id,
            status: 'ACTIVE',
            currentPeriodEnd: { gt: new Date() }
          },
          select: {
            planId: true,
            amount: true,
            currentPeriodEnd: true,
          }
        });

        return {
          ...user,
          readingStats: {
            totalArticlesRead: readingStats.totalArticlesRead,
            totalReadingTime: readingStats.totalReadingTime,
            readingStreak: readingStats.readingStreak,
          },
          premiumAccess: {
            hasAccess: premiumAccess > 0 || !!subscription,
            purchasedArticles: premiumAccess,
            hasActiveSubscription: !!subscription,
            subscriptionPlan: subscription?.planId,
            subscriptionEnd: subscription?.currentPeriodEnd,
          },
          activityScore: await this.calculateUserActivityScore(user.id),
        };
      })
    );

    return {
      users: enhancedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: total > skip + limit,
        filters,
      },
    };
  } catch (error) {
    this.logger.error('Error getting all users:', error);
    throw new BadRequestException('Failed to retrieve users');
  }
}

async getFinancialOverview() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    const [
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      subscriptionRevenue,
      oneTimePurchases,
      topEarningArticles,
      revenueByMonth,
      userSpendingStats,
    ] = await Promise.all([
      // Total revenue
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'DEBIT' }
      }),
      
      // Monthly revenue
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          type: 'DEBIT',
          createdAt: { gte: monthStart }
        }
      }),
      
      // Yearly revenue
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { 
          type: 'DEBIT',
          createdAt: { gte: yearStart }
        }
      }),
      
      // Subscription revenue (active subscriptions)
      this.prisma.userSubscription.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        }
      }),
      
      // One-time purchases
      this.prisma.premiumAccess.aggregate({
        _sum: { amountPaid: true },
        where: {
          createdAt: { gte: monthStart }
        }
      }),
      
      // Top earning articles
      this.prisma.premiumAccess.groupBy({
        by: ['articleId'],
        _sum: { amountPaid: true },
        _count: { userId: true },
        orderBy: { _sum: { amountPaid: 'desc' } },
        take: 10,
      }),
      
      // Revenue by month (last 6 months)
      this.getRevenueByMonth(6),
      
      // User spending statistics
      this.getUserSpendingStats(),
    ]);

    // Get article details for top earners
    const topEarningArticlesWithDetails = await Promise.all(
      topEarningArticles.map(async (item) => {
        const article = await this.prisma.article.findUnique({
          where: { id: item.articleId },
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        });
        
        return {
          article,
          totalRevenue: item._sum.amountPaid || 0,
          totalPurchases: item._count.userId || 0,
          averageRevenuePerUser: item._count.userId > 0 
            ? (item._sum.amountPaid || 0) / item._count.userId 
            : 0,
        };
      })
    );

    return {
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        yearlyRevenue: yearlyRevenue._sum.amount || 0,
        subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
        oneTimePurchases: oneTimePurchases._sum.amountPaid || 0,
        averageMonthlyGrowth: await this.calculateRevenueGrowth(),
      },
      
      breakdown: {
        byMonth: revenueByMonth,
        bySource: {
          subscriptions: subscriptionRevenue._sum.amount || 0,
          articlePurchases: oneTimePurchases._sum.amountPaid || 0,
          other: 0, // Add other sources if you have them
        },
      },
      
      topPerformers: {
        articles: topEarningArticlesWithDetails,
        authors: await this.getTopEarningAuthors(5),
      },
      
      userInsights: {
        averageSpend: userSpendingStats.averageSpend,
        topSpenders: userSpendingStats.topSpenders,
        conversionRate: await this.calculateConversionRate(),
      },
      
      forecasts: {
        nextMonthRevenue: await this.forecastNextMonthRevenue(),
        expectedGrowth: await this.calculateExpectedGrowth(),
      },
    };
  } catch (error) {
    this.logger.error('Error getting financial overview:', error);
    throw new BadRequestException('Failed to retrieve financial overview');
  }
}

async getAuditLogs(
  page: number = 1, 
  limit: number = 50,
  filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    severity?: string;
  }
) {
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (filters) {
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.action) {
        where.action = filters.action;
      }
      
      if (filters.resourceType) {
        where.resourceType = filters.resourceType;
      }
      
      if (filters.severity) {
        where.severity = filters.severity;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }
    }
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              role: true,
              picture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Group logs by action type for summary
    const actionSummary = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
    });

    // Get severity distribution
    const severityDistribution = await this.prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: { id: true },
    });

    return {
      logs: logs.map((log: any) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      summary: {
        total,
        actionSummary,
        severityDistribution,
        timeRange: {
          oldest: logs[logs.length - 1]?.createdAt,
          newest: logs[0]?.createdAt,
        },
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: total > skip + limit,
        filters,
      },
    };
  } catch (error) {
    this.logger.error('Error getting audit logs:', error);
    throw new BadRequestException('Failed to retrieve audit logs');
  }
}

// ========== HELPER METHODS FOR SUPER_ADMIN ==========

private async checkSystemHealth() {
  try {
    // Check database connection
    await this.prisma.$queryRaw`SELECT 1`;
    
    // Check all critical tables
    const tableChecks = await Promise.all([
      this.prisma.user.count().then(count => ({ table: 'users', count, status: count >= 0 ? 'OK' : 'ERROR' })),
      this.prisma.article.count().then(count => ({ table: 'articles', count, status: count >= 0 ? 'OK' : 'ERROR' })),
      this.prisma.articleCategory.count().then(count => ({ table: 'categories', count, status: count >= 0 ? 'OK' : 'ERROR' })),
      this.prisma.walletTransaction.count().then(count => ({ table: 'transactions', count, status: count >= 0 ? 'OK' : 'ERROR' })),
    ]);
    
    // Check for any pending migrations
    const migrationStatus = 'UP_TO_DATE'; // You would check your migration system here
    
    // Check disk space (simplified - in production use system calls)
    const diskStatus = {
      free: '> 1GB', // Placeholder
      total: '10GB', // Placeholder
      usage: '60%', // Placeholder
      status: 'HEALTHY',
    };
    
    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      database: {
        status: 'CONNECTED',
        tables: tableChecks,
        migrationStatus,
      },
      storage: diskStatus,
      api: {
        status: 'RUNNING',
        responseTime: '~50ms', // You would measure this
        uptime: process.uptime(),
      },
      warnings: await this.getSystemWarnings(),
    };
  } catch (error) {
    return {
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      database: {
        status: 'DISCONNECTED',
        error: error.message,
      },
      storage: {
        status: 'UNKNOWN',
        error: 'Cannot check storage',
      },
      api: {
        status: 'ERROR',
        error: error.message,
      },
    };
  }
}

private async getStorageStatistics() {
  try {
    // Estimate storage usage (this is simplified)
    const articleCount = await this.prisma.article.count();
    const translationCount = await this.prisma.articleTranslation.count();
    const userCount = await this.prisma.user.count();
    
    // Rough estimates (in MB)
    const articleStorage = articleCount * 0.05; // 50KB per article
    const translationStorage = translationCount * 0.03; // 30KB per translation
    const userStorage = userCount * 0.01; // 10KB per user
    const imageStorage = articleCount * 0.5; // 500KB per article image
    
    const totalStorage = articleStorage + translationStorage + userStorage + imageStorage;
    
    return {
      total: totalStorage,
      breakdown: {
        articles: articleStorage,
        translations: translationStorage,
        users: userStorage,
        images: imageStorage,
      },
      unit: 'MB',
      estimatedCost: totalStorage * 0.023, // $0.023 per GB-month (example)
    };
  } catch (error) {
    this.logger.error('Error calculating storage stats:', error);
    return {
      total: 0,
      breakdown: {},
      unit: 'MB',
      estimatedCost: 0,
      error: 'Failed to calculate storage',
    };
  }
}

private async getPerformanceMetrics() {
  try {
    // Get recent response times (you would collect these over time)
    const recentRequests = await this.prisma.auditLog.findMany({
      where: {
        resourceType: 'API_REQUEST',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate average response time (simplified)
    const responseTimes = recentRequests
      .map((log: any) => {
        const details = log.details ? JSON.parse(log.details) : {};
        return details.responseTime || 0;
      })
      .filter((time: any) => time > 0);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a: any, b: any) => a + b, 0) / responseTimes.length
      : 0;
    
    // Get error rate
    const errorLogs = await this.prisma.auditLog.count({
      where: {
        severity: 'ERROR',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    
    const totalLogs = await this.prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
    
    return {
      responseTime: {
        average: avgResponseTime,
        p95: 0, // You would calculate percentiles
        p99: 0,
        unit: 'ms',
      },
      errors: {
        rate: errorRate,
        count: errorLogs,
        unit: '%',
      },
      throughput: {
        requestsPerMinute: recentRequests.length / 60,
        activeUsers: await this.prisma.userEngagement.groupBy({
          by: ['userId'],
          where: {
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            },
          },
        }).then(groups => groups.length),
      },
      database: {
        connectionPool: 'HEALTHY', // You would check your connection pool
        queryPerformance: 'GOOD',
      },
    };
  } catch (error) {
    this.logger.error('Error getting performance metrics:', error);
    return {
      responseTime: { average: 0, p95: 0, p99: 0, unit: 'ms' },
      errors: { rate: 0, count: 0, unit: '%' },
      throughput: { requestsPerMinute: 0, activeUsers: 0 },
      database: { connectionPool: 'UNKNOWN', queryPerformance: 'UNKNOWN' },
    };
  }
}

private async calculateUserGrowthRate(): Promise<number> {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    const [currentMonthUsers, lastMonthUsers] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: lastMonth } }
      }),
      this.prisma.user.count({
        where: { 
          createdAt: { 
            gte: twoMonthsAgo,
            lt: lastMonth 
          }
        }
      }),
    ]);
    
    if (lastMonthUsers === 0) return currentMonthUsers > 0 ? 100 : 0;
    
    return ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
  } catch (error) {
    return 0;
  }
}

private async calculateMRR(): Promise<number> {
  try {
    const activeSubscriptions = await this.prisma.userSubscription.findMany({
      where: { 
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() }
      },
      select: { amount: true }
    });
    
    return activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
  } catch (error) {
    return 0;
  }
}

private async calculateATV(): Promise<number> {
  try {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { 
        type: 'DEBIT',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      select: { amount: true }
    });
    
    if (transactions.length === 0) return 0;
    
    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return total / transactions.length;
  } catch (error) {
    return 0;
  }
}

private async getTopEarningArticles(limit: number = 10) {
  try {
    const topArticles = await this.prisma.premiumAccess.groupBy({
      by: ['articleId'],
      _sum: { amountPaid: true },
      _count: { userId: true },
      orderBy: { _sum: { amountPaid: 'desc' } },
      take: limit,
    });
    
    return await Promise.all(
      topArticles.map(async (item) => {
        const article = await this.prisma.article.findUnique({
          where: { id: item.articleId },
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        });
        
        return {
          article,
          revenue: item._sum.amountPaid || 0,
          purchases: item._count.userId || 0,
        };
      })
    );
  } catch (error) {
    this.logger.error('Error getting top earning articles:', error);
    return [];
  }
}

private async calculateAverageEngagementRate(): Promise<number> {
  try {
    const articles = await this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      select: { id: true, viewCount: true, likeCount: true, commentCount: true },
      take: 100,
    });
    
    if (articles.length === 0) return 0;
    
    const totalEngagement = articles.reduce((sum, article) => {
      const views = article.viewCount || 0;
      const engagement = (article.likeCount || 0) + (article.commentCount || 0);
      return views > 0 ? sum + (engagement / views) * 100 : sum;
    }, 0);
    
    return totalEngagement / articles.length;
  } catch (error) {
    return 0;
  }
}

private async getRecentUsers(limit: number = 5) {
  try {
    return await this.prisma.user.findMany({
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    return [];
  }
}

private async getSystemAlerts() {
  try {
    // Check for potential issues
    const alerts = [];
    
    // Check for failed translations
    const failedTranslations = await this.prisma.articleTranslation.count({
      where: { status: 'FAILED' }
    });
    
    if (failedTranslations > 10) {
      alerts.push({
        type: 'TRANSLATION_ERROR',
        message: `${failedTranslations} translations have failed`,
        severity: 'WARNING',
        action: 'Review translation failures',
      });
    }
    
    // Check for articles without categories
    const uncategorizedArticles = await this.prisma.article.count({
      where: { 
        OR: [
          { categoryId: "" }
        ]
      }
    });
    
    if (uncategorizedArticles > 0) {
      alerts.push({
        type: 'CONTENT_QUALITY',
        message: `${uncategorizedArticles} articles are uncategorized`,
        severity: 'INFO',
        action: 'Assign categories to articles',
      });
    }
    
    // Check for users with many failed logins
    const failedLogins = await this.prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    if (failedLogins > 10) {
      alerts.push({
        type: 'SECURITY',
        message: `${failedLogins} failed login attempts in last 24 hours`,
        severity: 'WARNING',
        action: 'Review security logs',
      });
    }
    
    return alerts;
  } catch (error) {
    return [];
  }
}

private async getRevenueByMonth(months: number = 6) {
  try {
    const results = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const revenue = await this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      
      results.unshift({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: revenue._sum.amount || 0,
        startDate: monthStart,
        endDate: monthEnd,
      });
    }
    
    return results;
  } catch (error) {
    this.logger.error('Error getting revenue by month:', error);
    return [];
  }
}

private async getUserSpendingStats() {
  try {
    // Get top spenders
    const topSpenders = await this.prisma.walletTransaction.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      where: { type: 'DEBIT' },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    
    // Calculate average spend
    const allSpending = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true },
      where: { type: 'DEBIT' },
    });
    
    // Get user details for top spenders
    const topSpendersWithDetails = await Promise.all(
      topSpenders.map(async (spender) => {
        const user = await this.prisma.user.findUnique({
          where: { id: spender.userId || '' },
          // ... rest of code
        });
      })
    );
    
    return {
      averageSpend: allSpending._avg.amount || 0,
      totalSpent: allSpending._sum.amount || 0,
      totalTransactions: allSpending._count.id || 0,
      topSpenders: topSpendersWithDetails,
    };
  } catch (error) {
    this.logger.error('Error getting user spending stats:', error);
    return {
      averageSpend: 0,
      totalSpent: 0,
      totalTransactions: 0,
      topSpenders: [],
    };
  }
}

private async getTopEarningAuthors(limit: number = 5) {
  try {
    // Get authors whose articles have earned revenue
    const authorRevenue = await this.prisma.premiumAccess.groupBy({
      by: ['articleId'],
      _sum: { amountPaid: true },
    });
    
    // Get article authors
    const articleAuthors = await Promise.all(
      authorRevenue.map(async (item) => {
        const article = await this.prisma.article.findUnique({
          where: { id: item.articleId },
          select: {
            authorId: true,
            title: true,
          },
        });
        
        return {
          authorId: article?.authorId,
          articleTitle: article?.title,
          revenue: item._sum.amountPaid || 0,
        };
      })
    );
    
    // Group by author
    const authorMap = new Map<string, { revenue: number; articles: number }>();
    
    articleAuthors.forEach((item) => {
      if (item.authorId) {
        const current = authorMap.get(item.authorId) || { revenue: 0, articles: 0 };
        authorMap.set(item.authorId, {
          revenue: current.revenue + item.revenue,
          articles: current.articles + 1,
        });
      }
    });
    
    // Convert to array and sort
    const sortedAuthors = Array.from(authorMap.entries())
      .map(([authorId, stats]) => ({ authorId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
    
    // Get author details
    return await Promise.all(
      sortedAuthors.map(async (item) => {
        const author = await this.prisma.user.findUnique({
          where: { id: item.authorId },
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        });
        
        return {
          author,
          totalRevenue: item.revenue,
          articleCount: item.articles,
          averagePerArticle: item.revenue / item.articles,
        };
      })
    );
  } catch (error) {
    this.logger.error('Error getting top earning authors:', error);
    return [];
  }
}

private async calculateRevenueGrowth(): Promise<number> {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    const [currentMonth, lastMonth] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          createdAt: { gte: currentMonthStart }
        }
      }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          createdAt: { 
            gte: lastMonthStart,
            lt: currentMonthStart
          }
        }
      }),
    ]);
    
    const currentRevenue = currentMonth._sum.amount || 0;
    const previousRevenue = lastMonth._sum.amount || 0;
    
    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  } catch (error) {
    return 0;
  }
}


private async calculateConversionRate(): Promise<number> {
  try {
    const totalUsers = await this.prisma.user.count();
    
    // Get unique users with wallet transactions
    const payingUsersGroups = await this.prisma.walletTransaction.groupBy({
      by: ['userId'],
      where: { type: 'DEBIT' }
    });
    
    const payingUsers = payingUsersGroups.length;
    
    if (totalUsers === 0) return 0;
    
    return (payingUsers / totalUsers) * 100;
  } catch (error) {
    this.logger.error('Error calculating conversion rate:', error);
    return 0;
  }
}

private async forecastNextMonthRevenue(): Promise<number> {
  try {
    // Simple forecast based on last 3 months average
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const revenue = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'DEBIT',
        createdAt: { gte: threeMonthsAgo }
      }
    });
    
    const totalRevenue = revenue._sum.amount || 0;
    const monthlyAverage = totalRevenue / 3;
    
    // Apply growth factor (conservative estimate)
    const growthFactor = 1.05; // 5% growth
    return monthlyAverage * growthFactor;
  } catch (error) {
    return 0;
  }
}

private async calculateExpectedGrowth(): Promise<number> {
  try {
    const growthRate = await this.calculateRevenueGrowth();
    
    // Apply seasonal factors (simplified)
    const month = new Date().getMonth();
    let seasonalFactor = 1.0;
    
    // Adjust based on month (example)
    if (month >= 11 || month <= 1) seasonalFactor = 1.15; // Holiday season
    if (month >= 6 && month <= 8) seasonalFactor = 0.9; // Summer slowdown
    
    return growthRate * seasonalFactor;
  } catch (error) {
    return 0;
  }
}

private async calculateUserActivityScore(userId: string): Promise<number> {
  try {
    const [
      articleCount,
      commentCount,
      likeCount,
      saveCount,
      lastActivity,
    ] = await Promise.all([
      this.prisma.article.count({ where: { authorId: userId, status: ArticleStatus.PUBLISHED } }),
      this.prisma.articleComment.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.articleLike.count({ where: { userId } }),
      this.prisma.articleSave.count({ where: { userId } }),
      this.prisma.userEngagement.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);
    
    // Calculate score based on various factors
    let score = 0;
    
    // Articles published
    score += Math.min(articleCount * 10, 50);
    
    // Comments made
    score += Math.min(commentCount * 2, 20);
    
    // Engagement (likes + saves)
    score += Math.min((likeCount + saveCount) * 1, 20);
    
    // Recent activity (within last week)
    if (lastActivity && lastActivity.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  } catch (error) {
    return 0;
  }
}

private async getSystemWarnings(): Promise<string[]> {
  const warnings = [];
  
  // Check database connection health
  try {
    await this.prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    warnings.push('Database connection unstable');
  }
  
  // Check for outdated articles
  const outdatedArticles = await this.prisma.article.count({
    where: {
      status: ArticleStatus.PUBLISHED,
      updatedAt: {
        lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Older than 1 year
      }
    }
  });
  
  if (outdatedArticles > 0) {
    warnings.push(`${outdatedArticles} articles haven't been updated in over a year`);
  }
  
  // Check for articles without translations but with target languages
  const untranslatedArticles = await this.prisma.article.count({
    where: {
      autoTranslate: true,
      targetLanguages: { isEmpty: false },
      translations: { none: {} }
    }
  });
  
  if (untranslatedArticles > 0) {
    warnings.push(`${untranslatedArticles} articles have pending translations`);
  }
  
  return warnings;
}

}