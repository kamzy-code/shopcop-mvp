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

  static async verifyAccountViaOTP(req: Request, res: Response, next: NextFunction) {
    const { email, otp } = req.body;

    if (!email) {
      authLogger.warn('OTP verification attempt with missing email', { action: 'verifyAccountViaOTP' });
      throw new AppError('Email is required', 400);
    }

    if (!otp) {
      authLogger.warn('OTP verification attempt with missing OTP', {
        email,
        action: 'verifyAccountViaOTP',
      });
      throw new AppError('OTP is required', 400);
    }

    try {
      const result = await AuthService.verifyOTP({ email, otp_code: otp });

      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Account verified successfully',
      });

      authLogger.info('Account verified successfully', {
        email,
        action: 'verifyAccountViaOTP',
        isVerfied: result.user.email_verified,
      });

      return;
    } catch (error) {
      authLogger.error('Error during Account verification', {
        email,
        action: 'verifyAccountViaOTP',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  static async loginWithMagicLink(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email) {
      authLogger.warn('Magic link login attempt with missing email', {
        action: 'loginWithMagicLink',
      });
      throw new AppError('Email is required', 400);
    }

    try {
      const result = await AuthService.sendMagicLink({ email });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Magic link sent successfully',
      });

      authLogger.info('Magic link sent successfully', { email, action: 'loginWithMagicLink' });
      return;
    } catch (error) {
      authLogger.error('Error during magic link login', {
        email,
        action: 'loginWithMagicLink',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  static async verifyLoginlink(req: Request, res: Response, next: NextFunction) {
    const { token } = req.body;

    if (!token) {
      authLogger.warn('Magic link verification attempt with missing token', {
        action: 'verifyLoginlink',
      });
      throw new AppError('Token is required', 400);
    }

    try {
      const result = await AuthService.verifyMagicLink({ token });

      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });

      authLogger.info('Login successful', {
        action: 'verifyLoginlink',
        status: 'success',
        user: result.user.email,
        userId: result.user.id,
        role: result.user.role,
      });
      return;
    } catch (error) {
      authLogger.error('Error during magic link verification', {
        token,
        action: 'verifyLoginlink',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  static async resendOTP(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email) {
      authLogger.warn('OTP resend attempt with missing email', { action: 'resendOTP' });
      throw new AppError('Email is required', 400);
    }

    try {
      const result = await AuthService.resendOTP(email);

      res.status(200).json({
        success: true,
        data: result,
        message: 'OTP resent successfully',
      });

      authLogger.info('OTP resent successfully', { email, action: 'resendOTP' });
      return;
    } catch (error) {
      authLogger.error('Error during OTP resend', {
        email,
        action: 'resendOTP',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }
}
