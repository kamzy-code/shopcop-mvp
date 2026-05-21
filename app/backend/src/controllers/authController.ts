import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@services/authService.js';
import { authLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class AuthController {
  /**
   * POST /api/v1/auth/credential-signup
   * Initiates email signup by sending a 6-digit OTP to the provided address.
   *
   * @param req.body.email - Email address to register
   * @param req.body.role - Desired role: "VENDOR" or "BUYER"
   * @returns 200 `{ success, data: { message, email } }`
   * @throws {AppError} 400 — Missing email or role
   * @throws {AppError} 400 — Email already registered and verified
   * @throws {AppError} 429 — Rate limit exceeded
   * @throws {AppError} 500 — Email delivery failure
   */
  static async credentialSignup(req: Request, res: Response, next: NextFunction) {
    const action = 'credentialSignup';
    const { email, role } = req.body;

    if (!email) {
      authLogger.warn('Signup attempt with missing email', { action });
      throw new AppError('Email is required', 400);
    }

    if (!role) {
      authLogger.warn('Signup attempt with missing role', { email, action });
      throw new AppError('Role is required', 400);
    }

    try {
      const result = await AuthService.signupWithEmail({ email, role });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });

      authLogger.info('Signup OTP sent successfully', { email, action });
      return;
    } catch (error) {
      authLogger.error('Error during credential signup', {
        email,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  /**
   * POST /api/v1/auth/verify-account
   * Verifies the OTP submitted during signup and activates the account.
   * Sets the JWT as an httpOnly `auth_token` cookie (30-day expiry).
   *
   * @param req.body.email - Email address being verified
   * @param req.body.otp - 6-digit OTP code
   * @returns 200 `{ success, data: { user } }`
   * @throws {AppError} 400 — Missing email or OTP
   * @throws {AppError} 400 — Invalid or expired OTP
   * @throws {AppError} 400 — Too many failed attempts
   */
  static async verifyAccountViaOTP(req: Request, res: Response, next: NextFunction) {
    const action = 'verifyAccountViaOTP';
    const { email, otp } = req.body;

    if (!email) {
      authLogger.warn('OTP verification attempt with missing email', { action });
      throw new AppError('Email is required', 400);
    }

    if (!otp) {
      authLogger.warn('OTP verification attempt with missing OTP', { email, action });
      throw new AppError('OTP is required', 400);
    }

    try {
      const { token, user } = await AuthService.verifyOTP({ email, otp_code: otp });

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Account verified successfully',
      });

      authLogger.info('Account verified successfully', {
        email,
        action,
        isVerified: user.email_verified,
      });

      return;
    } catch (error) {
      authLogger.error('Error during Account verification', {
        email,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  /**
   * POST /api/v1/auth/login
   * Sends a magic link to the registered email address for passwordless login.
   *
   * @param req.body.email - Registered email address
   * @returns 200 `{ success, data: { message, email } }`
   * @throws {AppError} 400 — Missing email
   * @throws {AppError} 404 — No account found for the email
   * @throws {AppError} 429 — Rate limit exceeded
   */
  static async loginWithMagicLink(req: Request, res: Response, next: NextFunction) {
    const action = 'loginWithMagicLink';
    const { email } = req.body;

    if (!email) {
      authLogger.warn('Magic link login attempt with missing email', { action });
      throw new AppError('Email is required', 400);
    }

    try {
      const result = await AuthService.sendMagicLink({ email });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Magic link sent successfully',
      });

      authLogger.info('Magic link sent successfully', { email, action });
      return;
    } catch (error) {
      authLogger.error('Error during magic link login', {
        email,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  /**
   * POST /api/v1/auth/verify-login-link
   * Verifies a magic link token and logs the user in.
   * Sets the JWT as an httpOnly `auth_token` cookie (30-day expiry).
   *
   * @param req.body.token - UUID magic link token from the login email
   * @returns 200 `{ success, data: { user } }`
   * @throws {AppError} 400 — Missing token
   * @throws {AppError} 400 — Invalid, expired, or already-used token
   */
  static async verifyLoginlink(req: Request, res: Response, next: NextFunction) {
    const action = 'verifyLoginlink';
    const { token } = req.body;

    if (!token) {
      authLogger.warn('Magic link verification attempt with missing token', { action });
      throw new AppError('Token is required', 400);
    }

    try {
      const { token: jwtToken, user } = await AuthService.verifyMagicLink({ token });

      res.cookie('auth_token', jwtToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Login successful',
      });

      authLogger.info('Login successful', {
        action,
        status: 'success',
        user: user.email,
        userId: user.id,
        role: user.role,
      });
      return;
    } catch (error) {
      authLogger.error('Error during magic link verification', {
        token,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  /**
   * POST /api/v1/auth/resend-otp
   * Resends the OTP to an unverified email address.
   *
   * @param req.body.email - Email address to resend the OTP to
   * @returns 200 `{ success, data: { message, email } }`
   * @throws {AppError} 400 — Missing email
   * @throws {AppError} 400 — Email already verified
   * @throws {AppError} 429 — Rate limit exceeded
   */
  static async resendOTP(req: Request, res: Response, next: NextFunction) {
    const action = 'resendOTP';
    const { email } = req.body;

    if (!email) {
      authLogger.warn('OTP resend attempt with missing email', { action });
      throw new AppError('Email is required', 400);
    }

    try {
      const result = await AuthService.resendOTP(email);

      res.status(200).json({
        success: true,
        data: result,
        message: 'OTP resent successfully',
      });

      authLogger.info('OTP resent successfully', { email, action });
      return;
    } catch (error) {
      authLogger.error('Error during OTP resend', {
        email,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Clears the `auth_token` httpOnly cookie, ending the session.
   * Requires the user to be authenticated (cookie must be present).
   *
   * @returns 200 `{ success, message: "Logout successful" }`
   * @throws {AppError} 400 — No authenticated user on the request
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    const action = 'logout';
    const user = req.user;

    if (!user) {
      authLogger.warn('Authentication is required to logout', { action });
      throw new AppError('Authentication is required to logout', 400);
    }
    try {
      res
        .clearCookie('auth_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          path: '/',
        })
        .status(200)
        .json({ success: true, message: 'Logout successful' });

      authLogger.info('Logout successful', { userId: user?.userId, action });
      return;
    } catch (error) {
      authLogger.error('Logout error', {
        userId: user?.userId,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }
}
