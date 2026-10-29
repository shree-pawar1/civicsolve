import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import solutionRoutes from './routes/solutionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Handled separately or in production reverse proxy
    crossOriginEmbedderPolicy: false,
  })
);

// Strict CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ENV.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Supertest)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CivicSolve-Request'],
  })
);

// Body and Cookie parsers
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(ENV.SESSION_SECRET));

// Rate limiting for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 login/register requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Dedicated AI rate limiter to prevent abuse and API quota exhaustion
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 AI requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    available: false,
    error: 'AI analysis is unavailable due to rate limits. Please slow down and try again later.',
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});

// CSRF Defense middleware for state-changing browser requests:
// Verify custom header or same-origin / fetch metadata
app.use((req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const secFetchSite = req.headers['sec-fetch-site'];

  // If Sec-Fetch-Site is present and cross-site, reject
  if (secFetchSite === 'cross-site') {
    return res.status(403).json({ error: 'Cross-site request blocked.' });
  }

  // If origin is present, check against allowed origins
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Untrusted request origin.' });
  }

  next();
});

// Apply rate limiters
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/problems', aiRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api', solutionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

export default app;
