import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '@middleware/errorHandler.js';
import authRouter from '@routes/authRoute.js';
import rateLimit from 'express-rate-limit';
import logger from '@utils/logger.js';
import userRouter from '@routes/userRoute.js';
import cookieParser from 'cookie-parser';
import fileUploadRouter from '@routes/fileUplaodRoute.js';
import vendorRouter from '@routes/vendorRoute.js';
import verificationRouter from '@routes/verificationRoute.js';
import adminVerificationRouter from '@routes/admin/adminVerificationRoute.js';
import adminUserRouter from '@routes/admin/adminUserRoute.js';
import adminDashboardRouter from '@routes/admin/adminDashboardRoute.js';
import adminProfileRouter from '@routes/admin/adminProfileRoute.js';
import categoryRouter from '@routes/businessCategoryRoute.js';
import productRouter from '@routes/productRoute.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'http://localhost:3000',
            'https://shopcop-mvp-frontend-mtwz.vercel.app',
            'https://getshopcop.com'
          ]
        : ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl === '/health') {
    next();
    return;
  }

  logger.info(`[${req.method}] ${req.originalUrl}`, {
    service: 'requestLogger',
    action: 'logHttpRequest',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/uploads', fileUploadRouter);
app.use('/api/v1/vendors', vendorRouter);
app.use('/api/v1/verifications', verificationRouter);
app.use('/api/v1/admin/verifications', adminVerificationRouter);
app.use('/api/v1/admin/users', adminUserRouter);
app.use('/api/v1/admin/dashboard', adminDashboardRouter);
app.use('/api/v1/admin/profile', adminProfileRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    service: 'notFound',
    action: 'logMissingRoute',
    url: req.originalUrl,
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handling middleware
app.use(errorHandler);
export default app;
