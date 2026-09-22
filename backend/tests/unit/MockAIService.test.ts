import { describe, expect, it } from 'vitest';
import { MockAIService } from '../../src/ai/MockAIService';
import { AIUseCaseInput } from '../../src/ai/IAIService';

function buildUseCase(overrides: Partial<AIUseCaseInput> = {}): AIUseCaseInput {
  return {
    title: 'Testfall',
    department: 'IT',
    problemDescription: 'Ein Problem, das gelöst werden muss.',
    solutionIdea: 'Eine KI-Lösung dafür.',
    estimatedUsers: 5,
    benefits: null,
    status: 'DRAFT',
    ...overrides
  };
}

describe('MockAIService', () => {
  const service = new MockAIService();

  it('summarizes a use case including title and department', async () => {
    const summary = await service.summarizeUseCase(buildUseCase());
    expect(summary).toContain('Testfall');
    expect(summary).toContain('IT');
  });

  it('classifies high user counts as high business value', async () => {
    const result = await service.classifyUseCase(buildUseCase({ estimatedUsers: 500 }));
    expect(result.suggestedBusinessValue).toBe('HOCH');
  });

  it('classifies low user counts as low business value', async () => {
    const result = await service.classifyUseCase(buildUseCase({ estimatedUsers: 3 }));
    expect(result.suggestedBusinessValue).toBe('NIEDRIG');
  });

  it('flags confidential keywords as high risk', async () => {
    const result = await service.classifyUseCase(
      buildUseCase({ problemDescription: 'Verarbeitung von vertraulichen Daten.' })
    );
    expect(result.suggestedRisk).toBe('HOCH');
  });

  it('generates a management summary mentioning the current status', async () => {
    const summary = await service.generateManagementSummary(buildUseCase({ status: 'PILOT' }));
    expect(summary).toContain('PILOT');
  });
});
