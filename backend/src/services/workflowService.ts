import { UseCase } from '@prisma/client';
import { Role, UseCaseStatus } from '../domain/enums';
import { ApiError } from '../utils/ApiError';
import { allowedNextStatuses, findRule } from '../domain/workflowRules';
import {
  IStatusHistoryRepository,
  statusHistoryRepository
} from '../repositories/statusHistoryRepository';
import { IUseCaseRepository, useCaseRepository } from '../repositories/useCaseRepository';

export interface ActingUser {
  id: string;
  role: Role;
}

// Enforces the Use Case status workflow: valid transitions, role checks, and history logging
export class WorkflowService {
  constructor(
    private readonly useCases: IUseCaseRepository = useCaseRepository,
    private readonly history: IStatusHistoryRepository = statusHistoryRepository
  ) {}

  allowedNextStatuses(current: UseCaseStatus): UseCaseStatus[] {
    return allowedNextStatuses(current);
  }

  async transition(
    useCase: Pick<UseCase, 'id' | 'status' | 'createdById'>,
    toStatus: UseCaseStatus,
    actingUser: ActingUser,
    note?: string
  ): Promise<UseCase> {
    const rule = findRule(useCase.status as UseCaseStatus, toStatus);
    if (!rule) {
      throw ApiError.badRequest(
        `Statuswechsel von ${useCase.status} zu ${toStatus} ist nicht erlaubt`
      );
    }
    const isOwner = useCase.createdById === actingUser.id;
    const permitted = rule.allowed.some((allowed) =>
      allowed === 'OWNER' ? isOwner : allowed === actingUser.role
    );
    if (!permitted) {
      throw ApiError.forbidden('Ihre Rolle erlaubt diesen Statuswechsel nicht');
    }

    const updated = await this.useCases.update(useCase.id, {
      status: toStatus,
      lastModifiedById: actingUser.id
    });
    await this.history.create({
      useCaseId: useCase.id,
      fromStatus: useCase.status as UseCaseStatus,
      toStatus,
      changedById: actingUser.id,
      note
    });
    return updated;
  }
}

export const workflowService = new WorkflowService();
