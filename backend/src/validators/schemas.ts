import { z } from 'zod';
import { Role, Category, Priority, ProblemStatus, ReviewStatus } from '@prisma/client';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  email: z.string().trim().email('Please enter a valid email address').max(150, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Role must be one of: CITIZEN, UNIVERSITY, INDUSTRY, GOVERNMENT' }),
  }),
  organization: z.string().trim().max(150, 'Organization name is too long').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role !== Role.CITIZEN) {
    return !!data.organization && data.organization.trim().length >= 2;
  }
  return true;
}, {
  message: 'Organization name is required for University, Industry, and Government accounts (min 2 characters)',
  path: ['organization'],
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createProblemSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000, 'Description cannot exceed 5000 characters'),
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  location: z.string().trim().min(3, 'Location must be at least 3 characters').max(150, 'Location cannot exceed 150 characters'),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: 'Invalid priority' }),
  }),
});

export const updateProblemSchema = createProblemSchema.partial();

export const classifyProblemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(3000, 'Description cannot exceed 3000 characters'),
});

export const createSolutionSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  explanation: z.string().trim().min(20, 'Explanation must be at least 20 characters').max(5000, 'Explanation cannot exceed 5000 characters'),
  expectedBenefits: z.string().trim().min(10, 'Expected benefits must be at least 10 characters').max(2000, 'Benefits cannot exceed 2000 characters'),
  implementationApproach: z.string().trim().min(10, 'Implementation approach must be at least 10 characters').max(2000, 'Approach cannot exceed 2000 characters'),
});

export const updateSolutionSchema = createSolutionSchema.partial();

export const statusTransitionSchema = z.object({
  toStatus: z.nativeEnum(ProblemStatus, {
    errorMap: () => ({ message: 'Invalid target problem status' }),
  }),
  message: z.string().trim().min(2, 'Status transition note/message must be at least 2 characters').max(1000, 'Message cannot exceed 1000 characters'),
});

export const reviewSolutionSchema = z.object({
  reviewStatus: z.nativeEnum(ReviewStatus, {
    errorMap: () => ({ message: 'Invalid review status' }),
  }),
});
