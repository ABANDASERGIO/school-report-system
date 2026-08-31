import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

export const env = {
  // Server
  port: getEnvNumber('PORT', 3001),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),

  // JWT
  jwt: {
    accessSecret: getEnvVar('JWT_ACCESS_SECRET'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
    accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Cloudinary
  cloudinary: {
    cloudName: getOptionalEnvVar('CLOUDINARY_CLOUD_NAME'),
    apiKey: getOptionalEnvVar('CLOUDINARY_API_KEY'),
    apiSecret: getOptionalEnvVar('CLOUDINARY_API_SECRET'),
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
