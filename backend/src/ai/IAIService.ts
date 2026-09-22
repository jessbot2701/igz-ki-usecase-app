import { UseCase } from '@prisma/client';

export interface ClassificationResult {
  suggestedBusinessValue: 'NIEDRIG' | 'MITTEL' | 'HOCH';
  suggestedFeasibility: 'EINFACH' | 'MITTEL' | 'KOMPLEX';
  suggestedRisk: 'NIEDRIG' | 'MITTEL' | 'HOCH';
  rationale: string;
}

// Only the plain-string fields the AI backends actually read; accepts both the raw
// Prisma UseCase and the API-facing UseCaseDto (whose array fields differ in shape).
export type AIUseCaseInput = Pick<
  UseCase,
  'title' | 'department' | 'problemDescription' | 'solutionIdea' | 'estimatedUsers' | 'benefits' | 'status'
>;

// Extensibility seam: any AI backend (mock, Azure OpenAI, ...) implements this contract.
// Swapping the implementation never requires UI changes.
export interface IAIService {
  summarizeUseCase(useCase: AIUseCaseInput): Promise<string>;
  classifyUseCase(useCase: AIUseCaseInput): Promise<ClassificationResult>;
  generateManagementSummary(useCase: AIUseCaseInput): Promise<string>;
}
