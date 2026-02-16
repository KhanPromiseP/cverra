// category.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { slugify } from '../auth/utils/slugify';
import { TranslationService } from './translation.service';
import { CategoryTranslationStatus } from '@prisma/client';

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

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
  ) {}

  // In category.service.ts - Fix the getAllCategories method
async getAllCategories(language?: string) {
  console.log('🔍 getAllCategories called with language:', language);
  
  const categories = await this.prisma.articleCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      translations: true, // Include ALL translations
      _count: {
        select: {
          articles: {
            where: { status: ArticleStatus.PUBLISHED }
          }
        }
      }
    },
  });

  console.log(`🔍 Found ${categories.length} categories`);
  
  const processedCategories = categories.map(category => {
    // Get article count
    const articleCount = category._count?.articles || 0;
    
    // Debug: Log what translations exist
    console.log(`📄 Category "${category.name}" has ${category.translations?.length || 0} translations`);
    if (category.translations?.length > 0) {
      console.log('   Translations:', category.translations.map(t => ({
        language: t.language,
        name: t.name,
        status: t.status
      })));
    }
    
    // Find translation for requested language
    let translation = null;
    if (language && language !== 'en' && category.translations) {
      // Try exact match first
      translation = category.translations.find(t => 
        t.language === language
      );
      
      // If not found, try language code (fr-FR -> fr)
      if (!translation) {
        translation = category.translations.find(t => 
          t.language === language.split('-')[0]
        );
      }
      
      // Debug
      if (translation) {
        console.log(`✅ Found ${language} translation for "${category.name}":`, translation.name);
      } else {
        console.log(`❌ No ${language} translation found for "${category.name}"`);
      }
    }

    // Apply translation if found
    if (translation && translation.status === CategoryTranslationStatus.COMPLETED) {
      return {
        ...category,
        id: category.id,
        name: translation.name || category.name,  // Use translated name
        description: translation.description || category.description,  // Use translated description
        slug: translation.slug || category.slug,
        // Original data for reference
        originalName: category.name,
        originalDescription: category.description,
        originalSlug: category.slug,
        // Translation metadata
        isTranslated: true,  // IMPORTANT: Set to true
        translationLanguage: translation.language,  // IMPORTANT: Set to French
        translationQuality: translation.qualityScore,
        translationConfidence: translation.confidence,
        translationNeedsReview: translation.needsReview,
        // Stats
        articleCount,
        // Include all available languages
        availableLanguages: category.availableLanguages || ['en'],
      };
    }

    // Return original category (English)
    return {
      ...category,
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      isTranslated: false,
      translationLanguage: 'en',
      articleCount,
      availableLanguages: category.availableLanguages || ['en'],
    };
  });

  console.log(`✅ Processed ${processedCategories.length} categories`);
  return processedCategories;
}

async getCategoryBySlug(slug: string, language?: string) {
  // Try to find by original slug first
  let category = await this.prisma.articleCategory.findUnique({
    where: { slug, isActive: true },
    include: {
      translations: true,
      _count: {
        select: {
          articles: {
            where: { status: ArticleStatus.PUBLISHED }
          }
        }
      }
    },
  });

  // If not found by original slug, try to find by translated slug
  if (!category) {
    const translation = await this.prisma.categoryTranslation.findFirst({
      where: {
        slug,
        status: CategoryTranslationStatus.COMPLETED,
      },
      include: {
        category: {
          include: {
            translations: true,
            _count: {
              select: {
                articles: {
                  where: { status: ArticleStatus.PUBLISHED }
                }
              }
            }
          },
        },
      },
    });

    if (!translation) {
      throw new NotFoundException('Category not found');
    }

    category = translation.category;
    
    // Use this translation
    return {
      ...category,
      id: category.id,
      name: translation.name || category.name,
      description: translation.description || category.description,
      slug: translation.slug || category.slug,
      originalName: category.name,
      originalDescription: category.description,
      originalSlug: category.slug,
      isTranslated: true,
      translationLanguage: translation.language,
      translationQuality: translation.qualityScore,
      translationConfidence: translation.confidence,
      translationNeedsReview: translation.needsReview,
      articleCount: category._count?.articles || 0,
      availableLanguages: category.availableLanguages || ['en'],
    };
  }

  // Get article count
  const articleCount = category._count?.articles || 0;

  // Apply translation if language is specified and not English
  if (language && language !== 'en') {
    const translation = category.translations?.find(t => 
      t.language === language || 
      t.language === language.split('-')[0]
    );

    if (translation) {
      return {
        ...category,
        id: category.id,
        name: translation.name || category.name,
        description: translation.description || category.description,
        slug: translation.slug || category.slug,
        originalName: category.name,
        originalDescription: category.description,
        originalSlug: category.slug,
        isTranslated: true,
        translationLanguage: translation.language,
        translationQuality: translation.qualityScore,
        translationConfidence: translation.confidence,
        translationNeedsReview: translation.needsReview,
        articleCount,
        availableLanguages: category.availableLanguages || ['en'],
      };
    }
  }

  // Return original category
  return {
    ...category,
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    isTranslated: false,
    translationLanguage: 'en',
    articleCount,
    availableLanguages: category.availableLanguages || ['en'],
  };
}

  async createCategory(dto: any) {
    const slug = slugify(dto.name);
    
    // Check if slug exists
    const existing = await this.prisma.articleCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    // Get max order
    const maxOrder = await this.prisma.articleCategory.aggregate({
      _max: { order: true },
    });

    const category = await this.prisma.articleCategory.create({
      data: {
        ...dto,
        slug,
        order: maxOrder._max.order ? maxOrder._max.order + 1 : 1,
        // Set default translation settings
        autoTranslate: dto.autoTranslate ?? true,
        targetLanguages: dto.targetLanguages || ['fr', 'es', 'de'],
        availableLanguages: ['en'],
      },
    });

    // Trigger translations if auto-translate is enabled
    if (category.autoTranslate && category.targetLanguages && category.targetLanguages.length > 0) {
      this.queueCategoryTranslations(category.id, category.targetLanguages);
    }

    return category;
  }

  async updateCategory(id: string, dto: any) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = {};
    let nameChanged = false;
    let descriptionChanged = false;
    let targetLanguagesChanged = false;

    // Update only provided fields
    if (dto.name !== undefined && dto.name !== category.name) {
      updateData.name = dto.name;
      updateData.slug = slugify(dto.name);
      nameChanged = true;
    }

    if (dto.description !== undefined && dto.description !== category.description) {
      updateData.description = dto.description;
      descriptionChanged = true;
    }

    if (dto.autoTranslate !== undefined) {
      updateData.autoTranslate = dto.autoTranslate;
    }

    if (dto.targetLanguages !== undefined) {
      const newTargetLanguages = Array.isArray(dto.targetLanguages)
        ? dto.targetLanguages.filter((lang: any) => lang && lang.trim() !== '' && lang !== 'en')
        : [];
      
      const currentTargetLanguages = Array.isArray(category.targetLanguages)
        ? category.targetLanguages
        : [];
      
      targetLanguagesChanged = JSON.stringify(newTargetLanguages.sort()) !== JSON.stringify(currentTargetLanguages.sort());
      
      if (targetLanguagesChanged) {
        updateData.targetLanguages = newTargetLanguages;
      }
    }

    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.order !== undefined) updateData.order = dto.order;

    const updatedCategory = await this.prisma.articleCategory.update({
      where: { id },
      data: updateData,
    });

    // Handle translations if needed
    if (updatedCategory.autoTranslate && 
        updatedCategory.targetLanguages && 
        updatedCategory.targetLanguages.length > 0 &&
        (nameChanged || descriptionChanged || targetLanguagesChanged)) {
      
      await this.handleCategoryTranslations(
        updatedCategory,
        category,
        nameChanged,
        descriptionChanged,
        targetLanguagesChanged
      );
    }

    return updatedCategory;
  }

  public async queueCategoryTranslations(categoryId: string, targetLanguages: string[]) {
    process.nextTick(async () => {
      try {
        this.logger.log(`Starting category translations for category ${categoryId}`);
        
        const results = await this.processCategoryTranslationsInBackground(categoryId, targetLanguages);
        
        // Update available languages
        await this.updateCategoryAvailableLanguages(categoryId);
        
        this.logger.log(`Category translations completed: ${results.successful} successful, ${results.failed} failed`);
        
      } catch (error) {
        this.logger.error(`Category translation queue failed:`, error);
      }
    });
  }

  private async handleCategoryTranslations(
    updatedCategory: any,
    originalCategory: any,
    nameChanged: boolean,
    descriptionChanged: boolean,
    targetLanguagesChanged: boolean
  ) {
    if (!updatedCategory.autoTranslate || 
        !updatedCategory.targetLanguages ||
        updatedCategory.targetLanguages.length === 0) {
      return;
    }

    try {
      // Get existing translations
      const existingTranslations = await this.prisma.categoryTranslation.findMany({
        where: {
          categoryId: updatedCategory.id,
          status: CategoryTranslationStatus.COMPLETED,
        },
      });

      const existingLanguages = existingTranslations.map(t => t.language);
      
      // Determine which languages need translation
      const languagesToProcess: string[] = [];
      
      for (const targetLang of updatedCategory.targetLanguages) {
        if (targetLang === 'en') continue;
        
        const existingTranslation = existingTranslations.find(t => t.language === targetLang);
        
        if (!existingTranslation) {
          // New translation needed
          languagesToProcess.push(targetLang);
        } else if (nameChanged || descriptionChanged || targetLanguagesChanged) {
          // Content changed - check if translation is stale
          const translationAge = Date.now() - new Date(existingTranslation.updatedAt).getTime();
          const isStale = translationAge > 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (isStale) {
            languagesToProcess.push(targetLang);
          }
        }
      }

      if (languagesToProcess.length > 0) {
        await this.processCategoryTranslationsInBackground(updatedCategory.id, languagesToProcess);
        await this.updateCategoryAvailableLanguages(updatedCategory.id);
      }
      
    } catch (error) {
      this.logger.error('Error in category translation handling:', error);
    }
  }

  private async processCategoryTranslationsInBackground(
    categoryId: string,
    targetLanguages: string[]
  ) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const language of targetLanguages) {
      if (language === 'en') continue;

      try {
        // Create translation job
        const job = await this.prisma.categoryTranslationJob.create({
          data: {
            categoryId,
            targetLanguage: language,
            status: CategoryTranslationStatus.PROCESSING,
            startedAt: new Date(),
          },
        });

        try {
          // Translate category using existing translation service
          const translationResult = await this.translationService.performTranslation(
            {
              title: category.name,
              excerpt: category.description || '',
              content: null,
            },
            language,
            'llama-3.3-70b-versatile'
          );

          // Create or update translation
          const translation = await this.prisma.categoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId,
                language,
              },
            },
            update: {
              name: translationResult.title,
              description: translationResult.excerpt,
              slug: slugify(translationResult.title),
              status: CategoryTranslationStatus.COMPLETED,
              confidence: translationResult.confidence,
              needsReview: translationResult.needsReview,
              qualityScore: translationResult.confidence > 0.9 ? 5 : 3,
              updatedAt: new Date(),
            },
            create: {
              categoryId,
              language,
              name: translationResult.title,
              description: translationResult.excerpt,
              slug: slugify(translationResult.title),
              status: CategoryTranslationStatus.COMPLETED,
              confidence: translationResult.confidence,
              needsReview: translationResult.needsReview,
              qualityScore: translationResult.confidence > 0.9 ? 5 : 3,
            },
          });

          // Update job status
          await this.prisma.categoryTranslationJob.update({
            where: { id: job.id },
            data: {
              status: CategoryTranslationStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          results.push({ language, success: true, translationId: translation.id });
          successful++;
        } catch (translationError) {
          // Update job as failed
          await this.prisma.categoryTranslationJob.update({
            where: { id: job.id },
            data: {
              status: CategoryTranslationStatus.FAILED,
              errorMessage: translationError.message,
              completedAt: new Date(),
            },
          });

          results.push({ language, success: false, error: translationError.message });
          failed++;
        }
      } catch (error) {
        results.push({ language, success: false, error: error.message });
        failed++;
      }
    }

    return { successful, failed, results };
  }

  private async updateCategoryAvailableLanguages(categoryId: string) {
    try {
      const translations = await this.prisma.categoryTranslation.findMany({
        where: {
          categoryId,
          status: CategoryTranslationStatus.COMPLETED,
        },
        select: {
          language: true,
        },
      });

      const availableLanguages = ['en', ...translations.map(t => t.language)];
      
      await this.prisma.articleCategory.update({
        where: { id: categoryId },
        data: {
          availableLanguages: Array.from(new Set(availableLanguages)),
        },
      });
      
      this.logger.log(`Updated available languages for category ${categoryId}`);
    } catch (error) {
      this.logger.error(`Failed to update available languages:`, error);
    }
  }
// async getCategoryBySlug(slug: string, language?: string) {
//   // First, try to find category by original slug
//   let category = await this.prisma.articleCategory.findUnique({
//     where: { slug, isActive: true },
//     include: {
//       translations: language && language !== 'en' ? {
//         where: {
//           language,
//           status: CategoryTranslationStatus.COMPLETED,
//         },
//       } : undefined,
//     },
//   });

//   // If not found by original slug, try to find by translated slug
//   if (!category) {
//     const translation = await this.prisma.categoryTranslation.findFirst({
//       where: {
//         slug,
//         status: CategoryTranslationStatus.COMPLETED,
//       },
//       include: {
//         category: {
//           include: {
//             translations: language && language !== 'en' ? {
//               where: {
//                 language,
//                 status: CategoryTranslationStatus.COMPLETED,
//               },
//             } : undefined,
//           },
//         },
//       },
//     });

//     if (!translation) {
//       throw new NotFoundException('Category not found');
//     }

//     // Return category with applied translation
//     return this.applyCategoryTranslation(translation.category, translation);
//   }

//   // If language is specified and not English, apply translation
//   if (language && language !== 'en' && category.translations?.[0]) {
//     const translation = category.translations[0];
//     return this.applyCategoryTranslation(category, translation);
//   }

//   // Return original category with empty translations if none exist
//   return {
//     ...category,
//     translations: category.translations || [],
//     isTranslated: false,
//     translationLanguage: 'en',
//   };
// }

private applyCategoryTranslation(category: any, translation: any) {
  return {
    ...category,
    name: translation.name,
    description: translation.description,
    slug: translation.slug,
    // Include the translations array even when using translation
    translations: category.translations || [],
    // Add translation metadata
    isTranslated: true,
    translationLanguage: translation.language,
    translationQuality: translation.qualityScore,
    translationConfidence: translation.confidence,
    translationNeedsReview: translation.needsReview,
  };
}

  async deleteCategory(id: string) {
    const articleCount = await this.prisma.article.count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      return this.prisma.articleCategory.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.articleCategory.delete({
      where: { id },
    });
  }


  async getCategoryWithArticles(slug: string, page: number = 1, limit: number = 20) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          categoryId: category.id,
          status: 'PUBLISHED',
        },
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc',
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
        },
      }),
      this.prisma.article.count({
        where: {
          categoryId: category.id,
          status: 'PUBLISHED',
        },
      }),
    ]);

    return {
      category,
      articles,
      total,
      page,
      limit,
      hasMore: total > skip + limit,
    };
  }
}