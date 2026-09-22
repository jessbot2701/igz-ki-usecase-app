import { AIUseCaseInput, ClassificationResult, IAIService } from './IAIService';

// Real integration seam for Azure OpenAI; activated by setting AI_PROVIDER=azure-openai plus
// AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY / AZURE_OPENAI_DEPLOYMENT in the environment.
export class AzureOpenAIService implements IAIService {
  constructor(
    private readonly endpoint = process.env.AZURE_OPENAI_ENDPOINT,
    private readonly apiKey = process.env.AZURE_OPENAI_API_KEY,
    private readonly deployment = process.env.AZURE_OPENAI_DEPLOYMENT
  ) {}

  private ensureConfigured(): void {
    if (!this.endpoint || !this.apiKey || !this.deployment) {
      throw new Error(
        'AzureOpenAIService ist nicht konfiguriert: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY und ' +
          'AZURE_OPENAI_DEPLOYMENT müssen gesetzt sein.'
      );
    }
  }

  async summarizeUseCase(_useCase: AIUseCaseInput): Promise<string> {
    this.ensureConfigured();
    throw new Error('Azure OpenAI Aufruf ist noch nicht implementiert.');
  }

  async classifyUseCase(_useCase: AIUseCaseInput): Promise<ClassificationResult> {
    this.ensureConfigured();
    throw new Error('Azure OpenAI Aufruf ist noch nicht implementiert.');
  }

  async generateManagementSummary(_useCase: AIUseCaseInput): Promise<string> {
    this.ensureConfigured();
    throw new Error('Azure OpenAI Aufruf ist noch nicht implementiert.');
  }
}
