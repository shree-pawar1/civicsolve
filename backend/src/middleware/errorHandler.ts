import { Request, Response, NextFunction } from 'express';
import { SessionConflictError } from '../services/sessionService';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Session conflict (single-session violation)
  if (err instanceof SessionConflictError || err.name === 'SessionConflictError' || err.statusCode === 409) {
    return res.status(409).json({
      error: err.message || 'This account already has an active session. Please log out from the other device before logging in again.',
    });
  }

  // App specific errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma unique constraint violation
  if (err?.code === 'P2002') {
    const target = err.meta?.target;
    if (Array.isArray(target) && target.includes('emailNormalized')) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in.',
      });
    }
    if (String(err.message).includes('emailNormalized')) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in.',
      });
    }
    if (String(err.message).includes('idx_sessions_user_active')) {
      return res.status(409).json({
        error: 'This account already has an active session. Please log out from the other device before logging in again.',
      });
    }
    return res.status(409).json({
      error: 'A resource with this identifier already exists.',
    });
  }

  // Fallback for unexpected internal errors
  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    error: 'An internal server error occurred. Please try again later.',
  });
}
