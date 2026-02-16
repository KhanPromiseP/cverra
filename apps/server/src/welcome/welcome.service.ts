// // src/welcome/welcome.service.ts - FIXED VERSION
// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { PrismaService } from 'nestjs-prisma';
// import { TransactionSource } from '@prisma/client';
// import { NotificationService } from '../notification/notification.service';
// import { Cron, CronExpression } from '@nestjs/schedule';

// interface UserNotificationState {
//   userId: string;
//   userName: string;
//   bonusClaimed: boolean;
//   notificationsSent: {
//     welcome: boolean;
//     bonus: boolean;
//     features: boolean;
//     tips: boolean;
//   };
//   lastCheck: number;
// }

// @Injectable()
// export class WelcomeService implements OnModuleInit {
//   private readonly logger = new Logger(WelcomeService.name);
//   private readonly statusCache = new Map<string, { 
//     data: any;
//     timestamp: number;
//   }>();
//   private readonly CACHE_TTL = 300000; // 5 minutes cache
  
//   // Track notification states for users
//   private notificationStates = new Map<string, UserNotificationState>();
  
//   // Track processed users to avoid duplicate notifications
//   private processedUsers = new Set<string>();
  
//   // Simple in-memory rate limiting
//   private readonly requestTimes = new Map<string, number>();
//   private readonly RATE_LIMIT_MS = 30000; // 30 seconds between requests per user
  
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly notificationService: NotificationService,
//   ) {}

//   async onModuleInit() {
//     this.logger.log('Inlirah Welcome Service initialized');
//     // Check for recent users who might have missed welcome
//     setTimeout(() => this.checkRecentUsers(), 10000); // 10 seconds after startup
//   }

//   // Check for users created in last hour on startup
//   private async checkRecentUsers() {
//     try {
//       const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
//       const recentUsers = await this.prisma.user.findMany({
//         where: {
//           createdAt: { gte: oneHourAgo },
//         },
//         select: { id: true, name: true, createdAt: true },
//         take: 50,
//       });

//       for (const user of recentUsers) {
//         if (this.processedUsers.has(user.id)) continue;
        
//         const hasBonus = await this.hasReceivedWelcomeBonus(user.id);
//         if (!hasBonus) {
//           // Initialize notification state
//           this.initializeNotificationState(user.id, user.name);
          
//           // Schedule welcome notification check
//           setTimeout(async () => {
//             await this.sendWelcomeNotification(user.id);
//           }, Math.random() * 5000 + 2000); // Random delay 2-7 seconds
          
//           this.processedUsers.add(user.id);
//         }
//       }
//     } catch (error) {
//       this.logger.error('Error checking recent users:', error);
//     }
//   }

//   // Scheduled check for new users every 5 minutes
//   @Cron(CronExpression.EVERY_5_MINUTES)
//   async scheduledNewUserCheck() {
//     this.logger.log('Checking for new users...');
    
//     try {
//       const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
//       const newUsers = await this.prisma.user.findMany({
//         where: {
//           createdAt: { gte: fiveMinutesAgo },
//           NOT: { id: { in: Array.from(this.processedUsers) } }
//         },
//         select: { id: true, name: true },
//         take: 100,
//       });

//       for (const user of newUsers) {
//         setTimeout(async () => {
//           await this.processNewUserWelcome(user.id, user.name);
//         }, Math.random() * 3000 + 1000); // Random delay 1-4 seconds
//       }
//     } catch (error) {
//       this.logger.error('Error in scheduled user check:', error);
//     }
//   }

//   private async processNewUserWelcome(userId: string, userName: string) {
//     try {
//       // Check if already received bonus
//       const hasBonus = await this.hasReceivedWelcomeBonus(userId);
      
//       if (!hasBonus) {
//         // Initialize notification state
//         this.initializeNotificationState(userId, userName);
        
//         // Send welcome notification only
//         await this.sendWelcomeNotification(userId);
//       }
      
//       this.processedUsers.add(userId);
//     } catch (error) {
//       this.logger.error(`Error processing user ${userId}:`, error);
//     }
//   }

//   // Initialize notification state for a user
//   private initializeNotificationState(userId: string, userName: string): UserNotificationState {
//     const state: UserNotificationState = {
//       userId,
//       userName,
//       bonusClaimed: false,
//       notificationsSent: {
//         welcome: false,
//         bonus: false,
//         features: false,
//         tips: false
//       },
//       lastCheck: Date.now()
//     };
    
//     this.notificationStates.set(userId, state);
//     return state;
//   }

//   // Get or create notification state
//   private getNotificationState(userId: string): UserNotificationState | null {
//     return this.notificationStates.get(userId) || null;
//   }

//   // Update notification state
//   private updateNotificationState(userId: string, updates: Partial<UserNotificationState>) {
//     const state = this.getNotificationState(userId);
//     if (state) {
//       this.notificationStates.set(userId, {
//         ...state,
//         ...updates,
//         lastCheck: Date.now()
//       });
//     }
//   }

//   // Check and send pending notifications
//   private async checkAndSendPendingNotifications(userId: string) {
//     const state = this.getNotificationState(userId);
//     if (!state) return;

//     // If bonus is claimed, check what notifications are pending
//     if (state.bonusClaimed) {
//       const delay = 1000; // 1 second delay between notifications
      
//       // Send bonus notification if not sent
//       if (!state.notificationsSent.bonus) {
//         setTimeout(async () => {
//           await this.sendBonusNotification(userId);
//         }, delay);
//       }
      
//       // Send features notification if not sent
//       if (!state.notificationsSent.features) {
//         setTimeout(async () => {
//           await this.sendFeaturesNotification(userId, state.userName);
//         }, 30000); // 30 seconds after bonus
//       }
      
//       // Send tips notification if not sent
//       if (!state.notificationsSent.tips) {
//         setTimeout(async () => {
//           await this.sendTipsNotification(userId, state.userName);
//         }, 120000); // 2 minutes after bonus
//       }
//     }
//   }

//   // Main method to award welcome bonus - UPDATED
//   async awardWelcomeBonus(userId: string): Promise<{ success: boolean; coins: number }> {
//     try {
//       // Clear cache when awarding bonus
//       this.statusCache.delete(userId);
//       this.processedUsers.delete(userId); // Remove from processed so they get notifications
      
//       const existing = await this.prisma.walletTransaction.findFirst({
//         where: {
//           userId,
//           source: TransactionSource.BONUS,
//           metadata: {
//             path: ['type'],
//             equals: 'WELCOME_BONUS'
//           }
//         }
//       });

//       if (existing) {
//         this.logger.log(`User already has welcome bonus: ${userId}`);
//         return { success: false, coins: 0 };
//       }

//       let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      
//       if (!wallet) {
//         wallet = await this.prisma.wallet.create({ data: { userId, balance: 100 } });
//       } else {
//         wallet = await this.prisma.wallet.update({
//           where: { userId },
//           data: { balance: { increment: 100 } }
//         });
//       }

//       await this.prisma.walletTransaction.create({
//         data: {
//           walletId: wallet.id,
//           userId,
//           amount: 100,
//           type: 'CREDIT',
//           source: TransactionSource.BONUS,
//           description: '🎉 Welcome bonus for joining Inlirah!',
//           metadata: { 
//             type: 'WELCOME_BONUS', 
//             awardedAt: new Date().toISOString(),
//             isFirstLogin: true,
//             platform: 'CVERTRA'
//           }
//         }
//       });

//       this.logger.log(`Awarded welcome bonus to user: ${userId}`);
      
//       // Get user name for notifications
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: { name: true }
//       });
      
//       const userName = user?.name || 'there';
      
//       // Initialize or update notification state
//       let state = this.getNotificationState(userId);
//       if (!state) {
//         state = this.initializeNotificationState(userId, userName);
//       }
      
//       // Mark bonus as claimed
//       this.updateNotificationState(userId, {
//         bonusClaimed: true,
//         userName
//       });
      
//       // Trigger pending notifications
//       await this.checkAndSendPendingNotifications(userId);
      
//       return { success: true, coins: 100 };
//     } catch (error) {
//       this.logger.error(`Error awarding welcome bonus: ${error}`);
//       return { success: false, coins: 0 };
//     }
//   }

//   // Send welcome notification only (first step)
//   private async sendWelcomeNotification(userId: string) {
//     const state = this.getNotificationState(userId);
//     if (!state || state.notificationsSent.welcome) return;

//     try {
//       await this.sendInlirahWelcome(userId, state.userName);
      
//       // Mark welcome as sent
//       this.updateNotificationState(userId, {
//         notificationsSent: {
//           ...state.notificationsSent,
//           welcome: true
//         }
//       });
//     } catch (error) {
//       this.logger.error(`Error sending welcome notification:`, error);
//     }
//   }

//   // Send bonus notification (only after bonus is claimed)
//   private async sendBonusNotification(userId: string) {
//     const state = this.getNotificationState(userId);
//     if (!state || !state.bonusClaimed || state.notificationsSent.bonus) return;

//     try {
//       await this.sendBonusAwardedNotification(userId);
      
//       // Mark bonus notification as sent
//       this.updateNotificationState(userId, {
//         notificationsSent: {
//           ...state.notificationsSent,
//           bonus: true
//         }
//       });
//     } catch (error) {
//       this.logger.error(`Error sending bonus notification:`, error);
//     }
//   }

//   // Send features notification (only after bonus)
//   private async sendFeaturesNotification(userId: string, userName: string) {
//     const state = this.getNotificationState(userId);
//     if (!state || !state.bonusClaimed || state.notificationsSent.features) return;

//     try {
//       await this.sendFeatureIntroduction(userId, userName);
      
//       // Mark features notification as sent
//       this.updateNotificationState(userId, {
//         notificationsSent: {
//           ...state.notificationsSent,
//           features: true
//         }
//       });
//     } catch (error) {
//       this.logger.error(`Error sending feature intro:`, error);
//     }
//   }

//   // Send tips notification (only after bonus)
//   private async sendTipsNotification(userId: string, userName: string) {
//     const state = this.getNotificationState(userId);
//     if (!state || !state.bonusClaimed || state.notificationsSent.tips) return;

//     try {
//       await this.sendTipsNotificationInternal(userId, userName);
      
//       // Mark tips notification as sent
//       this.updateNotificationState(userId, {
//         notificationsSent: {
//           ...state.notificationsSent,
//           tips: true
//         }
//       });
//     } catch (error) {
//       this.logger.error(`Error sending tips:`, error);
//     }
//   }

//   // Check welcome bonus status
//   async checkWelcomeBonusStatus(userId: string) {
//     // Simple rate limiting
//     const now = Date.now();
//     const lastRequest = this.requestTimes.get(userId) || 0;
    
//     if (now - lastRequest < this.RATE_LIMIT_MS) {
//       const cached = this.statusCache.get(userId);
//       if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
//         return cached.data;
//       }
      
//       return { 
//         hasReceived: false, 
//         shouldShowWelcome: false,
//         rateLimited: true,
//         userId,
//         timestamp: new Date().toISOString()
//       };
//     }
    
//     this.requestTimes.set(userId, now);

//     try {
//       const cached = this.statusCache.get(userId);
      
//       if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
//         return cached.data;
//       }
      
//       const existing = await this.prisma.walletTransaction.findFirst({
//         where: {
//           userId,
//           source: TransactionSource.BONUS,
//           metadata: {
//             path: ['type'],
//             equals: 'WELCOME_BONUS'
//           }
//         }
//       });

//       const hasBonus = !!existing;
      
//       // Update notification state if bonus exists
//       if (hasBonus) {
//         const state = this.getNotificationState(userId);
//         if (state) {
//           this.updateNotificationState(userId, { bonusClaimed: true });
//         }
//       }

//       const result = {
//         hasReceived: hasBonus,
//         shouldShowWelcome: !hasBonus,
//         userId,
//         timestamp: new Date().toISOString()
//       };
      
//       this.statusCache.set(userId, {
//         data: result,
//         timestamp: now
//       });
      
//       return result;
//     } catch (error) {
//       this.logger.error(`Error checking welcome bonus status: ${error}`);
//       return { 
//         hasReceived: false, 
//         shouldShowWelcome: false,
//         error: error.message,
//         timestamp: new Date().toISOString()
//       };
//     }
//   }

//   // Helper method to check if user received welcome bonus
//   private async hasReceivedWelcomeBonus(userId: string): Promise<boolean> {
//     const existing = await this.prisma.walletTransaction.findFirst({
//       where: {
//         userId,
//         source: TransactionSource.BONUS,
//         metadata: {
//           path: ['type'],
//           equals: 'WELCOME_BONUS'
//         }
//       }
//     });
//     return !!existing;
//   }

//   // Send Inlirah-specific welcome notification
//   private async sendInlirahWelcome(userId: string, userName: string) {
//     try {
//       await this.notificationService.createNotification(userId, 'SYSTEM', {
//         title: '🎉 Welcome to Inlirah!',
//         message: `Hi ${userName}! Discover professional AI powered resumes builder, smart all category letters crafting, and insightful articles - all in one place!`,
//         metadata: {
//           type: 'WELCOME_INTRO',
//           isNewUser: true,
//           platform: 'CVERTRA',
//           features: ['RESUMES', 'LETTERS', 'ARTICLES'],
//           actions: [
//             { text: 'Build Resume', url: '/dashboard/resumes/widzad', icon: '💼' },
//             { text: 'Create Cover Letter', url: '/dashboard/cover-letters', icon: '📝' },
//             { text: 'Browse Articles', url: '/dashboard/articles', icon: '📚' }
//           ],
//           feature: 'ALL'
//         },
//         target: {
//           type: 'welcome',
//           id: 'welcome-guide',
//           title: 'Welcome Guide',
//           slug: 'welcome'
//         },
//         priority: 'URGENT',
//       });
      
//       this.logger.log(`Inlirah welcome sent to ${userName} (${userId})`);
//     } catch (error) {
//       this.logger.error(`Error sending Inlirah welcome:`, error);
//     }
//   }

//   // Send bonus awarded notification
//   private async sendBonusAwardedNotification(userId: string) {
//     try {
//       await this.notificationService.createNotification(userId, 'SYSTEM', {
//         title: '💰 Welcome Bonus Awarded!',
//         message: 'You received 100 free coins to get started with Inlirah! Use them to Explore powerful Inlirah features.',
//         metadata: {
//           type: 'BONUS_AWARDED',
//           coins: 100,
//           action: 'VIEW_WALLET',
//           actionUrl: '/dashboard/pricing',
//           expiration: 'Never expires',
//           feature: 'ALL'
//         },
//         target: {
//           type: 'wallet',
//           id: 'bonus-reward',
//           title: 'Your Wallet',
//           slug: 'wallet'
//         },
//         priority: 'HIGH',
//       });
      
//       this.logger.log(`Bonus notification sent to ${userId}`);
//     } catch (error) {
//       this.logger.error(`Error sending bonus notification:`, error);
//     }
//   }

//   private async sendFeatureIntroduction(userId: string, userName: string) {
//     try {
//       await this.notificationService.createNotification(userId, 'SYSTEM', {
//         title: '✨ Meet Inlirah\'s Core Features',
//         message: `${userName}, explore our 3 main features designed for your career success:`,
//         metadata: {
//           type: 'FEATURE_INTRO',
//           features: [
//             {
//               name: 'Resume Builder',
//               description: 'Professional resumes with AI enhancement',
//               icon: '💼',
//               url: '/docs/#resume-builder'
//             },
//             {
//               name: 'Smart Letters',
//               description: 'Tailored letters for any situation',
//               icon: '📝',
//               url: '/docs/#letter-builder'
//             },
//             {
//               name: 'Articles',
//               description: 'Deep Career insights and Advanced knowledge',
//               icon: '📚',
//               url: '/#articles-knowledge-center'
//             }
//           ],
//           feature: 'ALL'
//         },
//         target: {
//           type: 'features',
//           id: 'features-guide',
//           title: 'Features Guide',
//           slug: 'features'
//         },
//         priority: 'MEDIUM',
//       });
      
//       this.logger.log(`Feature introduction sent to ${userName} (${userId})`);
//     } catch (error) {
//       this.logger.error(`Error sending feature intro:`, error);
//     }
//   }

//   private async sendTipsNotificationInternal(userId: string, userName: string) {
//     try {
//       await this.notificationService.createNotification(userId, 'SYSTEM', {
//         title: '💡 Quick Tips to Get Started',
//         message: `${userName}, here are quick tips to maximize your Inlirah experience:`,
//         metadata: {
//           type: 'TIPS',
//           tips: [
//             'Create your first professional resume with AI power',
//             'Craft smart letters for all situations with in seconds',
//             'Explore Inlirah deep knowledge Hub of articles',
//             'Complete your profile for personalized recommendations',
//             'Check your achievements as you progress'
//           ],
//           action: 'VIEW_GUIDE',
//           actionUrl: '/docs/#getting-started',
//           feature: 'ALL'
//         },
//         target: {
//           type: 'guide',
//           id: 'getting-started',
//           title: 'Getting Started Guide',
//           slug: 'getting-started'
//         },
//         priority: 'LOW',
//       });
      
//       this.logger.log(`Tips notification sent to ${userName} (${userId})`);
//     } catch (error) {
//       this.logger.error(`Error sending tips:`, error);
//     }
//   }

//   // Trigger welcome manually (for testing)
//   async triggerWelcome(userId: string) {
//     try {
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: { name: true }
//       });

//       if (!user) {
//         return { success: false, message: 'User not found' };
//       }

//       // Clear any cache
//       this.clearCache(userId);
//       this.processedUsers.delete(userId);
      
//       // Initialize notification state
//       this.initializeNotificationState(userId, user.name);
      
//       // Send welcome notification
//       await this.sendWelcomeNotification(userId);

//       return { 
//         success: true, 
//         message: 'Welcome notifications triggered',
//         userId 
//       };
//     } catch (error) {
//       this.logger.error(`Error triggering welcome:`, error);
//       return { success: false, message: error.message };
//     }
//   }

//   // Clear cache
//   clearCache(userId?: string) {
//     if (userId) {
//       this.statusCache.delete(userId);
//       this.requestTimes.delete(userId);
//       this.notificationStates.delete(userId);
//     } else {
//       this.statusCache.clear();
//       this.requestTimes.clear();
//       this.notificationStates.clear();
//     }
//   }

//   // Get notification status for debugging
//   getNotificationStatus(userId: string) {
//     return this.getNotificationState(userId);
//   }

//   // Clean up old notification states
//   private cleanupOldStates() {
//     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
//     for (const [userId, state] of this.notificationStates.entries()) {
//       if (state.lastCheck < oneDayAgo) {
//         this.notificationStates.delete(userId);
//       }
//     }
//   }
// }



// src/welcome/welcome.service.ts - COMPLETE BILINGUAL VERSION
import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { TransactionSource } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { I18nService } from '../i18n/i18n.service'; // <-- Add I18nService import
import { Cron, CronExpression } from '@nestjs/schedule';

interface UserNotificationState {
  userId: string;
  userName: string;
  bonusClaimed: boolean;
  notificationsSent: {
    welcome: boolean;
    bonus: boolean;
    features: boolean;
    tips: boolean;
  };
  lastCheck: number;
  userLanguage?: string; // <-- Store user's language
}

@Injectable()
export class WelcomeService implements OnModuleInit {
  private readonly logger = new Logger(WelcomeService.name);
  private readonly statusCache = new Map<string, { 
    data: any;
    timestamp: number;
  }>();
  private readonly CACHE_TTL = 300000; // 5 minutes cache
  
  // Track notification states for users
  private notificationStates = new Map<string, UserNotificationState>();
  
  // Track processed users to avoid duplicate notifications
  private processedUsers = new Set<string>();
  
  // Simple in-memory rate limiting
  private readonly requestTimes = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 30000; // 30 seconds between requests per user

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly i18nService: I18nService, // <-- Inject I18nService
  ) {}

  async onModuleInit() {
    this.logger.log('Inlirah Welcome Service initialized with bilingual support');
    // Check for recent users who might have missed welcome
    setTimeout(() => this.checkRecentUsers(), 10000); // 10 seconds after startup
  }

  // Check for users created in last hour on startup
  private async checkRecentUsers() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentUsers = await this.prisma.user.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
        },
        select: { id: true, name: true, createdAt: true, locale: true }, // <-- Include locale
        take: 50,
      });

      for (const user of recentUsers) {
        if (this.processedUsers.has(user.id)) continue;
        
        const hasBonus = await this.hasReceivedWelcomeBonus(user.id);
        if (!hasBonus) {
          // Initialize notification state with locale
          this.initializeNotificationState(user.id, user.name, user.locale);
          
          // Schedule welcome notification check
          setTimeout(async () => {
            await this.sendWelcomeNotification(user.id);
          }, Math.random() * 5000 + 2000); // Random delay 2-7 seconds
          
          this.processedUsers.add(user.id);
        }
      }
    } catch (error) {
      this.logger.error('Error checking recent users:', error);
    }
  }

  // Scheduled check for new users every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledNewUserCheck() {
    this.logger.log('Checking for new users...');
    
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const newUsers = await this.prisma.user.findMany({
        where: {
          createdAt: { gte: fiveMinutesAgo },
          NOT: { id: { in: Array.from(this.processedUsers) } }
        },
        select: { id: true, name: true, locale: true }, // <-- Include locale
        take: 100,
      });

      for (const user of newUsers) {
        setTimeout(async () => {
          await this.processNewUserWelcome(user.id, user.name, user.locale);
        }, Math.random() * 3000 + 1000); // Random delay 1-4 seconds
      }
    } catch (error) {
      this.logger.error('Error in scheduled user check:', error);
    }
  }

  private async processNewUserWelcome(userId: string, userName: string, userLocale: string) {
    try {
      // Check if already received bonus
      const hasBonus = await this.hasReceivedWelcomeBonus(userId);
      
      if (!hasBonus) {
        // Initialize notification state with locale
        this.initializeNotificationState(userId, userName, userLocale);
        
        // Send welcome notification only
        await this.sendWelcomeNotification(userId);
      }
      
      this.processedUsers.add(userId);
    } catch (error) {
      this.logger.error(`Error processing user ${userId}:`, error);
    }
  }

  // Initialize notification state for a user with locale
  private initializeNotificationState(userId: string, userName: string, locale?: string): UserNotificationState {
    const state: UserNotificationState = {
      userId,
      userName,
      bonusClaimed: false,
      notificationsSent: {
        welcome: false,
        bonus: false,
        features: false,
        tips: false
      },
      lastCheck: Date.now(),
      userLanguage: locale ? this.extractLanguageFromLocale(locale) : 'en' // <-- Extract language
    };
    
    this.notificationStates.set(userId, state);
    return state;
  }

  // Helper to extract language from locale
  private extractLanguageFromLocale(locale: string): string {
    if (!locale) return 'en';
    return locale.substring(0, 2).toLowerCase();
  }

  // Get or create notification state
  private getNotificationState(userId: string): UserNotificationState | null {
    return this.notificationStates.get(userId) || null;
  }

  // Update notification state
  private updateNotificationState(userId: string, updates: Partial<UserNotificationState>) {
    const state = this.getNotificationState(userId);
    if (state) {
      this.notificationStates.set(userId, {
        ...state,
        ...updates,
        lastCheck: Date.now()
      });
    }
  }

  // Check and send pending notifications
  private async checkAndSendPendingNotifications(userId: string) {
    const state = this.getNotificationState(userId);
    if (!state) return;

    // If bonus is claimed, check what notifications are pending
    if (state.bonusClaimed) {
      const delay = 1000; // 1 second delay between notifications
      
      // Send bonus notification if not sent
      if (!state.notificationsSent.bonus) {
        setTimeout(async () => {
          await this.sendBonusNotification(userId);
        }, delay);
      }
      
      // Send features notification if not sent
      if (!state.notificationsSent.features) {
        setTimeout(async () => {
          await this.sendFeaturesNotification(userId, state.userName);
        }, 30000); // 30 seconds after bonus
      }
      
      // Send tips notification if not sent
      if (!state.notificationsSent.tips) {
        setTimeout(async () => {
          await this.sendTipsNotification(userId, state.userName);
        }, 120000); // 2 minutes after bonus
      }
    }
  }

  // Main method to award welcome bonus
  async awardWelcomeBonus(userId: string): Promise<{ success: boolean; coins: number }> {
    try {
      // Clear cache when awarding bonus
      this.statusCache.delete(userId);
      this.processedUsers.delete(userId); // Remove from processed so they get notifications
      
      const existing = await this.prisma.walletTransaction.findFirst({
        where: {
          userId,
          source: TransactionSource.BONUS,
          metadata: {
            path: ['type'],
            equals: 'WELCOME_BONUS'
          }
        }
      });

      if (existing) {
        this.logger.log(`User already has welcome bonus: ${userId}`);
        return { success: false, coins: 0 };
      }

      let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      
      if (!wallet) {
        wallet = await this.prisma.wallet.create({ data: { userId, balance: 100 } });
      } else {
        wallet = await this.prisma.wallet.update({
          where: { userId },
          data: { balance: { increment: 100 } }
        });
      }

      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: 100,
          type: 'CREDIT',
          source: TransactionSource.BONUS,
          description: '🎉 Welcome bonus for joining Inlirah!',
          metadata: { 
            type: 'WELCOME_BONUS', 
            awardedAt: new Date().toISOString(),
            isFirstLogin: true,
            platform: 'CVERTRA'
          }
        }
      });

      this.logger.log(`Awarded welcome bonus to user: ${userId}`);
      
      // Get user name and locale for notifications
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, locale: true }
      });
      
      const userName = user?.name || 'there';
      const userLocale = user?.locale || 'en';
      
      // Initialize or update notification state
      let state = this.getNotificationState(userId);
      if (!state) {
        state = this.initializeNotificationState(userId, userName, userLocale);
      }
      
      // Mark bonus as claimed
      this.updateNotificationState(userId, {
        bonusClaimed: true,
        userName,
        userLanguage: this.extractLanguageFromLocale(userLocale)
      });
      
      // Trigger pending notifications
      await this.checkAndSendPendingNotifications(userId);
      
      return { success: true, coins: 100 };
    } catch (error) {
      this.logger.error(`Error awarding welcome bonus: ${error}`);
      return { success: false, coins: 0 };
    }
  }

  // Send welcome notification only (first step)
  private async sendWelcomeNotification(userId: string) {
  const state = this.getNotificationState(userId);
  if (!state || state.notificationsSent.welcome) return;

  try {
    // Remove userLanguage parameter
    await this.sendInlirahWelcome(userId, state.userName);
    
    // Mark welcome as sent
    this.updateNotificationState(userId, {
      notificationsSent: {
        ...state.notificationsSent,
        welcome: true
      }
    });
  } catch (error) {
    this.logger.error(`Error sending welcome notification:`, error);
  }
}

  // Send bonus notification (only after bonus is claimed)
  private async sendBonusNotification(userId: string) {
  const state = this.getNotificationState(userId);
  if (!state || !state.bonusClaimed || state.notificationsSent.bonus) return;

  try {
    // Remove userLanguage parameter
    await this.sendBonusAwardedNotification(userId);
    
    // Mark bonus notification as sent
    this.updateNotificationState(userId, {
      notificationsSent: {
        ...state.notificationsSent,
        bonus: true
      }
    });
  } catch (error) {
    this.logger.error(`Error sending bonus notification:`, error);
  }
}

  // Send features notification (only after bonus)
 private async sendFeaturesNotification(userId: string, userName: string) {
  const state = this.getNotificationState(userId);
  if (!state || !state.bonusClaimed || state.notificationsSent.features) return;

  try {
    // Remove userLanguage parameter
    await this.sendFeatureIntroduction(userId, userName);
    
    // Mark features notification as sent
    this.updateNotificationState(userId, {
      notificationsSent: {
        ...state.notificationsSent,
        features: true
      }
    });
  } catch (error) {
    this.logger.error(`Error sending feature intro:`, error);
  }
}

  // Send tips notification (only after bonus)
  private async sendTipsNotification(userId: string, userName: string) {
  const state = this.getNotificationState(userId);
  if (!state || !state.bonusClaimed || state.notificationsSent.tips) return;

  try {
    // Remove userLanguage parameter
    await this.sendTipsNotificationInternal(userId, userName);
    
    // Mark tips notification as sent
    this.updateNotificationState(userId, {
      notificationsSent: {
        ...state.notificationsSent,
        tips: true
      }
    });
  } catch (error) {
    this.logger.error(`Error sending tips:`, error);
  }
}

  // Check welcome bonus status
  async checkWelcomeBonusStatus(userId: string) {
    // Simple rate limiting
    const now = Date.now();
    const lastRequest = this.requestTimes.get(userId) || 0;
    
    if (now - lastRequest < this.RATE_LIMIT_MS) {
      const cached = this.statusCache.get(userId);
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }
      
      return { 
        hasReceived: false, 
        shouldShowWelcome: false,
        rateLimited: true,
        userId,
        timestamp: new Date().toISOString()
      };
    }
    
    this.requestTimes.set(userId, now);

    try {
      const cached = this.statusCache.get(userId);
      
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        return cached.data;
      }
      
      const existing = await this.prisma.walletTransaction.findFirst({
        where: {
          userId,
          source: TransactionSource.BONUS,
          metadata: {
            path: ['type'],
            equals: 'WELCOME_BONUS'
          }
        }
      });

      const hasBonus = !!existing;
      
      // Update notification state if bonus exists
      if (hasBonus) {
        const state = this.getNotificationState(userId);
        if (state) {
          this.updateNotificationState(userId, { bonusClaimed: true });
        }
      }

      const result = {
        hasReceived: hasBonus,
        shouldShowWelcome: !hasBonus,
        userId,
        timestamp: new Date().toISOString()
      };
      
      this.statusCache.set(userId, {
        data: result,
        timestamp: now
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error checking welcome bonus status: ${error}`);
      return { 
        hasReceived: false, 
        shouldShowWelcome: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper method to check if user received welcome bonus
  private async hasReceivedWelcomeBonus(userId: string): Promise<boolean> {
    const existing = await this.prisma.walletTransaction.findFirst({
      where: {
        userId,
        source: TransactionSource.BONUS,
        metadata: {
          path: ['type'],
          equals: 'WELCOME_BONUS'
        }
      }
    });
    return !!existing;
  }

// Send Inlirah-specific welcome notification - UPDATED TO FETCH FRESH LANGUAGE
private async sendInlirahWelcome(userId: string, userName: string) {
  try {
    // Get FRESH language at execution time
    const userLanguage = await this.i18nService.getUserLanguage(userId);
    
    // Get localized template from I18nService
    const template = await this.i18nService.getNotificationTemplate(
      userId,
      'welcome',
      { userName }
    );

    // Define actions based on language
    const actions = userLanguage === 'fr' ? [
      { text: 'Créer un CV', url: '/dashboard/resumes/widzad', icon: '💼' },
      { text: 'Lettre de motivation', url: '/dashboard/cover-letters', icon: '📝' },
      { text: 'Parcourir les articles', url: '/dashboard/articles', icon: '📚' }
    ] : [
      { text: 'Build Resume', url: '/dashboard/resumes/widzad', icon: '💼' },
      { text: 'Create Cover Letter', url: '/dashboard/cover-letters', icon: '📝' },
      { text: 'Browse Articles', url: '/dashboard/articles', icon: '📚' }
    ];

    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: template.title,
      message: template.message,
      metadata: {
        type: 'WELCOME_INTRO',
        isNewUser: true,
        platform: 'CVERTRA',
        features: ['RESUMES', 'LETTERS', 'ARTICLES'],
        templateKey: 'welcome',
        language: userLanguage,
        actions,
        feature: 'ALL'
      },
      target: {
        type: 'welcome',
        id: 'welcome-guide',
        title: userLanguage === 'fr' ? 'Guide de bienvenue' : 'Welcome Guide',
        slug: 'welcome'
      },
      priority: 'URGENT',
    });
    
    this.logger.log(`[FRESH] Inlirah welcome sent to ${userName} (${userId}) in ${userLanguage}`);
  } catch (error) {
    this.logger.error(`Error sending Inlirah welcome:`, error);
  }
}

// Send bonus awarded notification - UPDATED TO FETCH FRESH LANGUAGE
private async sendBonusAwardedNotification(userId: string) {
  try {
    // Get FRESH language at execution time
    const userLanguage = await this.i18nService.getUserLanguage(userId);
    
    // Get localized template from I18nService
    const template = await this.i18nService.getNotificationTemplate(
      userId,
      'bonus',
      { coins: 100 }
    );

    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: template.title,
      message: template.message,
      metadata: {
        type: 'BONUS_AWARDED',
        coins: 100,
        templateKey: 'bonus',
        language: userLanguage,
        action: userLanguage === 'fr' ? 'VOIR_PORTEFEUILLE' : 'VIEW_WALLET',
        actionUrl: '/dashboard/pricing',
        expiration: userLanguage === 'fr' ? 'N\'expire jamais' : 'Never expires',
        feature: 'ALL'
      },
      target: {
        type: 'wallet',
        id: 'bonus-reward',
        title: userLanguage === 'fr' ? 'Votre Portefeuille' : 'Your Wallet',
        slug: 'wallet'
      },
      priority: 'HIGH',
    });
    
    this.logger.log(`[FRESH] Bonus notification sent to ${userId} in ${userLanguage}`);
  } catch (error) {
    this.logger.error(`Error sending bonus notification:`, error);
  }
}

// Send features notification - UPDATED TO FETCH FRESH LANGUAGE
private async sendFeatureIntroduction(userId: string, userName: string) {
  try {
    // Get FRESH language at execution time
    const userLanguage = await this.i18nService.getUserLanguage(userId);
    
    // Get localized template from I18nService
    const template = await this.i18nService.getNotificationTemplate(
      userId,
      'features',
      { userName }
    );

    // Define feature descriptions based on language
    const features = userLanguage === 'fr' ? [
      {
        name: 'Générateur de CV',
        description: 'CV professionnels avec amélioration par IA',
        icon: '💼',
        url: '/docs/#resume-builder'
      },
      {
        name: 'Lettres Intelligentes',
        description: 'Lettres adaptées à toutes les situations',
        icon: '📝',
        url: '/docs/#letter-builder'
      },
      {
        name: 'Articles',
        description: 'Connaissances approfondies et avancées',
        icon: '📚',
        url: '/#articles-knowledge-center'
      }
    ] : [
      {
        name: 'Resume Builder',
        description: 'Professional resumes with AI enhancement',
        icon: '💼',
        url: '/docs/#resume-builder'
      },
      {
        name: 'Smart Letters',
        description: 'Tailored letters for any situation',
        icon: '📝',
        url: '/docs/#letter-builder'
      },
      {
        name: 'Articles',
        description: 'Deep Career insights and Advanced knowledge',
        icon: '📚',
        url: '/#articles-knowledge-center'
      }
    ];

    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: template.title,
      message: template.message,
      metadata: {
        type: 'FEATURE_INTRO',
        templateKey: 'features',
        language: userLanguage,
        features,
        feature: 'ALL'
      },
      target: {
        type: 'features',
        id: 'features-guide',
        title: userLanguage === 'fr' ? 'Guide des Fonctionnalités' : 'Features Guide',
        slug: 'features'
      },
      priority: 'MEDIUM',
    });
    
    this.logger.log(`[FRESH] Feature introduction sent to ${userName} (${userId}) in ${userLanguage}`);
  } catch (error) {
    this.logger.error(`Error sending feature intro:`, error);
  }
}

// Send tips notification - UPDATED TO FETCH FRESH LANGUAGE
private async sendTipsNotificationInternal(userId: string, userName: string) {
  try {
    // Get FRESH language at execution time
    const userLanguage = await this.i18nService.getUserLanguage(userId);
    
    // Get localized template from I18nService
    const template = await this.i18nService.getNotificationTemplate(
      userId,
      'tips',
      { userName }
    );

    // Define tips based on language
    const tips = userLanguage === 'fr' ? [
      'Créez votre premier CV professionnel avec l\'IA',
      'Rédigez des lettres intelligentes en quelques secondes',
      'Explorez le Hub de connaissances approfondies d\'Inlirah',
      'Complétez votre profil pour des recommandations personnalisées',
      'Vérifiez vos réalisations au fur et à mesure de votre progression'
    ] : [
      'Create your first professional resume with AI power',
      'Craft smart letters for all situations with in seconds',
      'Explore Inlirah deep knowledge Hub of articles',
      'Complete your profile for personalized recommendations',
      'Check your achievements as you progress'
    ];

    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: template.title,
      message: template.message,
      metadata: {
        type: 'TIPS',
        templateKey: 'tips',
        language: userLanguage,
        tips,
        action: userLanguage === 'fr' ? 'VOIR_LE_GUIDE' : 'VIEW_GUIDE',
        actionUrl: '/docs/#getting-started',
        feature: 'ALL'
      },
      target: {
        type: 'guide',
        id: 'getting-started',
        title: userLanguage === 'fr' ? 'Guide de Démarrage' : 'Getting Started Guide',
        slug: 'getting-started'
      },
      priority: 'LOW',
    });
    
    this.logger.log(`[FRESH] Tips notification sent to ${userName} (${userId}) in ${userLanguage}`);
  } catch (error) {
    this.logger.error(`Error sending tips:`, error);
  }
}
  // Trigger welcome manually (for testing)
  async triggerWelcome(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, locale: true }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Clear any cache
      this.clearCache(userId);
      this.processedUsers.delete(userId);
      
      // Initialize notification state with locale
      this.initializeNotificationState(userId, user.name, user.locale);
      
      // Send welcome notification
      await this.sendWelcomeNotification(userId);

      return { 
        success: true, 
        message: 'Welcome notifications triggered',
        userId 
      };
    } catch (error) {
      this.logger.error(`Error triggering welcome:`, error);
      return { success: false, message: error.message };
    }
  }

  // Clear cache
  clearCache(userId?: string) {
    if (userId) {
      this.statusCache.delete(userId);
      this.requestTimes.delete(userId);
      this.notificationStates.delete(userId);
    } else {
      this.statusCache.clear();
      this.requestTimes.clear();
      this.notificationStates.clear();
    }
  }

  // Get notification status for debugging
  getNotificationStatus(userId: string) {
    return this.getNotificationState(userId);
  }

  // Clean up old notification states
  private cleanupOldStates() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const [userId, state] of this.notificationStates.entries()) {
      if (state.lastCheck < oneDayAgo) {
        this.notificationStates.delete(userId);
      }
    }
  }

  // Refresh user language (call this when user changes locale)
  async refreshUserLanguage(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { locale: true }
      });

      if (user) {
        const state = this.getNotificationState(userId);
        if (state) {
          const newLanguage = this.extractLanguageFromLocale(user.locale);
          this.updateNotificationState(userId, {
            userLanguage: newLanguage
          });
          this.logger.log(`Refreshed language for user ${userId}: ${newLanguage}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error refreshing user language for ${userId}:`, error);
    }
  }

  async rescheduleNotificationsForUser(userId: string): Promise<void> {
  try {
    const state = this.getNotificationState(userId);
    if (!state || !state.bonusClaimed) return;

    this.logger.log(`[RESCHEDULE] Rescheduling notifications for user ${userId}`);
    
    // Clear any existing timeouts (you'd need to track them)
    // For now, we'll just update the state and let existing ones finish
    
    // Update the state with fresh language
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true }
    });
    
    const newLanguage = this.extractLanguageFromLocale(user?.locale || 'en');
    
    this.updateNotificationState(userId, {
      userLanguage: newLanguage
    });
    
    this.logger.log(`[RESCHEDULE] Updated language for ${userId} to ${newLanguage}`);
    
  } catch (error) {
    this.logger.error(`Error rescheduling notifications for ${userId}:`, error);
  }
}
}