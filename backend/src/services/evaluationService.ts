import { Evaluation } from '@prisma/client';
import { BusinessValue, Feasibility, Risk, StrategicRelevance } from '../domain/enums';
import { IEvaluationRepository, evaluationRepository } from '../repositories/evaluationRepository';

export interface EvaluationInput {
  businessValue: BusinessValue;
  feasibility: Feasibility;
  risk: Risk;
  strategicRelevance: StrategicRelevance;
  note?: string;
}

export class EvaluationService {
  constructor(private readonly evaluations: IEvaluationRepository = evaluationRepository) {}

  add(useCaseId: string, evaluatorId: string, input: EvaluationInput): Promise<Evaluation> {
    return this.evaluations.create({ useCaseId, evaluatorId, ...input });
  }

  list(useCaseId: string): Promise<Evaluation[]> {
    return this.evaluations.findByUseCase(useCaseId);
  }
}

export const evaluationService = new EvaluationService();
