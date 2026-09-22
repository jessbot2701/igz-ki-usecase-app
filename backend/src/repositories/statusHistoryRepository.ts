import { Prisma, StatusHistory } from '@prisma/client';
import { UseCaseStatus } from '../domain/enums';
import { prisma } from '../config/prisma';

const recentInclude = {
  changedBy: { select: { id: true, name: true, role: true } },
  useCase: { select: { id: true, title: true } }
} satisfies Prisma.StatusHistoryInclude;

export type StatusHistoryWithRelations = Prisma.StatusHistoryGetPayload<{ include: typeof recentInclude }>;

export interface CreateStatusHistoryInput {
  useCaseId: string;
  fromStatus: UseCaseStatus | null;
  toStatus: UseCaseStatus;
  changedById: string;
  note?: string;
}

export interface StatusTransitionRecord {
  useCaseId: string;
  toStatus: string;
  changedAt: Date;
}

export interface IStatusHistoryRepository {
  create(input: CreateStatusHistoryInput): Promise<StatusHistory>;
  findByUseCase(useCaseId: string): Promise<StatusHistoryWithRelations[]>;
  findRecent(limit: number): Promise<StatusHistoryWithRelations[]>;
  findAllOrdered(): Promise<StatusTransitionRecord[]>;
}

export class PrismaStatusHistoryRepository implements IStatusHistoryRepository {
  create(input: CreateStatusHistoryInput): Promise<StatusHistory> {
    return prisma.statusHistory.create({ data: input });
  }

  findByUseCase(useCaseId: string): Promise<StatusHistoryWithRelations[]> {
    return prisma.statusHistory.findMany({
      where: { useCaseId },
      orderBy: { changedAt: 'desc' },
      include: recentInclude
    });
  }

  findRecent(limit: number): Promise<StatusHistoryWithRelations[]> {
    return prisma.statusHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: limit,
      include: recentInclude
    });
  }

  // Minimal projection, ordered chronologically, for computing decision turnaround in JS
  findAllOrdered(): Promise<StatusTransitionRecord[]> {
    return prisma.statusHistory.findMany({
      orderBy: { changedAt: 'asc' },
      select: { useCaseId: true, toStatus: true, changedAt: true }
    });
  }
}

export const statusHistoryRepository: IStatusHistoryRepository = new PrismaStatusHistoryRepository();
