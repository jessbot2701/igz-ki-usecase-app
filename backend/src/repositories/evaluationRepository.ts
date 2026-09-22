import { Evaluation } from '@prisma/client';
import { BusinessValue, Feasibility, Risk, StrategicRelevance } from '../domain/enums';
import { prisma } from '../config/prisma';

export interface CreateEvaluationInput {
  useCaseId: string;
  evaluatorId: string;
  businessValue: BusinessValue;
  feasibility: Feasibility;
  risk: Risk;
  strategicRelevance: StrategicRelevance;
  note?: string;
}

export interface RiskAndRelevance {
  risk: string;
  strategicRelevance: string;
}

export interface IEvaluationRepository {
  create(input: CreateEvaluationInput): Promise<Evaluation>;
  findByUseCase(useCaseId: string): Promise<Evaluation[]>;
  findAllRiskAndRelevance(): Promise<RiskAndRelevance[]>;
}

export class PrismaEvaluationRepository implements IEvaluationRepository {
  create(input: CreateEvaluationInput): Promise<Evaluation> {
    return prisma.evaluation.create({ data: input });
  }

  findByUseCase(useCaseId: string): Promise<Evaluation[]> {
    return prisma.evaluation.findMany({
      where: { useCaseId },
      orderBy: { createdAt: 'desc' },
      include: { evaluator: { select: { id: true, name: true, role: true } } }
    });
  }

  // Aggregates across all evaluations (not de-duplicated per use case) — simplest
  // correct-enough portfolio metric; documented simplification.
  findAllRiskAndRelevance(): Promise<RiskAndRelevance[]> {
    return prisma.evaluation.findMany({ select: { risk: true, strategicRelevance: true } });
  }
}

export const evaluationRepository: IEvaluationRepository = new PrismaEvaluationRepository();
