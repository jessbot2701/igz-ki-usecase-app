import { AIUseCaseInput, ClassificationResult, IAIService } from './IAIService';

// Deterministic, offline stand-in for a real LLM backend — used until Azure OpenAI is configured
export class MockAIService implements IAIService {
  async summarizeUseCase(useCase: AIUseCaseInput): Promise<string> {
    return (
      `"${useCase.title}" (${useCase.department}): ${useCase.problemDescription.slice(0, 160)}` +
      `${useCase.problemDescription.length > 160 ? '…' : ''} Lösungsidee: ${useCase.solutionIdea.slice(0, 120)}`
    );
  }

  async classifyUseCase(useCase: AIUseCaseInput): Promise<ClassificationResult> {
    const text = `${useCase.problemDescription} ${useCase.solutionIdea}`.toLowerCase();
    const estimatedUsers = useCase.estimatedUsers ?? 0;

    const suggestedBusinessValue = estimatedUsers > 100 ? 'HOCH' : estimatedUsers > 20 ? 'MITTEL' : 'NIEDRIG';
    const suggestedFeasibility = text.includes('integration') || text.includes('komplex') ? 'KOMPLEX' : 'MITTEL';
    const suggestedRisk =
      text.includes('personenbezogen') || text.includes('vertraulich') ? 'HOCH' : 'NIEDRIG';

    return {
      suggestedBusinessValue,
      suggestedFeasibility,
      suggestedRisk,
      rationale:
        'Automatische Ersteinschätzung (Mock-KI) basierend auf Nutzerzahl und Schlagworten. Bitte fachlich validieren.'
    };
  }

  async generateManagementSummary(useCase: AIUseCaseInput): Promise<string> {
    return (
      `Management Summary: Der Use Case "${useCase.title}" aus dem Bereich ${useCase.department} adressiert ` +
      `folgendes Problem: ${useCase.problemDescription.slice(0, 200)}. Erwarteter Nutzen: ${
        useCase.benefits ?? 'noch zu bewerten'
      }. Aktueller Status: ${useCase.status}.`
    );
  }
}
