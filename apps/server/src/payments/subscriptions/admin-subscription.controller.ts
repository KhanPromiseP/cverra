// src/payments/subscriptions/admin-subscription.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards
} from '@nestjs/common';
import { AdminSubscriptionService } from './admin-subscription.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './dto/subscription-plan.dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('admin/subscriptions')
@UseGuards(JwtGuard, AdminGuard) // Use both guards
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminSubscriptionController {
  constructor(private readonly adminSubscriptionService: AdminSubscriptionService) {}

  @Post('plans')
  async createPlan(@Body() createPlanDto: CreateSubscriptionPlanDto) {
    return this.adminSubscriptionService.createPlan(createPlanDto);
  }

  @Get('plans')
  async getAllPlans() {
    return this.adminSubscriptionService.getAllPlans();
  }

  @Get('plans/:id')
  async getPlanById(@Param('id') id: string) {
    return this.adminSubscriptionService.getPlanById(id);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdateSubscriptionPlanDto) {
    return this.adminSubscriptionService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.adminSubscriptionService.deletePlan(id);
  }

  @Post('plans/:id/toggle-status')
  async togglePlanStatus(@Param('id') id: string) {
    return this.adminSubscriptionService.togglePlanStatus(id);
  }

  @Get('plans/:id/analytics')
  async getPlanAnalytics(@Param('id') id: string) {
    return this.adminSubscriptionService.getPlanAnalytics(id);
  }

  @Get('stats')
  async getSubscriptionStats() {
    return this.adminSubscriptionService.getSubscriptionStats();
  }
}