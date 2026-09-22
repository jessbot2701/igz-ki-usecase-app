import { UseCase } from '@prisma/client';
import { AiSolutionType, BenefitType, DataClassification, Level, Reach, Role, UseCaseStatus } from '../domain/enums';
import { ApiError } from '../utils/ApiError';
import { canEditFields } from '../domain/workflowRules';
import { arrayToCsv, csvToArray } from '../utils/csvArray';
import {
  IUseCaseRepository,
  PagedResult,
  UseCaseSearchParams,
  useCaseRepository
} from '../repositories/useCaseRepository';
import { ActingUser } from './workflowService';

export interface UseCaseInput {
  title: string;
  requestor: string;
  department: string;
  aiChampion?: string;
  problemDescription: string;
  currentProcess?: string;
  painPoints?: string;
  frequency?: string;
  solutionIdea: string;
  dataSources?: string;
  expectedOutput?: string;
  targetGroup?: string;
  reach?: Reach;
  estimatedUsers?: number;
  usageFrequency?: string;
  benefits?: string;
  benefitTypes?: BenefitType[];
  estimatedEffect?: Level;
  estimatedTimeSavings?: string;
  businessValueNote?: string;
  aiSolutionType?: AiSolutionType;
  aiSolutionOtherText?: string;
  implementationEffort?: Level;
  dependencies?: string;
  dataClassifications?: DataClassification[];
  riskAssessment?: string;
  securityNotes?: string;
  responsible?: string;
  targetDate?: string;
}

// API-facing shape: multi-select fields are real arrays (CSV storage is a persistence detail)
export type UseCaseDto = Omit<UseCase, 'benefitTypes' | 'dataClassifications'> & {
  benefitTypes: string[];
  dataClassifications: string[];
};

function toDto(useCase: UseCase): UseCaseDto {
  return {
    ...useCase,
    benefitTypes: csvToArray(useCase.benefitTypes),
    dataClassifications: csvToArray(useCase.dataClassifications)
  };
}

function toRepositoryInput<T extends Partial<UseCaseInput>>(input: T) {
  return {
    ...input,
    benefitTypes: arrayToCsv(input.benefitTypes) ?? null,
    dataClassifications: arrayToCsv(input.dataClassifications) ?? null
  };
}

export class UseCaseService {
  constructor(private readonly useCases: IUseCaseRepository = useCaseRepository) {}

  async getById(id: string): Promise<UseCaseDto> {
    const useCase = await this.useCases.findById(id);
    if (!useCase) {
      throw ApiError.notFound('Use Case nicht gefunden');
    }
    return toDto(useCase);
  }

  async search(params: UseCaseSearchParams): Promise<PagedResult<UseCaseDto>> {
    const result = await this.useCases.search(params);
    return { ...result, items: result.items.map(toDto) };
  }

  async create(input: UseCaseInput, actingUser: ActingUser): Promise<UseCaseDto> {
    const created = await this.useCases.create({
      ...toRepositoryInput(input),
      createdById: actingUser.id,
      lastModifiedById: actingUser.id
    });
    return toDto(created);
  }

  async update(id: string, input: Partial<UseCaseInput>, actingUser: ActingUser): Promise<UseCaseDto> {
    const existing = await this.getById(id);
    const isOwner = existing.createdById === actingUser.id;
    if (!canEditFields(actingUser.role, isOwner, existing.status as UseCaseStatus)) {
      throw ApiError.forbidden('Dieser Use Case kann in seinem aktuellen Status nicht bearbeitet werden');
    }
    const updated = await this.useCases.update(id, {
      ...toRepositoryInput(input),
      lastModifiedById: actingUser.id
    });
    return toDto(updated);
  }

  assertViewable(useCase: Pick<UseCase, 'createdById'>, actingUser: ActingUser): void {
    if (actingUser.role === Role.EMPLOYEE && useCase.createdById !== actingUser.id) {
      throw ApiError.forbidden('Sie können nur eigene Use Cases einsehen');
    }
  }
}

export const useCaseService = new UseCaseService();
