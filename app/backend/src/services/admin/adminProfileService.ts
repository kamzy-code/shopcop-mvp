import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AdminProfileInput } from '../../validators/adminProfileValidator.js';

// ============================================
// ADMIN PROFILE SERVICE
// ============================================

export class AdminProfileService {
  /**
   * Get the admin profile for a given user ID.
   * Returns null if no profile has been created yet.
   */
  static async getProfile(userId: string) {
    adminLogger.info('Fetching admin profile', { action: 'getProfile', userId });

    const profile = await prisma.adminProfile.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { email: true, name: true, avatar_url: true, role: true },
        },
      },
    });

    return profile;
  }

  /**
   * Create or update the admin profile for a given user ID.
   * Computes profile_complete = first_name, last_name, and phone_number are all set.
   * Logs the action to AdminActivityLog.
   */
  static async upsertProfile(userId: string, data: AdminProfileInput) {
    adminLogger.info('Upserting admin profile', { action: 'upsertProfile', userId });

    // We need to know what's already stored to compute completeness across partial updates
    const existing = await prisma.adminProfile.findUnique({
      where: { user_id: userId },
      select: { id: true, first_name: true, last_name: true, phone_number: true },
    });

    const mergedFirstName = data.first_name ?? existing?.first_name ?? null;
    const mergedLastName = data.last_name ?? existing?.last_name ?? null;
    const mergedPhone = data.phone_number ?? existing?.phone_number ?? null;
    const profileComplete = !!(mergedFirstName && mergedLastName && mergedPhone);

    const profile = await prisma.adminProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
        profile_complete: profileComplete,
      },
      update: {
        ...data,
        profile_complete: profileComplete,
      },
      include: {
        user: {
          select: { email: true, name: true, avatar_url: true, role: true },
        },
      },
    });

    if (mergedFirstName && mergedLastName) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: `${mergedFirstName} ${mergedLastName}` },
      });
    }

    await this.logAdminAction(userId, 'admin_profile_updated', profile.id, {
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      department: data.department ?? null,
      role_title: data.role_title ?? null,
      profile_complete: profile.profile_complete,
    });

    return profile;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private static async logAdminAction(
    adminId: string,
    actionType: string,
    targetId: string,
    metadata: Record<string, string | boolean | null>
  ) {
    try {
      await prisma.adminActivityLog.create({
        data: {
          admin_id: adminId,
          action_type: actionType,
          target_type: 'admin_profile',
          target_id: targetId,
          after_data: metadata,
        },
      });
    } catch (error) {
      adminLogger.error('Failed to log admin action', {
        action: 'logAdminAction',
        adminId,
        actionType,
        targetId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
