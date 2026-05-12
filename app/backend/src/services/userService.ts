import { prisma } from '@config/prisma.js';
import { AppError } from '@middleware/errorHandler.js';
import { userLogger } from '@utils/logger.js';

export class UserService {
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
