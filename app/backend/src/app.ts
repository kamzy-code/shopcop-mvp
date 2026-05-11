import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '@middleware/errorHandler.js';

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('api/v1/auth', () => {});

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
