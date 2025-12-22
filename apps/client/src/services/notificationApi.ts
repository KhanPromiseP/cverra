// apps/client/src/services/api.ts
import { apiClient } from './api-client';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'achievement' | 'premium' | 'system';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    picture?: string;
  };
  target?: {
    type: 'article' | 'comment' | 'user';
    id: string;
    title?: string;
    slug?: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (params?: { limit?: number; page?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; markedCount: number }> => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  // Subscribe to real-time notifications (WebSocket)
  subscribeToNotifications: async (callback: (notification: Notification) => void) => {
    // This would typically set up a WebSocket connection
    // For now, we'll simulate with polling or use a global WebSocket
    console.log('Subscribing to notifications...');
  }
};

// Re-export for backward compatibility
export const getNotifications = notificationsApi.getNotifications;
export const markAsRead = notificationsApi.markAsRead;
export const markAllAsRead = notificationsApi.markAllAsRead;
export const deleteNotification = notificationsApi.deleteNotification;
export const subscribeToNotifications = notificationsApi.subscribeToNotifications;