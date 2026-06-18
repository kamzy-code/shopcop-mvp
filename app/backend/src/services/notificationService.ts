import { prisma } from '@config/prisma.js';
import { notificationLogger } from '@utils/logger.js';
import { CreateNotificationInput } from '../types/notification.types.js';

// ============================================
// NOTIFICATION SERVICE
// ============================================

export class NotificationService {
  /**
   * Create a new in-app notification for a user.
   * Failures are intentionally non-throwing — notifications must not break the
   * calling service's main operation. Wrap call sites in try/catch if needed.
   *
   * @param data - Notification fields (user_id, type, title, message, optional entity + action)
   * @returns The created Notification record
   */
  static async create(data: CreateNotificationInput) {
    const notification = await prisma.notification.create({ data });
    notificationLogger.info('Notification created', {
      action: 'create',
      userId: data.user_id,
      type: data.type,
    });
    return notification;
  }

  /**
   * Fetch the latest notifications for a user, newest first.
   *
   * @param userId - Authenticated user's ID
   * @param limit  - Maximum records to return (default 20)
   * @returns Array of Notification records
   */
  static async getForUser(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Return unread notifications created strictly after `since`.
   * Used by the polling endpoint to surface new notifications without re-sending already-seen ones.
   *
   * @param userId - Authenticated user's ID
   * @param since  - Timestamp of the last poll (exclusive lower bound)
   * @returns Array of unread Notification records
   */
  static async getNewSince(userId: string, since: Date) {
    return prisma.notification.findMany({
      where: {
        user_id: userId,
        read: false,
        created_at: { gt: since },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Count unread notifications for a user.
   *
   * @param userId - Authenticated user's ID
   * @returns Number of unread notifications
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { user_id: userId, read: false },
    });
  }

  /**
   * Mark a single notification as read. Scoped to the owning user to prevent cross-user access.
   *
   * @param notificationId - Notification record ID
   * @param userId         - Authenticated user's ID (ownership check)
   */
  static async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true, read_at: new Date() },
    });
  }

  /**
   * Mark all unread notifications as read for a user.
   *
   * @param userId - Authenticated user's ID
   */
  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true, read_at: new Date() },
    });
  }
}
