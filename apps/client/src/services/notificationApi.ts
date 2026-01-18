// services/notificationApi.ts - COMPLETE
import { apiClient } from './api-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    picture?: string;
    username?: string;
  };
  target?: {
    type: string;
    id: string;
    title?: string;
    slug?: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationSettings {
  emailArticleLikes: boolean;
  emailArticleComments: boolean;
  emailCommentReplies: boolean;
  emailAchievements: boolean;
  emailReadingDigest: boolean;
  emailRecommendations: boolean;
  emailSystemAnnouncements: boolean;
  pushArticleLikes: boolean;
  pushArticleComments: boolean;
  pushCommentReplies: boolean;
  pushAchievements: boolean;
  pushReadingMilestones: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  quietStartHour: number;
  quietEndHour: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  readPercentage: number;
  byType: Record<string, number>;
  recentActivity: number;
}

// Get notifications
export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  types?: string[];
}): Promise<NotificationsResponse> => {
  try {
    const queryParams: any = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.unreadOnly) queryParams.unreadOnly = params.unreadOnly;
    if (params?.types?.length) queryParams.types = params.types.join(',');

    const response = await apiClient.get('/notifications', { params: queryParams });
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    // Fallback structure
    return {
      notifications: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 20,
      totalPages: 0,
      unreadCount: 0,
      hasMore: false,
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<any> => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

// Mark all as read
export const markAllAsRead = async (): Promise<any> => {
  try {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<any> => {
  try {
    const response = await apiClient.delete('/notifications/clear/all');
    return response.data;
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const response = await apiClient.get('/notifications/settings');
    return response.data?.data || {};
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
  try {
    const response = await apiClient.put('/notifications/settings', settings);
    return response.data?.data || {};
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    throw error;
  }
};

// Get notification statistics
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const response = await apiClient.get('/notifications/stats');
    return response.data?.data || {};
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    throw error;
  }
};

// Test endpoints (development only)
export const testLikeNotification = async (): Promise<any> => {
  try {
    const response = await apiClient.post('/notifications/test/like');
    return response.data;
  } catch (error) {
    console.error('Failed to test like notification:', error);
    throw error;
  }
};

export const testAchievementNotification = async (): Promise<any> => {
  try {
    const response = await apiClient.post('/notifications/test/achievement');
    return response.data;
  } catch (error) {
    console.error('Failed to test achievement notification:', error);
    throw error;
  }
};