import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createProblemSchema, updateProblemSchema, statusTransitionSchema } from '../validators/schemas';
import { Role, ProblemStatus, Category, Priority, Prisma } from '@prisma/client';

const router = Router();

// Allowed status transition map (strict state machine)
const ALLOWED_TRANSITIONS: Record<ProblemStatus, ProblemStatus[]> = {
  [ProblemStatus.SUBMITTED]: [ProblemStatus.UNDER_REVIEW, ProblemStatus.CLOSED],
  [ProblemStatus.UNDER_REVIEW]: [ProblemStatus.IN_PROGRESS, ProblemStatus.CLOSED],
  [ProblemStatus.IN_PROGRESS]: [ProblemStatus.RESOLVED, ProblemStatus.CLOSED],
  [ProblemStatus.RESOLVED]: [], // Terminal state
  [ProblemStatus.CLOSED]: [], // Terminal state
};

// GET /api/problems - List problems with query filtering and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, priority, search, page = '1', limit = '10', creatorId } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.ProblemWhereInput = {};

    if (category && Object.values(Category).includes(category as Category)) {
      where.category = category as Category;
    }

    if (status && Object.values(ProblemStatus).includes(status as ProblemStatus)) {
      where.status = status as ProblemStatus;
    }

    if (priority && Object.values(Priority).includes(priority as Priority)) {
      where.priority = priority as Priority;
    }

    if (creatorId && typeof creatorId === 'string') {
      where.creatorId = creatorId;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, problems] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              organization: true,
              role: true,
            },
          },
          _count: {
            select: {
              solutions: true,
              updates: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      data: problems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/problems - Citizen creates a problem
router.post(
  '/',
  requireAuth,
  requireRole(Role.CITIZEN),
  validateBody(createProblemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { title, description, category, location, priority } = req.body;

      const problem = await prisma.$transaction(async (tx) => {
        const created = await tx.problem.create({
          data: {
            title,
            description,
            category,
            location,
            priority,
            status: ProblemStatus.SUBMITTED,
            creatorId: authReq.user.id, // Strictly from session, ignoring any client-sent creatorId
          },
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        });

        // Record initial timeline event
        await tx.progressUpdate.create({
          data: {
            problemId: created.id,
            authorId: authReq.user.id,
            fromStatus: ProblemStatus.SUBMITTED,
            toStatus: ProblemStatus.SUBMITTED,
            message: 'Problem initially reported by citizen.',
          },
        });

        return created;
      });

      return res.status(201).json({
        message: 'Problem reported successfully',
        problem,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/problems/:id - Fetch problem detail with creator, solutions, and timeline
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            role: true,
            organization: true,
          },
        },
        solutions: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
                organization: true,
              },
            },
            supports: {
              select: {
                userId: true,
              },
            },
            _count: {
              select: { supports: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
                organization: true,
              },
            },
          },
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    return res.status(200).json({ problem });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/problems/:id - Citizen edits own problem (only while SUBMITTED)
router.patch(
  '/:id',
  requireAuth,
  requireRole(Role.CITIZEN),
  validateBody(updateProblemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const existing = await prisma.problem.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      // Check ownership
      if (existing.creatorId !== authReq.user.id) {
        return res.status(403).json({ error: 'You are not authorized to modify this problem' });
      }

      // Check status
      if (existing.status !== ProblemStatus.SUBMITTED) {
        return res.status(400).json({
          error: `Cannot edit problem in status '${existing.status}'. Only 'SUBMITTED' problems may be edited.`,
        });
      }

      const updated = await prisma.problem.update({
        where: { id },
        data: req.body,
      });

      return res.status(200).json({
        message: 'Problem updated successfully',
        problem: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/problems/:id - Citizen deletes own problem (only while SUBMITTED)
router.delete(
  '/:id',
  requireAuth,
  requireRole(Role.CITIZEN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const existing = await prisma.problem.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      if (existing.creatorId !== authReq.user.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this problem' });
      }

      if (existing.status !== ProblemStatus.SUBMITTED) {
        return res.status(400).json({
          error: `Cannot delete problem in status '${existing.status}'. Only 'SUBMITTED' problems may be deleted.`,
        });
      }

      // Delete associated progress updates first, then problem
      await prisma.$transaction([
        prisma.progressUpdate.deleteMany({ where: { problemId: id } }),
        prisma.problem.delete({ where: { id } }),
      ]);

      return res.status(200).json({
        message: 'Problem deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/problems/:id/status - Government changes status through valid transitions
router.post(
  '/:id/status',
  requireAuth,
  requireRole(Role.GOVERNMENT),
  validateBody(statusTransitionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { toStatus, message } = req.body;

      const problem = await prisma.problem.findUnique({
        where: { id },
      });

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      // Verify valid status transition
      const allowedNext = ALLOWED_TRANSITIONS[problem.status] || [];
      if (!allowedNext.includes(toStatus)) {
        return res.status(422).json({
          error: `Invalid status transition from '${problem.status}' to '${toStatus}'. Allowed transitions are: [${allowedNext.join(', ')}]`,
        });
      }

      // Atomic transition and timeline logging
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.problem.update({
          where: { id },
          data: { status: toStatus },
        });

        const timelineEntry = await tx.progressUpdate.create({
          data: {
            problemId: id,
            authorId: authReq.user.id,
            fromStatus: problem.status,
            toStatus,
            message: message.trim(),
          },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
                organization: true,
              },
            },
          },
        });

        return { updated, timelineEntry };
      });

      return res.status(200).json({
        message: `Status successfully changed to ${toStatus}`,
        problem: result.updated,
        timelineEntry: result.timelineEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
