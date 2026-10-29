import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { classifyProblemSchema } from '../validators/schemas';
import { geminiService, AiServiceError } from '../services/geminiService';

const router = Router();

// Dedicated AI rate limiter to prevent abuse and API quota exhaustion
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 AI requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    available: false,
    error: 'AI analysis is unavailable due to rate limits. Please slow down and try again later.',
  },
});

/**
 * POST /api/problems/ai-classify
 * Citizen-facing AI helper to suggest a category while reporting a problem.
 * Strictly suggests; DOES NOT save the problem or alter status.
 */
router.post(
  '/ai-classify',
  requireAuth,
  aiLimiter,
  validateBody(classifyProblemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;

      if (!geminiService.isConfigured()) {
        return res.status(503).json({
          available: false,
          error: 'AI analysis is unavailable (GEMINI_API_KEY is not configured in backend environment)',
        });
      }

      try {
        const result = await geminiService.classifyProblem(title, description);
        return res.status(200).json({
          available: true,
          category: result.category,
          reasoning: result.reasoning,
          confidence: result.confidence,
        });
      } catch (err: any) {
        const statusCode = err instanceof AiServiceError ? err.statusCode : 502;
        return res.status(statusCode).json({
          available: false,
          error: err.message || 'AI analysis is unavailable',
          details: err.details,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/problems/:id/ai-breakdown (and alias /:id/ai-analyze)
 * Generates full AI breakdown with summary, causes, solutions, stakeholders, and next steps.
 * Clearly labeled as AI-generated output.
 */
async function handleAiBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        creator: {
          select: { fullName: true, role: true },
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!geminiService.isConfigured()) {
      return res.status(503).json({
        available: false,
        error: 'AI analysis is unavailable (GEMINI_API_KEY is not configured in backend environment)',
      });
    }

    try {
      const { analysis, model } = await geminiService.generateBreakdown({
        id: problem.id,
        title: problem.title,
        description: problem.description,
        category: problem.category,
        location: problem.location,
        priority: problem.priority,
      });

      // Persist analysis record
      const saved = await prisma.aiAnalysis.create({
        data: {
          problemId: problem.id,
          requestedById: authReq.user.id,
          content: JSON.stringify(analysis),
          model,
        },
      });

      return res.status(200).json({
        available: true,
        isAiGenerated: true,
        model,
        analysis,
        id: saved.id,
        createdAt: saved.createdAt,
      });
    } catch (err: any) {
      const statusCode = err instanceof AiServiceError ? err.statusCode : 502;
      return res.status(statusCode).json({
        available: false,
        error: err.message || 'AI analysis is unavailable',
        details: err.details,
      });
    }
  } catch (error) {
    next(error);
  }
}

router.post('/:id/ai-breakdown', requireAuth, aiLimiter, handleAiBreakdown);
router.post('/:id/ai-analyze', requireAuth, aiLimiter, handleAiBreakdown);

/**
 * GET /api/problems/:id/ai-breakdown
 * Retrieves the latest generated breakdown for a problem, if available.
 */
router.get('/:id/ai-breakdown', requireAuth, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.aiAnalysis.findFirst({
      where: { problemId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        available: false,
        message: 'No previous AI breakdown found for this problem.',
      });
    }

    let parsedContent: any = null;
    try {
      parsedContent = JSON.parse(existing.content);
    } catch {
      parsedContent = existing.content;
    }

    return res.status(200).json({
      available: true,
      isAiGenerated: true,
      id: existing.id,
      model: existing.model,
      createdAt: existing.createdAt,
      analysis: parsedContent,
      requestedBy: existing.requestedBy,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
