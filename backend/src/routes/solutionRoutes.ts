import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createSolutionSchema, updateSolutionSchema, reviewSolutionSchema } from '../validators/schemas';
import { Role, SolutionType, ReviewStatus } from '@prisma/client';

const router = Router();

// POST /api/problems/:problemId/solutions - Submit solution proposal (University) or recommendation (Industry)
router.post(
  '/problems/:problemId/solutions',
  requireAuth,
  requireRole(Role.UNIVERSITY, Role.INDUSTRY),
  validateBody(createSolutionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { problemId } = req.params;
      const { title, explanation, expectedBenefits, implementationApproach } = req.body;

      // Verify problem exists and is not closed/resolved
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
      });

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      if (problem.status === 'CLOSED') {
        return res.status(400).json({ error: 'Cannot submit solution proposals to a closed problem' });
      }

      const solutionType = authReq.user.role === Role.UNIVERSITY ? SolutionType.PROPOSAL : SolutionType.RECOMMENDATION;

      const solution = await prisma.solution.create({
        data: {
          problemId,
          authorId: authReq.user.id,
          authorRole: authReq.user.role,
          type: solutionType,
          title,
          explanation,
          expectedBenefits,
          implementationApproach,
          reviewStatus: ReviewStatus.SUBMITTED,
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

      return res.status(201).json({
        message: 'Solution submitted successfully',
        solution,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/solutions/:id - Edit own solution (author only)
router.patch(
  '/solutions/:id',
  requireAuth,
  requireRole(Role.UNIVERSITY, Role.INDUSTRY),
  validateBody(updateSolutionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const existing = await prisma.solution.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      if (existing.authorId !== authReq.user.id) {
        return res.status(403).json({ error: 'You are not authorized to modify this solution' });
      }

      const updated = await prisma.solution.update({
        where: { id },
        data: req.body,
      });

      return res.status(200).json({
        message: 'Solution updated successfully',
        solution: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/solutions/:id - Withdraw own solution (author only)
router.delete(
  '/solutions/:id',
  requireAuth,
  requireRole(Role.UNIVERSITY, Role.INDUSTRY),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const existing = await prisma.solution.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      if (existing.authorId !== authReq.user.id) {
        return res.status(403).json({ error: 'You are not authorized to withdraw this solution' });
      }

      await prisma.solution.delete({
        where: { id },
      });

      return res.status(200).json({
        message: 'Solution proposal withdrawn successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/solutions/:id/review - Government reviews a solution
router.post(
  '/solutions/:id/review',
  requireAuth,
  requireRole(Role.GOVERNMENT),
  validateBody(reviewSolutionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reviewStatus } = req.body;

      const existing = await prisma.solution.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      const updated = await prisma.solution.update({
        where: { id },
        data: { reviewStatus },
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

      return res.status(200).json({
        message: `Solution review status updated to '${reviewStatus}'`,
        solution: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/solutions/:id/support - Citizen upvotes/supports a solution
router.post(
  '/solutions/:id/support',
  requireAuth,
  requireRole(Role.CITIZEN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const solution = await prisma.solution.findUnique({
        where: { id },
      });

      if (!solution) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      // Check if user already supported
      const existingSupport = await prisma.solutionSupport.findUnique({
        where: {
          solutionId_userId: {
            solutionId: id,
            userId: authReq.user.id,
          },
        },
      });

      if (existingSupport) {
        // Toggle: remove support
        await prisma.solutionSupport.delete({
          where: { id: existingSupport.id },
        });

        const totalSupports = await prisma.solutionSupport.count({
          where: { solutionId: id },
        });

        return res.status(200).json({
          message: 'Support removed',
          supported: false,
          totalSupports,
        });
      }

      // Add support
      await prisma.solutionSupport.create({
        data: {
          solutionId: id,
          userId: authReq.user.id,
        },
      });

      const totalSupports = await prisma.solutionSupport.count({
        where: { solutionId: id },
      });

      return res.status(201).json({
        message: 'Solution supported successfully',
        supported: true,
        totalSupports,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'You have already supported this solution' });
      }
      next(error);
    }
  }
);

export default router;
