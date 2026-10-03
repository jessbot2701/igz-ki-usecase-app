import { Prisma, UseCase } from '@prisma/client';
import { UseCaseStatus } from '../domain/enums';
import { prisma } from '../config/prisma';

export interface UseCaseSearchParams {
  search?: string;
  status?: UseCaseStatus;
  department?: string;
  requestor?: string;
  createdById?: string;
  unansweredOnly?: boolean;
  page: number;
  pageSize: number;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'status' | 'department';
  sortDir: 'asc' | 'desc';
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UseCaseCreateInput = Omit<
  Prisma.UseCaseUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'status'
> & { status?: UseCaseStatus };

export type UseCaseUpdateInput = Partial<
  Omit<Prisma.UseCaseUncheckedUpdateInput, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface PortfolioField {
  id: string;
  title: string;
  department: string;
  responsible: string | null;
  targetDate: string | null;
  status: string;
  _count: { evaluations: number };
  clarificationAnsweredAt: Date | null;
}

export interface PortfolioOverviewField {
  id: string;
  title: string;
  department: string;
  benefits: string | null;
  estimatedEffect: string | null;
  implementationEffort: string | null;
  responsible: string | null;
  targetDate: string | null;
  status: string;
  updatedAt: Date;
  evaluationRisk: string | null;
  clarificationAnsweredAt: Date | null;
}

const championInclude = {
  assignedChampion: { select: { id: true, name: true, department: true, active: true, role: true } }
} satisfies Prisma.UseCaseInclude;
export type UseCaseWithChampion = Prisma.UseCaseGetPayload<{ include: typeof championInclude }>;

// Abstraction over UseCase persistence, kept Prisma-specific here only
export interface IUseCaseRepository {
  findById(id: string): Promise<UseCaseWithChampion | null>;
  search(params: UseCaseSearchParams): Promise<PagedResult<UseCaseWithChampion>>;
  create(input: UseCaseCreateInput): Promise<UseCase>;
  update(id: string, input: UseCaseUpdateInput): Promise<UseCase>;
  countByStatus(createdById?: string): Promise<Record<string, number>>;
  findPortfolioFields(): Promise<PortfolioField[]>;
  findPortfolioOverview(): Promise<PortfolioOverviewField[]>;
}

export class PrismaUseCaseRepository implements IUseCaseRepository {
  findById(id: string): Promise<UseCaseWithChampion | null> {
    return prisma.useCase.findUnique({ where: { id }, include: championInclude });
  }

  async search(params: UseCaseSearchParams): Promise<PagedResult<UseCaseWithChampion>> {
    const where: Prisma.UseCaseWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.unansweredOnly
        ? { AND: [{ status: UseCaseStatus.NEED_MORE_INFO, clarificationAnsweredAt: null }] }
        : {}),
      ...(params.department ? { department: { contains: params.department } } : {}),
      ...(params.requestor ? { requestor: { contains: params.requestor } } : {}),
      ...(params.createdById ? { createdById: params.createdById } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search } },
              { requestor: { contains: params.search } },
              { department: { contains: params.search } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.useCase.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortDir },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: championInclude
      }),
      prisma.useCase.count({ where })
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  create(input: UseCaseCreateInput): Promise<UseCase> {
    return prisma.useCase.create({ data: input });
  }

  update(id: string, input: UseCaseUpdateInput): Promise<UseCase> {
    return prisma.useCase.update({ where: { id }, data: input });
  }

  async countByStatus(createdById?: string): Promise<Record<string, number>> {
    const grouped = await prisma.useCase.groupBy({
      by: ['status'],
      where: { createdById },
      _count: { status: true }
    });
    return Object.fromEntries(grouped.map((g) => [g.status, g._count.status]));
  }

  findPortfolioFields(): Promise<PortfolioField[]> {
    return prisma.useCase.findMany({
      where: { status: { not: UseCaseStatus.ARCHIVED } },
      select: {
        id: true,
        title: true,
        department: true,
        responsible: true,
        targetDate: true,
        status: true,
        _count: { select: { evaluations: true } },
        clarificationAnsweredAt: true
      }
    });
  }

  async findPortfolioOverview(): Promise<PortfolioOverviewField[]> {
    const useCases = await prisma.useCase.findMany({
      where: { status: { not: UseCaseStatus.ARCHIVED } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        department: true,
        benefits: true,
        estimatedEffect: true,
        implementationEffort: true,
        responsible: true,
        targetDate: true,
        status: true,
        updatedAt: true,
        clarificationAnsweredAt: true,
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { risk: true }
        }
      }
    });

    return useCases.map(({ evaluations, ...useCase }) => ({
      ...useCase,
      evaluationRisk: evaluations[0]?.risk ?? null
    }));
  }
}

export const useCaseRepository: IUseCaseRepository = new PrismaUseCaseRepository();
