import { AuthController } from '@controllers/authController.js';
import { Router } from 'express';

const authRouter = Router();

// POST /api/v1/auth/credential-signup
authRouter.post('/credential-signup', AuthController.credentialSignup);

export default authRouter;
