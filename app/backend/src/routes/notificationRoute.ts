import { Router } from 'express';
import { NotificationController } from '@controllers/notificationController.js';
import { authenticate } from '@middleware/authMiddleware.js';

const notificationRouter = Router();

notificationRouter.use(authenticate);

/** GET /api/v1/notifications — Fetch latest 20 notifications + unread count for the authenticated user. */
notificationRouter.get('/', NotificationController.getNotifications);

/** GET /api/v1/notifications/new?since=<ISO8601> — Polling: return unread notifications created after `since`. */
notificationRouter.get('/new', NotificationController.getNewNotifications);

/** PATCH /api/v1/notifications/read-all — Mark all notifications as read. */
notificationRouter.patch('/read-all', NotificationController.markAllRead);

/** PATCH /api/v1/notifications/:id/read — Mark a single notification as read. */
notificationRouter.patch('/:id/read', NotificationController.markRead);

export default notificationRouter;
