import { prisma } from '../src/config/db';

export async function clearTestDatabase() {
  // Truncate all tables in dependency order
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "AiAnalysis", "ProgressUpdate", "SolutionSupport", "Solution", "Problem", "Session", "User" CASCADE;
  `);
}
