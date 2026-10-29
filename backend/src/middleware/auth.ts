import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/sessionService';
import { ENV } from '../config/env';
import { User, Session } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
  token: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.[ENV.SESSION_COOKIE_NAME];

    // Optional Bearer token header fallback for programmatic API testing
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.',
      });
    }

    const session = await SessionService.validateSession(token);

    if (!session) {
      // Clear invalid cookie
      res.clearCookie(ENV.SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: ENV.NODE_ENV === 'production',
        path: '/',
      });
      return res.status(401).json({
        error: 'Session expired or invalidated. Please log in again.',
      });
    }

    (req as AuthenticatedRequest).user = session.user;
    (req as AuthenticatedRequest).session = session;
    (req as AuthenticatedRequest).token = token;

    next();
  } catch (error) {
    next(error);
  }
}
