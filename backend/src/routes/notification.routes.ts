import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/notifications/unread-count
 * Bell badge count. Must come BEFORE /:id routes.
 */
router.get('/unread-count', notificationController.unreadCount);

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark every notification read. Must come BEFORE /:id.
 */
router.post('/mark-all-read', notificationController.markAllRead);

/**
 * GET /api/v1/notifications
 * List the current user's notifications.
 */
router.get('/', notificationController.list);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch('/:id/read', notificationController.markRead);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification.
 */
router.delete('/:id', notificationController.delete);

export default router;
