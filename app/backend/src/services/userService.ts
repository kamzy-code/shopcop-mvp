import { prisma } from '@config/prisma.js';
import { AppError } from '@middleware/errorHandler.js';
import { userLogger } from '@utils/logger.js';

export class UserService {
  /**
   * Fetches a user by their ID, selecting only non-sensitive fields.
   *
   * @param userId - UUID of the user to fetch
   * @returns Sanitised user object (no auth tokens or password data)
   * @throws {AppError} 404 — No user found with the given ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      userLogger.warn('User not found by ID', { userId, action: 'getUserById' });
      throw new AppError('User not found', 404);
    }
    userLogger.info('Fetched user by ID', { userId, action: 'getUserById' });
    return user;
  }

  /**
   * Fetches a user by their email address, selecting only non-sensitive fields.
   *
   * @param email - Email address of the user to fetch
   * @returns Sanitised user object
   * @throws {AppError} 404 — No user found with the given email
   */
  static async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      userLogger.warn('User not found by email', { email, action: 'getUserByEmail' });
      throw new AppError('User not found', 404);
    }
    userLogger.info('Fetched user by email', { email, action: 'getUserByEmail' });
    return user;
  }

  /**
   * Updates a user's display name and/or avatar URL.
   * Only `name` and `avatar_url` are updatable; all other fields are ignored.
   *
   * @param userId - UUID of the user to update
   * @param data.name - New display name (optional)
   * @param data.avatar_url - New avatar image URL (optional)
   * @returns Updated sanitised user object
   * @throws {AppError} 404 — No user found with the given ID
   */
  static async updateUserInfo(userId: string, data: { name?: string; avatar_url?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar_url: data.avatar_url,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      userLogger.warn('User not found for update', { userId, action: 'updateUserInfo' });
      throw new AppError('User not found', 404);
    }
    userLogger.info('Updated user info', { userId, action: 'updateUserInfo' });
    return user;
  }

  /**
   * Returns all users in the system with non-sensitive fields.
   * Intended for admin use only — access enforcement is at the router level.
   *
   * @returns Array of sanitised user objects
   */
  //ADMIN ONLY
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
      },
    });
    userLogger.info('Fetched all users', { action: 'getAllUsers' });
    return users;
  }
}
