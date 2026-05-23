import { env } from '@config/env.js';
import app from './app.js';
import logger from '@utils/logger.js';
import { prisma } from '@config/prisma.js';

const PORT = env.PORT;

const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`, {
    service: 'server',
    action: 'shutdown',
    timestamp: new Date().toISOString(),
  });

  // Close Redis

  // Close database
  await prisma.$disconnect();
  logger.info('Database connection closed', {
    service: 'server',
    action: 'disconnectDB',
    timestamp: new Date().toISOString(),
  });

  process.exit(0);
};

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected successfully', {
      service: 'server',
      action: 'connectDB',
      timestamp: new Date().toISOString(),
    });

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {
        service: 'server',
        action: 'startServer',
        timestamp: new Date().toISOString(),
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', {
      service: 'server',
      action: 'startServer',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    service: 'server',
    action: 'unhandledRejection',
    timestamp: new Date().toISOString(),
    promise,
    reason,
  });
  shutdown('UnhandledRejection');
});
// 
startServer();
