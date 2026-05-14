import { AuthController } from '@controllers/authController.js';
import { Router } from 'express';

const authRouter = Router();

// POST /api/v1/auth/credential-signup
authRouter.post('/credential-signup', AuthController.credentialSignup);

// POST /api/v1/auth/verify-account
authRouter.post('/verify-account', AuthController.verifyAccountViaOTP);

// POST /api/v1/auth/login
authRouter.post('/login', AuthController.loginWithMagicLink);

// POST /api/v1/auth/verify-login-link
authRouter.post('/verify-login-link', AuthController.verifyLoginlink);

// POST /api/v1/auth/resend-otp
authRouter.post('/resend-otp', AuthController.resendOTP);

export default authRouter;
