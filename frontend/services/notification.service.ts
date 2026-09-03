import { apiClient } from '@/lib/api-client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  /**
   * List the current user's notifications, newest first.
   * Pass `unreadOnly=true` to filter to unread.
   */
  async getNotifications(unreadOnly = false): Promise<Notification[]> {
    return apiClient.get<Notification[]>(
      unreadOnly ? '/notifications?unreadOnly=true' : '/notifications'
    );
  },

  /**
   * Count of unread notifications for the bell badge.
   */
  async getUnreadCount(): Promise<number> {
    const out = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return out.count;
  },

  /**
   * Mark a single notification as read.
   */
  async markRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  /**
   * Mark every unread notification as read.
   */
  async markAllRead(): Promise<{ updated: number }> {
    return apiClient.post<{ updated: number }>('/notifications/mark-all-read');
  },

  /**
   * Delete a single notification.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
