// notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async sendNotification(userId: string, type: string, data: any) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type,
          title: data.title || 'New Notification',
          message: data.message || '',
          data: data.metadata || {},
          read: false,
        },
      });

      // You can add email, push notifications, etc. here
      this.logger.log(`Notification sent to user ${userId}: ${type}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true, readAt: new Date() },
    });
  }
}