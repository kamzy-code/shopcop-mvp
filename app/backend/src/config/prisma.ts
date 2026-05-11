import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';
import logger from '@utils/logger.js';
import { timeStamp } from 'node:console';

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' }, // Log SQL queries in development
  ],
});

if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`, {
      duration: `${e.duration}ms`,
      service: 'PRISMA',
      timeStamp: new Date().toISOString(),
    });
  });
}

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn(e, { service: 'PRISMA', timeStamp: new Date().toISOString() });
});

// Log errors
prisma.$on('error', (e: any) => {
  logger.error(e, { service: 'PRISMA', timeStamp: new Date().toISOString() });
});

export { prisma };
