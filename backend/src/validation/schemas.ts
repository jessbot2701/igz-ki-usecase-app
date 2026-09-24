import { z } from 'zod';
import {
  AiSolutionType,
  BusinessValue,
  DataClassification,
  Feasibility,
  Level,
  Reach,
  BenefitType,
  Risk,
  Role,
  StrategicRelevance,
  UseCaseStatus
} from '../domain/enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  department: z.string().optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  department: z.string().optional(),
  active: z.boolean().optional()
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(120)
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  active: z.boolean().optional()
});

export const useCaseInputSchema = z.object({
  title: z.string().min(3).max(200),
  requestor: z.string().min(2),
  department: z.string().min(2),
  aiChampion: z.string().optional(),
  problemDescription: z.string().min(10),
  currentProcess: z.string().optional(),
  painPoints: z.string().optional(),
  frequency: z.string().optional(),
  solutionIdea: z.string().min(10),
  dataSources: z.string().optional(),
  expectedOutput: z.string().optional(),
  targetGroup: z.string().optional(),
  reach: z.nativeEnum(Reach).optional(),
  estimatedUsers: z.number().int().nonnegative().optional(),
  usageFrequency: z.string().optional(),
  benefits: z.string().optional(),
  benefitTypes: z.array(z.nativeEnum(BenefitType)).optional(),
  estimatedEffect: z.nativeEnum(Level).optional(),
  estimatedTimeSavings: z.string().optional(),
  businessValueNote: z.string().optional(),
  aiSolutionType: z.nativeEnum(AiSolutionType).optional(),
  aiSolutionOtherText: z.string().optional(),
  implementationEffort: z.nativeEnum(Level).optional(),
  dependencies: z.string().optional(),
  dataClassifications: z.array(z.nativeEnum(DataClassification)).optional(),
  riskAssessment: z.string().optional(),
  securityNotes: z.string().optional(),
  responsible: z.string().optional(),
  targetDate: z.string().optional()
});

export const useCaseUpdateSchema = useCaseInputSchema.partial();

export const statusTransitionSchema = z.object({
  toStatus: z.nativeEnum(UseCaseStatus),
  note: z.string().optional()
});

export const commentSchema = z.object({
  text: z.string().min(1).max(4000)
});

export const evaluationSchema = z.object({
  businessValue: z.nativeEnum(BusinessValue),
  feasibility: z.nativeEnum(Feasibility),
  risk: z.nativeEnum(Risk),
  strategicRelevance: z.nativeEnum(StrategicRelevance),
  note: z.string().optional()
});

export const useCaseSearchSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(UseCaseStatus).optional(),
  department: z.string().optional(),
  requestor: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'status', 'department']).default('updatedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
});
