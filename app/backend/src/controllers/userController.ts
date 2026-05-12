import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/userService.js';
import { userLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;

    if (!userId) {
      userLogger.warn('Get profile attempt without authentication', { action: 'getProfile' });
      throw new AppError('Authentication required', 401);
    }

    try {
      const result = await UserService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User profile fetched successfully',
      });

      userLogger.info('User profile fetched successfully', {
        userId,
        role: result.role,
        action: 'getProfile',
      });
      return;
    } catch (error) {
      userLogger.error('Error fetching user profile', {
        userId,
        action: 'getProfile',
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;

    if (!userId) {
      userLogger.warn('Update profile attempt without authentication', { action: 'updateProfile' });
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
        action: 'updateProfile',
      });
      return;
    } catch (error) {
      userLogger.error('Error updating user profile', {
        userId,
        action: 'updateProfile',
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAllUsers();

      res.status(200).json({
        success: true,
        data: result,
        message: 'User list fetched successfully',
      });

      userLogger.info('User list fetched successfully', {
        action: 'listUsers',
        count: result.length,
      });
      return;
    } catch (error) {
      userLogger.error('Error fetching user list', {
        action: 'listUsers',
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}
