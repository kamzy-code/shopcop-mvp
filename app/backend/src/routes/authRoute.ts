import { AuthController } from '@controllers/authController.js';
import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';

const authRouter = Router();

/** POST /api/v1/auth/credential-signup — Initiate signup by sending an OTP. */
authRouter.post('/credential-signup', AuthController.credentialSignup);

/** POST /api/v1/auth/verify-account — Verify OTP and activate account. */
authRouter.post('/verify-account', AuthController.verifyAccountViaOTP);

/** POST /api/v1/auth/login — Send magic link for passwordless login. */
authRouter.post('/login', AuthController.loginWithMagicLink);

/** POST /api/v1/auth/verify-login-link — Verify magic link token and log in. */
authRouter.post('/verify-login-link', AuthController.verifyLoginlink);

/** POST /api/v1/auth/resend-otp — Resend OTP to unverified email. */
authRouter.post('/resend-otp', AuthController.resendOTP);

/** POST /api/v1/auth/logout — Clear auth cookie and end session. */
authRouter.post('/logout', authenticate, AuthController.logout);

export default authRouter;
