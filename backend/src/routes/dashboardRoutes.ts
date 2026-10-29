import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ProblemStatus, Category, Role } from '@prisma/client';

const router = Router();

// GET /api/dashboard/stats - Real aggregates from database
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalProblems,
      totalSolutions,
      totalSupports,
      totalUsers,
      statusGroups,
      categoryGroups,
      userRoleGroups,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.solution.count(),
      prisma.solutionSupport.count(),
      prisma.user.count(),
      prisma.problem.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.problem.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    // Format by status with 0 defaults
    const statusCounts: Record<string, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.status;
    });

    // Format by category with 0 defaults
    const categoryCounts: Record<string, number> = {};
    Object.values(Category).forEach((cat) => {
      categoryCounts[cat] = 0;
    });
    categoryGroups.forEach((g) => {
      categoryCounts[g.category] = g._count.category;
    });

    // Format by role with 0 defaults
    const roleCounts: Record<string, number> = {
      CITIZEN: 0,
      UNIVERSITY: 0,
      INDUSTRY: 0,
      GOVERNMENT: 0,
    };
    userRoleGroups.forEach((g) => {
      roleCounts[g.role] = g._count.role;
    });

    const resolutionRate =
      totalProblems > 0
        ? Math.round((statusCounts.RESOLVED / totalProblems) * 100)
        : 0;

    return res.status(200).json({
      summary: {
        totalProblems,
        totalSolutions,
        totalSupports,
        totalUsers,
        resolutionRate,
      },
      statusBreakdown: statusCounts,
      categoryBreakdown: categoryCounts,
      roleBreakdown: roleCounts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/activity - Recent real audit events
router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recentUpdates = await prisma.progressUpdate.findMany({
      take: 10,
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
        problem: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    return res.status(200).json({
      activity: recentUpdates,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
