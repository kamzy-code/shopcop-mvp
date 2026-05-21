import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/userService.js';
import { userLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Returns the authenticated user's profile.
   *
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: user }`
   * @throws {AppError} 401 — No authenticated user on the request
   * @throws {AppError} 404 — User not found (e.g. deleted after token was issued)
   */
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

  /**
   * PUT /api/v1/users/profile
   * Updates the authenticated user's display name and/or avatar URL.
   *
   * @param req.body.name - New display name (optional)
   * @param req.body.avatar_url - New avatar image URL (optional)
   * @returns 200 `{ success, data: updatedUser }`
   * @throws {AppError} 401 — No authenticated user on the request
   */
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

  /**
   * GET /api/v1/users/admin-only
   * Returns all users. Restricted to ADMIN role (enforced at router level).
   *
   * @returns 200 `{ success, data: users[] }`
   * @throws {AppError} 500 — Database query failure
   */
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
