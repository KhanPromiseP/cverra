// src/welcome/welcome.controller.ts
import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';

import { TwoFactorGuard } from '../auth/guards/two-factor.guard';
import { User } from '../user/decorators/user.decorator';
import { UserDto } from '@reactive-resume/dto';
import { WelcomeService } from './welcome.service';
import { PrismaService } from 'nestjs-prisma';

@Controller('welcome')

export class WelcomeController {
  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly prisma: PrismaService,
  ) {}

  // Public endpoint - no auth required

  @Get('status')
  async getWelcomeStatusPublic(@Query('userId') userId: string) {
    if (!userId) {
      return { 
        shouldShowWelcome: false, 
        hasReceived: false,
        message: 'No user ID provided'
      };
    }
    
    // Get user name for personalization
    let userName = '';
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      userName = user?.name || '';
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
    
    const status = await this.welcomeService.checkWelcomeBonusStatus(userId);
    
    return {
      ...status,
      userName,
      userId,
      timestamp: new Date().toISOString()
    };
  }

  // Protected endpoint - requires auth
  @Post('bonus')
  @UseGuards(TwoFactorGuard)
  async claimWelcomeBonus(@User() user: UserDto) {
    const result = await this.welcomeService.awardWelcomeBonus(user.id);
    
    if (!result.success) {
      return { 
        success: false, 
        message: 'Welcome bonus already claimed',
        userId: user.id 
      };
    }

    return {
      success: true,
      message: 'Welcome bonus awarded!',
      coins: result.coins,
      userId: user.id,
      userName: user.name
    };
  }
}