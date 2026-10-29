import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5432/civicsolve?schema=public',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:5432/civicsolve_test?schema=public',
  SESSION_SECRET: process.env.SESSION_SECRET || 'civicsolve-super-secure-production-secret-min-64-characters-key',
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'civic_session',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
