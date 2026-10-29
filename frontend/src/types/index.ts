export type Role = 'CITIZEN' | 'UNIVERSITY' | 'INDUSTRY' | 'GOVERNMENT';

export type Category =
  | 'INFRASTRUCTURE'
  | 'ENVIRONMENT'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'SANITATION'
  | 'PUBLIC_SAFETY'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProblemStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type SolutionType = 'PROPOSAL' | 'RECOMMENDATION';

export type ReviewStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  organization?: string | null;
  createdAt: string;
}

export interface ProgressUpdate {
  id: string;
  problemId: string;
  authorId: string;
  author: {
    id: string;
    fullName: string;
    role: Role;
    organization?: string | null;
  };
  fromStatus: ProblemStatus;
  toStatus: ProblemStatus;
  message: string;
  createdAt: string;
}

export interface Solution {
  id: string;
  problemId: string;
  authorId: string;
  author: {
    id: string;
    fullName: string;
    role: Role;
    organization?: string | null;
  };
  authorRole: Role;
  type: SolutionType;
  title: string;
  explanation: string;
  expectedBenefits: string;
  implementationApproach: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  supports?: { userId: string }[];
  _count?: { supports: number };
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  priority: Priority;
  status: ProblemStatus;
  creatorId: string;
  creator: {
    id: string;
    fullName: string;
    role: Role;
    organization?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  solutions?: Solution[];
  updates?: ProgressUpdate[];
  _count?: {
    solutions: number;
    updates: number;
  };
}

export interface DashboardStats {
  summary: {
    totalProblems: number;
    totalSolutions: number;
    totalSupports: number;
    totalUsers: number;
    resolutionRate: number;
  };
  statusBreakdown: Record<ProblemStatus, number>;
  categoryBreakdown: Record<Category, number>;
  roleBreakdown: Record<Role, number>;
}
