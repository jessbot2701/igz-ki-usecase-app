import { UseCaseStatus } from '../domain/enums';
import { IUseCaseRepository, useCaseRepository } from '../repositories/useCaseRepository';
import {
  IStatusHistoryRepository,
  statusHistoryRepository,
  StatusTransitionRecord
} from '../repositories/statusHistoryRepository';
import { ICommentRepository, commentRepository } from '../repositories/commentRepository';
import { IEvaluationRepository, evaluationRepository } from '../repositories/evaluationRepository';

export interface DashboardStats {
  total: number;
  byStatus: Record<UseCaseStatus, number>;
}

export interface PortfolioStats {
  byDepartment: Record<string, number>;
  byEffort: Record<string, number>;
  byRisk: Record<string, number>;
  byStrategicRelevance: Record<string, number>;
  byAiSolutionType: Record<string, number>;
  totalEstimatedUsers: number;
  openDecisions: number;
  avgDecisionDays: number | null;
}

export interface ActivityFeedEntry {
  type: 'STATUS_CHANGE' | 'COMMENT';
  useCaseId: string;
  useCaseTitle: string;
  actorName: string;
  timestamp: Date;
  detail: string;
}

const OPEN_DECISION_STATUSES: string[] = [
  UseCaseStatus.IN_REVIEW,
  UseCaseStatus.NEED_MORE_INFO,
  UseCaseStatus.ON_HOLD
];
const DECISION_STATUSES = new Set([UseCaseStatus.APPROVED, UseCaseStatus.REJECTED]);

function tally(values: Array<string | null | undefined>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) {
    if (!value) continue;
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

// Pure & unit-testable: mean number of days between a use case's first SUBMITTED
// transition and its first terminal decision (APPROVED/REJECTED), across all use cases
// that have reached a decision. Returns null when no decided use case exists yet.
export function computeAvgDecisionDays(transitions: StatusTransitionRecord[]): number | null {
  const submittedAt = new Map<string, Date>();
  const decidedAt = new Map<string, Date>();

  for (const t of transitions) {
    if (t.toStatus === UseCaseStatus.SUBMITTED && !submittedAt.has(t.useCaseId)) {
      submittedAt.set(t.useCaseId, t.changedAt);
    }
    if (DECISION_STATUSES.has(t.toStatus as never) && !decidedAt.has(t.useCaseId)) {
      decidedAt.set(t.useCaseId, t.changedAt);
    }
  }

  const durationsInDays: number[] = [];
  for (const [useCaseId, submitted] of submittedAt) {
    const decided = decidedAt.get(useCaseId);
    if (decided) {
      durationsInDays.push((decided.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  if (durationsInDays.length === 0) return null;
  return durationsInDays.reduce((sum, d) => sum + d, 0) / durationsInDays.length;
}

export class DashboardService {
  constructor(
    private readonly useCases: IUseCaseRepository = useCaseRepository,
    private readonly history: IStatusHistoryRepository = statusHistoryRepository,
    private readonly comments: ICommentRepository = commentRepository,
    private readonly evaluations: IEvaluationRepository = evaluationRepository
  ) {}

  async stats(): Promise<DashboardStats> {
    const counts = await this.useCases.countByStatus();
    const byStatus = Object.fromEntries(
      Object.values(UseCaseStatus).map((status) => [status, counts[status] ?? 0])
    ) as Record<UseCaseStatus, number>;
    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    return { total, byStatus };
  }

  async portfolioStats(): Promise<PortfolioStats> {
    const [fields, riskAndRelevance, transitions] = await Promise.all([
      this.useCases.findPortfolioFields(),
      this.evaluations.findAllRiskAndRelevance(),
      this.history.findAllOrdered()
    ]);

    return {
      byDepartment: tally(fields.map((f) => f.department)),
      byEffort: tally(fields.map((f) => f.implementationEffort)),
      byRisk: tally(riskAndRelevance.map((r) => r.risk)),
      byStrategicRelevance: tally(riskAndRelevance.map((r) => r.strategicRelevance)),
      byAiSolutionType: tally(fields.map((f) => f.aiSolutionType)),
      totalEstimatedUsers: fields.reduce((sum, f) => sum + (f.estimatedUsers ?? 0), 0),
      openDecisions: fields.filter((f) => OPEN_DECISION_STATUSES.includes(f.status)).length,
      avgDecisionDays: computeAvgDecisionDays(transitions)
    };
  }

  async recentActivity(limit = 25): Promise<ActivityFeedEntry[]> {
    const [statusChanges, comments] = await Promise.all([
      this.history.findRecent(limit),
      this.comments.findRecent(limit)
    ]);

    const historyEntries: ActivityFeedEntry[] = statusChanges.map((entry) => ({
      type: 'STATUS_CHANGE',
      useCaseId: entry.useCase.id,
      useCaseTitle: entry.useCase.title,
      actorName: entry.changedBy.name,
      timestamp: entry.changedAt,
      detail: `${entry.fromStatus ?? '—'} → ${entry.toStatus}`
    }));

    const commentEntries: ActivityFeedEntry[] = comments.map((entry) => ({
      type: 'COMMENT',
      useCaseId: entry.useCase.id,
      useCaseTitle: entry.useCase.title,
      actorName: entry.author.name,
      timestamp: entry.createdAt,
      detail: entry.text
    }));

    return [...historyEntries, ...commentEntries]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const dashboardService = new DashboardService();
