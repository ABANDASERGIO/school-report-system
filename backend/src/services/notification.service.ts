import { Notification, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

function toNotificationResponse(n: Notification): NotificationResponse {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    body: n.body,
    link: n.link ?? '',
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationService = {
  /**
   * List notifications for a user, newest first. Optional `unreadOnly`
   * filter.
   */
  async listForUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {}
  ): Promise<NotificationResponse[]> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (options.unreadOnly) where.read = false;
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    });
    return rows.map(toNotificationResponse);
  },

  /**
   * Count of unread notifications for a user. Used by the bell badge.
   */
  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  /**
   * Mark a single notification as read. Verifies ownership.
   */
  async markRead(userId: string, id: string): Promise<NotificationResponse> {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Notification not found', 'NotificationNotFound');
    }
    if (existing.userId !== userId) {
      throw new ApiErrorClass(
        403,
        'You can only mark your own notifications as read',
        'Forbidden'
      );
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return toNotificationResponse(updated);
  },

  /**
   * Mark every unread notification for the user as read.
   */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  },

  /**
   * Delete a single notification. Verifies ownership.
   */
  async delete(userId: string, id: string): Promise<void> {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) return;
    if (existing.userId !== userId) {
      throw new ApiErrorClass(
        403,
        'You can only delete your own notifications',
        'Forbidden'
      );
    }
    await prisma.notification.delete({ where: { id } });
  },

  /**
   * Push a new notification. Internal helper used by other services
   * (results, password reset, etc.). Returns the created notification.
   */
  async push(input: {
    userId: string;
    title: string;
    body: string;
    link?: string;
  }): Promise<NotificationResponse> {
    const created = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
    return toNotificationResponse(created);
  },
};
