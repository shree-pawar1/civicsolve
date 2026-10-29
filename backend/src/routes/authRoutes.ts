import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ENV } from '../config/env';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/schemas';
import { hashPassword, verifyPassword, dummyVerifyPassword } from '../utils/password';
import { SessionService } from '../services/sessionService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, role, organization } = req.body;
    const emailNormalized = email.trim().toLowerCase();

    // Check if user with normalized email already exists
    const existing = await prisma.user.findUnique({
      where: { emailNormalized },
    });

    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in.',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        emailNormalized,
        passwordHash,
        role,
        organization: organization?.trim() || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        organization: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Account registered successfully. Please log in.',
      user,
    });
  } catch (error: any) {
    if (error?.code === 'P2002' || error?.message?.includes('emailNormalized')) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in.',
      });
    }
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const emailNormalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { emailNormalized },
    });

    if (!user) {
      // Execute dummy password verification to maintain consistent timing
      await dummyVerifyPassword(password);
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'This account has been disabled. Please contact administration.',
      });
    }

    // Attempt single-session issuance
    const { token, expiresAt } = await SessionService.createSession(user.id);

    // Set HttpOnly, SameSite=Lax cookie
    res.cookie(ENV.SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ENV.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      message: 'Login successful',
      token, // Also return for tests/clients that use Bearer auth
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.[ENV.SESSION_COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }

    if (token) {
      await SessionService.revokeSession(token);
    }

    res.clearCookie(ENV.SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ENV.NODE_ENV === 'production',
      path: '/',
    });

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  return res.status(200).json({
    user: {
      id: authReq.user.id,
      fullName: authReq.user.fullName,
      email: authReq.user.email,
      role: authReq.user.role,
      organization: authReq.user.organization,
      createdAt: authReq.user.createdAt,
    },
    sessionId: authReq.session.id,
  });
});

export default router;
