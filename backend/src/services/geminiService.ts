import { GoogleGenAI } from '@google/genai';
import { Category } from '@prisma/client';
import { ENV } from '../config/env';

export class AiServiceError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 502, details?: any) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Current available model
export const GEMINI_MODEL = 'gemini-3.8-flash';

function getGenAIClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    throw new AiServiceError('AI analysis is unavailable: GEMINI_API_KEY is not configured', 503);
  }
  return new GoogleGenAI({ apiKey });
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 0,
  delayMs = 1500,
  timeoutMs = 20000
): Promise<T> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Google Gemini API request timed out (service is currently experiencing high demand)')),
          timeoutMs
        );
      });
      const result = await Promise.race([fn(), timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('timed out');

      if (isTransient && attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function formatAiErrorMessage(err: any): string {
  const raw = err?.message || String(err || '');
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return `AI analysis is unavailable: ${parsed.error.message}`;
      }
    }
  } catch {
    // ignore json parse error
  }
  return `AI analysis is unavailable: ${raw}`;
}

export const geminiService = {
  isConfigured(): boolean {
    return Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0);
  },

  /**
   * Classify a problem title and description into an existing system Category.
   * Note: The AI only provides a recommendation; it never persists or updates the problem.
   */
  async classifyProblem(
    title: string,
    description: string
  ): Promise<{ category: Category; reasoning: string; confidence: number }> {
    const ai = getGenAIClient();

    const prompt = `You are a civic issue classification expert for the CivicSolve platform.
Classify the following civic issue report into EXACTLY ONE of the allowed system categories.

Allowed Categories:
- INFRASTRUCTURE (Roads, bridges, water supply pipelines, public works, street transit, structures)
- ENVIRONMENT (Pollution, air/water quality, green cover, parks, lake conservation, environmental ecology)
- EDUCATION (Public schools, academic resources, community libraries, educational infrastructure)
- HEALTHCARE (Public hospitals, clinics, sanitation disease outbreaks, public medical services)
- SANITATION (Solid waste management, garbage accumulation, sewage overflows, street cleanliness, drainage clearing)
- PUBLIC_SAFETY (Streetlights, hazardous intersections, pedestrian crossings, emergency safety hazards)
- OTHER (Any other valid civic or community issue not covered above)

Problem Details:
Title: ${title}
Description: ${description}

Return strictly a valid JSON object with the following schema:
{
  "category": "INFRASTRUCTURE" | "ENVIRONMENT" | "EDUCATION" | "HEALTHCARE" | "SANITATION" | "PUBLIC_SAFETY" | "OTHER",
  "reasoning": "A concise 1-2 sentence explanation of why this category fits best",
  "confidence": 0.95
}`;

    try {
      const response = await callWithRetry(async () => {
        return await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
      });

      const text = response.text?.trim();
      if (!text) {
        throw new AiServiceError('AI analysis is unavailable: received empty response from Gemini', 502);
      }

      const parsed = JSON.parse(text);
      const categoryUpper = String(parsed.category || '').toUpperCase().trim();

      const validCategories = Object.values(Category);
      const matchedCategory = validCategories.find((c) => c === categoryUpper) || Category.OTHER;

      return {
        category: matchedCategory,
        reasoning: parsed.reasoning || `Classified as ${matchedCategory} based on the problem summary.`,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.9,
      };
    } catch (err: any) {
      if (err instanceof AiServiceError) throw err;
      throw new AiServiceError(formatAiErrorMessage(err), 502, err.details || err);
    }
  },

  /**
   * Generate a comprehensive multi-stakeholder breakdown for an existing problem.
   */
  async generateBreakdown(problem: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    priority: string;
  }): Promise<{ analysis: any; model: string }> {
    const ai = getGenAIClient();

    const prompt = `You are an expert urban planning and civic policy analyst for CivicSolve, a collaborative civic problem-solving platform connecting Citizens, Universities, Industries, and Government.

Analyze this real civic problem:
Title: ${problem.title}
Category: ${problem.category}
Location: ${problem.location}
Priority: ${problem.priority}
Description: ${problem.description}

Produce a structured JSON breakdown with the following exact keys:
- summary: string (concise 2-sentence executive summary)
- possibleCauses: string[] (3-5 root causes)
- solutionApproaches: object with:
    - universityResearch: string (suggested academic/research methodology, modeling, or prototype)
    - industryRecommendation: string (suggested engineering, contractor specs, or commercial implementation approach)
    - governmentAction: string (regulatory, municipal intervention, budget, or oversight action)
- relevantStakeholders: object with:
    - citizens: string (community role, reporting, and monitoring)
    - universities: string (academic and research role)
    - industries: string (contractor, vendor, and technical engineering role)
    - government: string (authority, approval, and funding role)
- nextSteps: string[] (3-5 immediate actionable steps)

Output strictly valid JSON.`;

    try {
      const response = await callWithRetry(async () => {
        return await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
      });

      const text = response.text?.trim();
      if (!text) {
        throw new AiServiceError('AI analysis is unavailable: received empty response from Gemini', 502);
      }

      const parsed = JSON.parse(text);
      return {
        analysis: parsed,
        model: GEMINI_MODEL,
      };
    } catch (err: any) {
      if (err instanceof AiServiceError) throw err;
      throw new AiServiceError(formatAiErrorMessage(err), 502, err.details || err);
    }
  },
};
