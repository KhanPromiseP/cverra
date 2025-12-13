// src/admin/admin.controller.ts
import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtGuard, AdminGuard) // Use both guards
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUserManagementData() {
    return this.adminService.getUserManagementData();
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  ) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Get('analytics')
  async getPlatformAnalytics(@Query('timeframe') timeframe: '7d' | '30d' | '90d' | '1y') {
    return this.adminService.getPlatformAnalytics(timeframe);
  }
}