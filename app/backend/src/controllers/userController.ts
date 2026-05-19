import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/userService.js';
import { userLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class UserController {
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    const action = 'getCurrentUser';
    const userId = req.user?.userId;

    if (!userId) {
      userLogger.warn('Get profile attempt without authentication', { action });
      throw new AppError('Authentication required', 401);
    }

    try {
      const result = await UserService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User profile fetched successfully',
      });

      userLogger.info('User profile fetched successfully', { userId, role: result.role, action });
    } catch (error) {
      userLogger.error('Error fetching user profile', {
        userId,
        action,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    const action = 'updateProfile';
    const userId = req.user?.userId;

    if (!userId) {
      userLogger.warn('Update profile attempt without authentication', { action });
      throw new AppError('Authentication required', 401);
    }

    const { name, avatar_url } = req.body;

    try {
      const result = await UserService.updateUserInfo(userId, { name, avatar_url });

      res.status(200).json({
        success: true,
        data: result,
        message: 'User profile updated successfully',
      });

      userLogger.info('User profile updated successfully', {
        userId,
        role: result.role,
        name: result.name,
        avatar_url: result.avatar_url,
        action,
      });
    } catch (error) {
      userLogger.error('Error updating user profile', {
        userId,
        action,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    const action = 'listUsers';

    try {
      const result = await UserService.getAllUsers();

      res.status(200).json({
        success: true,
        data: result,
        message: 'User list fetched successfully',
      });

      userLogger.info('User list fetched successfully', { action, count: result.length });
    } catch (error) {
      userLogger.error('Error fetching user list', {
        action,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}
