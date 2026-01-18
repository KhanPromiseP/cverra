import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Patch,
  Post,
  Res,
  UseGuards,
  Param,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateUserDto, UserDto } from "@reactive-resume/dto";
import type { Response } from "express";

import { AuthService } from "../auth/auth.service";
import { TwoFactorGuard } from "../auth/guards/two-factor.guard";
import { User } from "./decorators/user.decorator";
import { UserService } from "./user.service";
import { ArticleService } from "../articles/article.service";
import { PrismaService } from "nestjs-prisma"; // Add this import

// Define custom error messages BEFORE the class
const CustomErrorMessages = {
  UserNotFound: "User not found",
  InternalServerError: "Internal server error",
  SecretsNotFound: "Secrets not found",
  UserAlreadyExists: "User already exists",
};

@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly articleService: ArticleService,
    private readonly prisma: PrismaService, // Add this
  ) {}

  @Get("me")
  @UseGuards(TwoFactorGuard)
  fetch(@User() user: UserDto) {
    return user;
  }

  @Patch("me")
  @UseGuards(TwoFactorGuard)
  async update(@User("email") email: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      // If user is updating their email, send a verification email
      if (updateUserDto.email && updateUserDto.email !== email) {
        await this.userService.updateByEmail(email, {
          emailVerified: false,
          email: updateUserDto.email,
        });

        await this.authService.sendVerificationEmail(updateUserDto.email);

        email = updateUserDto.email;
      }

      return await this.userService.updateByEmail(email, {
        name: updateUserDto.name,
        picture: updateUserDto.picture,
        username: updateUserDto.username,
        locale: updateUserDto.locale,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(CustomErrorMessages.UserAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Delete("me")
  @UseGuards(TwoFactorGuard)
  async delete(@User("id") id: string, @Res({ passthrough: true }) response: Response) {
    await this.userService.deleteOneById(id);

    response.clearCookie("Authentication");
    response.clearCookie("Refresh");

    response.status(200).send({ message: "Sorry to see you go, goodbye!" });
  }

  @Get("username/:username")
  @ApiOperation({ summary: "Get user by username" })
  @ApiResponse({ status: 200, description: "Returns user information" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserByUsername(@Param("username") username: string) {
    try {
      const user = await this.userService.findOneByIdentifier(username);
      
      if (!user) {
        throw new NotFoundException(CustomErrorMessages.UserNotFound);
      }

      // Return only public information
      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          picture: user.picture,
          createdAt: user.createdAt,
          // Don't include sensitive information like email, secrets, etc.
        },
      };
    } catch (error) {
      Logger.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(CustomErrorMessages.InternalServerError);
    }
  }

  @Get(":username/public-profile")
  @ApiOperation({ summary: "Get public user profile" })
  @ApiResponse({ status: 200, description: "Returns public user profile with reading stats" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getPublicProfile(@Param("username") username: string) {
    try {
      // 1. Get user by username
      const user = await this.userService.findOneByIdentifier(username);
      
      if (!user) {
        throw new NotFoundException(CustomErrorMessages.UserNotFound);
      }

      // 2. Get user's articles - DIFFERENT FOR AUTHORS VS READERS
      let articles: any[] = [];
      let isAuthor = false;

      // Check if user has published articles
      const articleCount = await this.prisma.article.count({
        where: { authorId: user.id, status: 'PUBLISHED' }
      });

      if (articleCount > 0) {
        // User is an author - get their published articles
        const publishedArticles = await this.articleService.listArticles({
          authorId: user.id,
          status: 'PUBLISHED' as any,
          page: 1,
          limit: 5,
        });
        articles = publishedArticles.articles || [];
        isAuthor = true;
      } else {
        // User is a reader - get articles they've read/engaged with
        try {
          // Get articles from user engagement history
          const engagements = await this.prisma.userEngagement.findMany({
            where: { 
              userId: user.id,
              articleId: { not: null }
            },
            select: {
              articleId: true,
              article: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  excerpt: true,
                  readingTime: true,
                  publishedAt: true,
                  category: true,
                  viewCount: true,
                  likeCount: true,
                  commentCount: true,
                }
              },
              action: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });
          
          // Map engagements to articles
          articles = engagements
            .filter((e: any) => e.article)
            .map((e: any) => ({
              ...e.article,
              userReaction: this.getUserReaction(e.action), // Convert action to reaction
            }));
        } catch (error) {
          console.log('Could not fetch reading history:', error.message);
        }
      }

      // 3. Get user reading stats
      let stats = null;
      try {
        stats = await this.articleService.getUserReadingStats(user.id);
        
        // Type assertion since getUserReadingStats might not return articleCompletionRate
        const statsWithCompletion = stats as any;
        
        // Add completion rate calculation
        statsWithCompletion.articleCompletionRate = await this.articleService.calculateCompletionRate(user.id);
      } catch (error) {
        console.log('Could not fetch reading stats for public profile:', error.message);
      }

      // 4. Get user reading profile
      let readingProfile = null;
      try {
        const profileResult = await this.articleService.getReadingProfile(user.id);
        if (profileResult.success) {
          readingProfile = profileResult.data;
        }
      } catch (error) {
        console.log('Could not fetch reading profile:', error.message);
      }

      // 5. Get user achievements
      let achievements = null;
      try {
        achievements = await this.articleService.getUserAchievements(user.id);
      } catch (error) {
        console.log('Could not fetch achievements:', error.message);
      }

      // 6. Get top categories from user's activity
      let topCategories: string[] = [];
      try {
        // This would need a custom method in articleService
        // For now, use categories from reading profile or articles
        if (readingProfile?.preferredCategories) {
          topCategories = readingProfile.preferredCategories.slice(0, 4);
        } else if (articles.length > 0) {
          // Extract categories from articles
          const categoryMap = new Map<string, number>();
          articles.forEach((article: any) => {
            if (article.category?.name) {
              categoryMap.set(article.category.name, (categoryMap.get(article.category.name) || 0) + 1);
            }
          });
          topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name]) => name);
        }
      } catch (error) {
        console.log('Could not determine top categories:', error.message);
      }

      // 7. Generate bio from user data
      const bio = this.generateUserBio(user, stats, readingProfile, topCategories, articles || []);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            picture: user.picture,
            createdAt: user.createdAt,
            bio,
          },
          stats,
          readingProfile,
          achievements,
          articles: articles || [],
          topCategories: topCategories.map(name => ({ name, color: this.getCategoryColor(name) })),
          isAuthor,
          meta: {
            totalArticles: articles.length || 0,
            hasMoreArticles: false, // You might want to calculate this
          },
        },
      };
    } catch (error) {
      Logger.error('Public profile error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load public profile');
    }
  }

  // Helper method to convert engagement action to user reaction
  private getUserReaction(action: string): string {
    switch (action) {
      case 'LIKE': return 'LIKED';
      case 'SAVE': return 'SAVED';
      case 'VIEW':
      case 'READ_COMPLETE': return 'READ';
      default: return '';
    }
  }

  private generateUserBio(
    user: any,
    stats: any,
    readingProfile: any,
    topCategories: string[],
    articles: any[]
  ): string {
    const name = user.name || user.username;
    
    if (!stats && articles.length === 0) {
      return `${name} is exploring knowledge and building their reading journey.`;
    }

    const isAuthor = articles.length > 0 && articles[0]?.authorId === user.id;
    
    if (isAuthor) {
      const topics = topCategories.length > 0 
        ? `writing about ${topCategories.join(', ')}`
        : 'sharing knowledge';
      return `${name} is an author ${topics} with ${articles.length} published articles.`;
    }

    // Reader bio
    if (stats) {
      const readingHours = Math.round((stats.totalReadingTime || 0) / 60);
      const categoryFocus = topCategories.length > 0 
        ? `interested in ${topCategories.join(', ')}`
        : 'exploring various topics';
      
      let bio = `${name} has read ${stats.totalArticlesRead || 0} articles`;
      
      if (readingHours > 0) {
        bio += ` over ${readingHours} hours`;
      }
      
      bio += `. ${categoryFocus}.`;
      
      if (stats.readingStreak > 0) {
        bio += ` Currently on a ${stats.readingStreak}-day reading streak.`;
      }
      
      return bio;
    }

    return `${name} is building their knowledge journey.`;
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
      'AI': '#8B5CF6',
      'Programming': '#3B82F6',
      'Design': '#EC4899',
      'Finance': '#10B981',
      'Productivity': '#F59E0B',
    };
    
    return colors[categoryName] || '#6B7280';
  }
}