import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { UnauthorizedException } from '@nestjs/common';


@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subsService: SubscriptionsService) {}

  // Fetch all subscription plans
  @Get('plans')
  async getPlans() {
    return this.subsService.getPlans();
  }

  // Subscribe a user to a plan
  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto) {
    return this.subsService.subscribe(dto.userId, dto.planId, dto.provider);
  }
  // Get a user's current subscription
  @UseGuards(JwtGuard)
  @Get('my-subscription')
  async getUserSubscription(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.subsService.getUserSubscription(userId);
  }

  // Cancel a user's subscription
  @Delete('cancel/:subscriptionId')
  async cancel(
    @Param('subscriptionId') subscriptionId: string,
    @Body('userId') userId: string,
  ) {
    return this.subsService.cancelSubscription(userId, subscriptionId);
  }
}
