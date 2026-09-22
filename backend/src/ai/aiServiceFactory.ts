import { env } from '../config/env';
import { AzureOpenAIService } from './AzureOpenAIService';
import { IAIService } from './IAIService';
import { MockAIService } from './MockAIService';

// Single place that decides which AI backend implementation is active
export function createAIService(): IAIService {
  switch (env.aiProvider) {
    case 'azure-openai':
      return new AzureOpenAIService();
    case 'mock':
    default:
      return new MockAIService();
  }
}

export const aiService = createAIService();
