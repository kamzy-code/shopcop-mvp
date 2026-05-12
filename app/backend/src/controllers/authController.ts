import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@services/authService.js';
import { authLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class AuthController {
  static async credentialSignup(req: Request, res: Response, next: NextFunction) {
    const { email, role } = req.body;

    if (!email) {
      authLogger.warn('Signup attempt with missing email', { action: 'credentialSignup' });
      throw new AppError('Email is required', 400);
    }

    if (!role) {
      authLogger.warn('Signup attempt with missing role', { email, action: 'credentialSignup' });
      throw new AppError('Role is required', 400);
    }

    try {
      const result = await AuthService.signupWithEmail({ email, role });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });

      authLogger.info('Signup OTP sent successfully', { email, action: 'credentialSignup' });
      return;
    } catch (error) {
      authLogger.error('Error during credential signup', {
        email,
        action: 'credentialSignup',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }
}
