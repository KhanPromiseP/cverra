// notification/notification.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  Request
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ========== AUTHENTICATED ROUTES ==========

  @UseGuards(JwtGuard)
  @Get()
  async getUserNotifications(
    @Request() req: any,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ) {
    const userId = req.user.id;
    return this.notificationService.getUserNotifications(userId, unreadOnly);
  }

  @UseGuards(JwtGuard)
  @Get('count')
  async getNotificationCount(
    @Request() req: any,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ) {
    const userId = req.user.id;
    const notifications = await this.notificationService.getUserNotifications(userId, unreadOnly);
    return { count: notifications.length, unreadOnly };
  }

  @UseGuards(JwtGuard)
  @Put(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    
    if (!notificationId) {
      throw new BadRequestException('Notification ID is required');
    }
    
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @UseGuards(JwtGuard)
  @Post('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId);
  }

  @UseGuards(JwtGuard)
  @Post('test')
  async sendTestNotification(@Request() req: any) {
    const userId = req.user.id;
    
    // Test notification
    return this.notificationService.sendNotification(userId, 'TEST', {
      title: 'Test Notification',
      message: 'This is a test notification from the system',
      metadata: { test: true, timestamp: new Date().toISOString() },
    });
  }

  // ========== ADMIN ROUTES (if needed) ==========

  @UseGuards(JwtGuard)
  @Post('send')
  async sendNotification(
    @Body() body: { userId: string; type: string; data: any },
  ) {
    const { userId, type, data } = body;
    
    if (!userId || !type) {
      throw new BadRequestException('userId and type are required');
    }
    
    return this.notificationService.sendNotification(userId, type, data);
  }
}