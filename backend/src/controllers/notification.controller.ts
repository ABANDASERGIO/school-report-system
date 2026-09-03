import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { successResponse } from '../utils/response';

export const notificationController = {
  /**
   * GET /api/v1/notifications?unreadOnly=
   * List the current user's notifications, newest first.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
        return;
      }
      const unreadOnly = req.query.unreadOnly === 'true';
      const items = await notificationService.listForUser(req.user.userId, {
        unreadOnly,
        limit: 100,
      });
      res.status(200).json(successResponse(items));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/notifications/unread-count
   * Count of unread notifications for the bell badge.
   */
  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
        return;
      }
      const count = await notificationService.unreadCount(req.user.userId);
      res.status(200).json(successResponse({ count }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read. Must belong to the current user.
   */
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
        return;
      }
      const updated = await notificationService.markRead(
        req.user.userId,
        String(req.params.id)
      );
      res.status(200).json(successResponse(updated, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/notifications/mark-all-read
   * Mark every unread notification for the current user as read.
   */
  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
        return;
      }
      const result = await notificationService.markAllRead(req.user.userId);
      res
        .status(200)
        .json(successResponse(result, `Marked ${result.updated} notification(s) as read`));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a single notification (must be owned by the current user).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
        return;
      }
      await notificationService.delete(req.user.userId, String(req.params.id));
      res.status(200).json(successResponse(null, 'Notification deleted'));
    } catch (error) {
      next(error);
    }
  },
};
