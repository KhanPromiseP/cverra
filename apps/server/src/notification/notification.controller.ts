// notification/notification.controller.ts - COMPLETE
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  NotificationService 
} from './notification.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ========== GET NOTIFICATIONS ==========

  @UseGuards(JwtGuard)
  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
    @Query('types') types?: string,
  ) {
    const userId = req.user.id;
    
    let parsedTypes: NotificationType[] | undefined;
    if (types) {
      try {
        parsedTypes = types.split(',').map(t => t.trim().toUpperCase() as NotificationType);
      } catch (error) {
        throw new BadRequestException('Invalid notification types format');
      }
    }

    const result = await this.notificationService.getUserNotifications(userId, {
      page,
      limit: Math.min(limit, 100),
      unreadOnly,
      types: parsedTypes,
    });

    return {
      success: true,
      data: result,
    };
  }

  // ========== NOTIFICATION ACTIONS ==========

  @UseGuards(JwtGuard)
  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    
    if (!notificationId) {
      throw new BadRequestException('Notification ID is required');
    }
    
    const result = await this.notificationService.markAsRead(userId, notificationId);
    
    return {
      success: true,
      data: result,
      message: 'Notification marked as read',
    };
  }

  @UseGuards(JwtGuard)
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    const result = await this.notificationService.markAllAsRead(userId);
    
    return {
      success: true,
      data: result,
      message: 'All notifications marked as read',
    };
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    
    if (!notificationId) {
      throw new BadRequestException('Notification ID is required');
    }
    
    const result = await this.notificationService.deleteNotification(userId, notificationId);
    
    return {
      success: true,
      data: result,
      message: 'Notification deleted',
    };
  }

  @UseGuards(JwtGuard)
  @Delete('clear/all')
  @ApiOperation({ summary: 'Clear all notifications' })
  @ApiResponse({ status: 200, description: 'All notifications cleared' })
  async clearAllNotifications(@Request() req: any) {
    const userId = req.user.id;
    const result = await this.notificationService.clearAllNotifications(userId);
    
    return {
      success: true,
      data: result,
      message: 'All notifications cleared',
    };
  }

  // ========== NOTIFICATION SETTINGS ==========

  @UseGuards(JwtGuard)
  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getNotificationSettings(@Request() req: any) {
    const userId = req.user.id;
    const settings = await this.notificationService.getUserNotificationSettings(userId);
    
    return {
      success: true,
      data: settings,
    };
  }

  @UseGuards(JwtGuard)
  @Put('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateNotificationSettings(
    @Request() req: any,
    @Body() updates: any,
  ) {
    const userId = req.user.id;
    
    // Validate updates
    const validFields = [
      'emailArticleLikes', 'emailArticleComments', 'emailCommentReplies',
      'emailAchievements', 'emailReadingDigest', 'emailRecommendations',
      'emailSystemAnnouncements', 'pushArticleLikes', 'pushArticleComments',
      'pushCommentReplies', 'pushAchievements', 'pushReadingMilestones',
      'pushSystemAnnouncements', 'pushRecommendations', 'pushDigests',
      'digestFrequency', 'quietStartHour', 'quietEndHour'
    ];
    
    const filteredUpdates = Object.keys(updates)
    .filter(key => validFields.includes(key))
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = updates[key];
      return obj;
    }, {} as Record<string, any>); 
    
    const settings = await this.notificationService.updateNotificationSettings(userId, filteredUpdates);
    
    return {
      success: true,
      data: settings,
      message: 'Notification settings updated',
    };
  }

  // ========== STATISTICS ==========

  @UseGuards(JwtGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getNotificationStats(@Request() req: any) {
    const userId = req.user.id;
    const stats = await this.notificationService.getNotificationStats(userId);
    
    return {
      success: true,
      data: stats,
    };
  }

}