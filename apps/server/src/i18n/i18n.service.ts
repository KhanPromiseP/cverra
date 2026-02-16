// src/i18n/i18n.service.ts - WORKING VERSION
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { enTemplates } from './notification-templates/en';
import { frTemplates } from './notification-templates/fr';
import { notificationTemplatesEn } from './notification-templates/notification-types.en';
import { notificationTemplatesFr } from './notification-templates/notification-types.fr';

// Define ALL template keys as a union type
type TemplateKey = 
  | 'welcome' | 'bonus' | 'features' | 'tips'
  | 'article.like' | 'article.comment' | 'comment.reply'
  | 'achievement.unlocked' | 'reading.milestone'
  | 'recommendations.new' | 'premium.feature'
  | 'system.announcement' | 'system.update'
  | string; // Allow any string for flexibility

type SimpleLanguage = 'en' | 'fr';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  
  // Combined templates from separate files
  private readonly templates: Record<SimpleLanguage, any> = {
    en: {
      ...enTemplates,                    // Welcome templates
      ...notificationTemplatesEn,        // Notification templates
    },
    fr: {
      ...frTemplates,                    // Welcome templates (French)
      ...notificationTemplatesFr,        // Notification templates (French)
    },
  };
  
  // Cache for user languages
  private languageCache = new Map<string, { language: SimpleLanguage; timestamp: number }>();
  private readonly LANGUAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert locale to simple language
   */
  private localeToLanguage(locale: string): SimpleLanguage {
    if (!locale || typeof locale !== 'string') return 'en';
    const language = locale.substring(0, 2).toLowerCase();
    return language === 'fr' ? 'fr' : 'en';
  }

  /**
   * Get user's language with caching
   */
  async getUserLanguage(userId: string): Promise<SimpleLanguage> {
    // Check cache first
    const cached = this.languageCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < this.LANGUAGE_CACHE_TTL) {
      return cached.language;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { locale: true }
      });
      
      if (!user) {
        this.logger.warn(`User ${userId} not found, defaulting to English`);
        return 'en';
      }
      
      const language = this.localeToLanguage(user.locale);
      
      // Cache the result
      this.languageCache.set(userId, {
        language,
        timestamp: Date.now()
      });
      
      return language;
    } catch (error) {
      this.logger.warn(`Failed to fetch locale for user ${userId}: ${error.message}`);
      return 'en';
    }
  }

  /**
   * Get notification template
   */
  async getNotificationTemplate(
    userId: string,
    templateKey: TemplateKey,
    payload: Record<string, any> = {},
  ): Promise<{ title: string; message: string }> {
    const language = await this.getUserLanguage(userId);
    const languageTemplates = this.templates[language] || this.templates.en;
    const template = languageTemplates[templateKey];

    if (!template) {
      // Fallback to English template
      const englishTemplate = this.templates.en[templateKey];
      if (!englishTemplate) {
        // Ultimate fallback
        this.logger.error(`Template "${templateKey}" not found`);
        return {
          title: 'Notification',
          message: 'You have a new notification'
        };
      }
      
      this.logger.warn(`Template "${templateKey}" not found in ${language}, using English`);
      return {
        title: this.interpolate(englishTemplate.title, payload),
        message: this.interpolate(englishTemplate.message, payload),
      };
    }

    return {
      title: this.interpolate(template.title, payload),
      message: this.interpolate(template.message, payload),
    };
  }

  /**
   * Template interpolation
   */
  private interpolate(template: string, payload: Record<string, any>): string {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = payload[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Clear user language cache
   */
  clearUserLanguageCache(userId: string): void {
    this.languageCache.delete(userId);
  }
}