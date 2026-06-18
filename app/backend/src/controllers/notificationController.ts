import { Request, Response, NextFunction } from 'express';
import { AppError } from '@middleware/errorHandler.js';
import { notificationLogger } from '@utils/logger.js';
import { NotificationService } from '@services/notificationService.js';
import { getNewNotificationsSchema } from '@validators/notificationValidator.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

// ============================================
// NOTIFICATION CONTROLLER
// ============================================

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * Returns the latest 20 notifications for the authenticated user, plus unread count.
   *
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: { notifications, unread_count } }`
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'getNotifications';
    try {
      const [notifications, unread_count] = await Promise.all([
        NotificationService.getForUser(userId),
        NotificationService.getUnreadCount(userId),
      ]);
      notificationLogger.info('Notifications fetched', { action, userId });
      res.status(200).json({ success: true, data: { notifications, unread_count } });
    } catch (error) {
      notificationLogger.error('Failed to fetch notifications', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/new?since=<ISO8601>
   * Returns unread notifications created after `since`. Used by the polling client
   * to surface new events without re-fetching the full list.
   *
   * @param req.query.since - ISO8601 timestamp of the last poll (required)
   * @param req.user.userId - Authenticated user's ID
   * @returns 200 `{ success, data: { notifications } }`
   * @throws {AppError} 400 — `since` param is missing or not a valid date
   */
  static async getNewNotifications(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'getNewNotifications';

    const parsed = getNewNotificationsSchema.safeParse(req.query);
    if (!parsed.success) {
      notificationLogger.warn('Validation failed for getNewNotifications', {
        action,
        userId,
        errors: parsed.error.issues,
      });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    const sinceDate = new Date(parsed.data.since);

    try {
      const notifications = await NotificationService.getNewSince(userId, sinceDate);
      res.status(200).json({ success: true, data: { notifications } });
    } catch (error) {
      notificationLogger.error('Failed to fetch new notifications', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Marks a single notification as read. Scoped to the authenticated user.
   *
   * @param req.params.id  - Notification record ID
   * @param req.user.userId - Authenticated user's ID
   * @returns 200 `{ success, message }`
   */
  static async markRead(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'markRead';
    const id = req.params['id'] as string;
    try {
      await NotificationService.markRead(id, userId);
      notificationLogger.info('Notification marked as read', { action, userId, notificationId: id });
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      notificationLogger.error('Failed to mark notification as read', {
        action,
        userId,
        notificationId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Marks all unread notifications as read for the authenticated user.
   *
   * @param req.user.userId - Authenticated user's ID
   * @returns 200 `{ success, message }`
   */
  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'markAllRead';
    try {
      await NotificationService.markAllRead(userId);
      notificationLogger.info('All notifications marked as read', { action, userId });
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      notificationLogger.error('Failed to mark all notifications as read', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
