import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // External APIs
  SMS_API_KEY?: string;
  SMS_SENDER_ID: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  NIN_API_KEY?: string;
  NIN_API_URL?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '5001')),
  
  DATABASE_URL: getEnv('DATABASE_URL'),
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(getEnv('REDIS_PORT', '6379')),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '30d'),
  
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_SENDER_ID: getEnv('SMS_SENDER_ID', 'NOVA'),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  NIN_API_KEY: process.env.NIN_API_KEY,
  NIN_API_URL: process.env.NIN_API_URL,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
};