import { UseCase } from '@prisma/client';
import { Role, UseCaseStatus } from '../domain/enums';
import { ApiError } from '../utils/ApiError';
import { TRANSITION_RULES, findRule } from '../domain/workflowRules';
import { prisma } from '../config/prisma';
import { queueUseCaseNotification } from './notificationService';

export interface ActingUser {
  id: string;
  role: Role;
}

// Enforces the Use Case status workflow: valid transitions, role checks, and history logging
export class WorkflowService {
  allowedNextStatuses(
    current: UseCaseStatus,
    actingUser: ActingUser,
    ownerId: string
  ): UseCaseStatus[] {
    return TRANSITION_RULES.filter(
      (rule) =>
        rule.from === current &&
        rule.allowed.some((allowed) =>
          allowed === 'OWNER' ? ownerId === actingUser.id : allowed === actingUser.role
        )
    ).map((rule) => rule.to);
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

    return prisma.$transaction(async (tx) => {
      const changedAt = new Date();
      const changed = await tx.useCase.updateMany({
        where: { id: useCase.id, status: useCase.status },
        data: {
          status: toStatus,
          lastModifiedById: actingUser.id,
          ...(toStatus === UseCaseStatus.NEED_MORE_INFO
            ? { clarificationRequestedAt: changedAt, clarificationAnsweredAt: null }
            : {})
        }
      });
      if (!changed.count)
        throw ApiError.conflict(
          'Der Status wurde inzwischen geändert. Bitte laden Sie den Vorgang neu.'
        );
      await tx.statusHistory.create({
        data: {
          useCaseId: useCase.id,
          fromStatus: useCase.status,
          toStatus,
          changedById: actingUser.id,
          changedAt,
          note
        }
      });
      await queueUseCaseNotification(tx, useCase.id, actingUser.id, toStatus);
      return tx.useCase.findUniqueOrThrow({ where: { id: useCase.id } });
    });
  }
}

export const workflowService = new WorkflowService();
