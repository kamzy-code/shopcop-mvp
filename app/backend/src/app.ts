import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '@middleware/errorHandler.js';
import authRouter from '@routes/authRoutes.js';
import rateLimit from 'express-rate-limit';
import logger from '@utils/logger.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handling middleware
app.use(errorHandler);
export default app;
