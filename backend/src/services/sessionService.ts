import { prisma } from '../config/db';
import { generateSessionToken, hashSessionToken } from '../utils/token';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes sliding window
const ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours absolute expiration

export class SessionConflictError extends Error {
  statusCode = 409;
  constructor(message = 'This account already has an active session. Please log out from the other device before logging in again.') {
    super(message);
    this.name = 'SessionConflictError';
  }
}

export class SessionService {
  /**
   * Concurrency-safe creation of a single session per user using database row lock and partial unique index
   */
  static async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ABSOLUTE_LIFETIME_MS);
    const idleThreshold = new Date(now.getTime() - IDLE_TIMEOUT_MS);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Lock the user row to serialize simultaneous login attempts for this user
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

        // 2. Automatically mark sessions as revoked if they passed the absolute expiration OR idle timeout (using UTC)
        await tx.$executeRaw`
          UPDATE "Session"
          SET "revokedAt" = (NOW() AT TIME ZONE 'UTC')
          WHERE "userId" = ${userId}
            AND "revokedAt" IS NULL
            AND ("expiresAt" < (NOW() AT TIME ZONE 'UTC') OR "lastSeenAt" < ((NOW() AT TIME ZONE 'UTC') - INTERVAL '30 minutes'))
        `;

        // 3. Check for any remaining active unrevoked session
        const activeSessions = await tx.session.findMany({
          where: {
            userId,
            revokedAt: null,
          },
        });

        if (activeSessions.length > 0) {
          throw new SessionConflictError();
        }

        // 4. Insert the new session
        await tx.session.create({
          data: {
            userId,
            tokenHash,
            createdAt: now,
            lastSeenAt: now,
            expiresAt,
          },
        });
      });

      return { token: rawToken, expiresAt };
    } catch (error: any) {
      if (error instanceof SessionConflictError) {
        throw error;
      }
      // If a database partial unique index violation (P2002) is caught from parallel execution
      if (error?.code === 'P2002' || error?.message?.includes('idx_sessions_user_active')) {
        throw new SessionConflictError();
      }
      throw error;
    }
  }

  /**
   * Validates an active session token, checks idle timeout and absolute expiry,
   * updates lastSeenAt on success, or revokes on expiry.
   */
  static async validateSession(rawToken: string) {
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.revokedAt) {
      return null;
    }

    if (!session.user.isActive) {
      await this.revokeSessionById(session.id);
      return null;
    }

    // Check absolute expiration (8 hours)
    if (session.expiresAt < now) {
      await this.revokeSessionById(session.id);
      return null;
    }

    // Check sliding idle timeout (30 minutes)
    const timeSinceLastSeen = now.getTime() - session.lastSeenAt.getTime();
    if (timeSinceLastSeen > IDLE_TIMEOUT_MS) {
      await this.revokeSessionById(session.id);
      return null;
    }

    // Update lastSeenAt for sliding expiration
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });

    return session;
  }

  /**
   * Revokes session by token hash (e.g. during logout)
   */
  static async revokeSession(rawToken: string): Promise<boolean> {
    const tokenHash = hashSessionToken(rawToken);
    const result = await prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  /**
   * Revokes session by ID
   */
  static async revokeSessionById(sessionId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revokes all active sessions for a given user
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
