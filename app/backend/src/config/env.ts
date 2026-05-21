import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});
/** All typed environment variables consumed by the application. */
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SMS_API_KEY?: string;
  SMS_SENDER_ID: string;
  RESEND_API_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
  NIN_API_KEY?: string;
  NIN_API_URL?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

/**
 * Reads an environment variable by key, returning a default value if provided.
 *
 * @param key - Name of the environment variable
 * @param defaultValue - Fallback value if the variable is not set
 * @returns The resolved string value
 * @throws {Error} When the variable is absent and no default is supplied
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

/**
 * Typed, validated snapshot of all required environment variables.
 * Populated at module load time; throws immediately if a required variable is missing.
 */
export const env: EnvConfig = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '5001')),
  
  DATABASE_URL: getEnv('DATABASE_URL'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:3000'),
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(getEnv('REDIS_PORT', '6379')),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '30d'),
  
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_SENDER_ID: getEnv('SMS_SENDER_ID', 'NOVA'),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
  NIN_API_KEY: process.env.NIN_API_KEY,
  NIN_API_URL: process.env.NIN_API_URL,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
};