import { UseCaseStatus } from '../domain/enums';
import {
  IUseCaseRepository,
  PortfolioOverviewField,
  useCaseRepository
} from '../repositories/useCaseRepository';
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
  byRisk: Record<string, number>;
  byStrategicRelevance: Record<string, number>;
  openDecisions: number;
  needMoreInfo: number;
  missingEvaluations: number;
  overdueTargetDates: number;
  attentionItems: DecisionAttentionItem[];
  topUseCases: TopUseCaseSummary[];
  decisionDuration: DecisionDurationSummary;
  departmentOverview: DepartmentSummary[];
}

export interface TopUseCaseSummary {
  id: string;
  title: string;
  department: string;
  expectedBenefit: string | null;
  effort: string | null;
  risk: string | null;
  status: UseCaseStatus;
  nextAction: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number;
  updatedAt: Date;
}

export interface DecisionDurationPoint {
  month: string;
  averageDays: number;
  decidedCount: number;
}

export interface DecisionDurationSummary {
  averageDays: number | null;
  decidedCount: number;
  targetDays: number;
  trend: DecisionDurationPoint[];
}

export interface DepartmentSummary {
  department: string;
  total: number;
  openWorkload: number;
  overdueTargetDates: number;
  missingResponsible: number;
}

export interface DecisionAttentionItem {
  id: string;
  title: string;
  department: string;
  responsible: string | null;
  targetDate: string | null;
  status: UseCaseStatus;
  reasons: Array<'NEED_MORE_INFO' | 'OVERDUE_TARGET_DATE' | 'MISSING_EVALUATION'>;
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

function isOverdueTargetDate(targetDate: string | null, now: Date): boolean {
  if (!targetDate) return false;
  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return false;
  return date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

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

export function computeDecisionDurationTrend(
  transitions: StatusTransitionRecord[]
): DecisionDurationSummary {
  const submittedAt = new Map<string, Date>();
  const decisions: Array<{ decidedAt: Date; durationDays: number }> = [];

  for (const transition of transitions) {
    if (transition.toStatus === UseCaseStatus.SUBMITTED && !submittedAt.has(transition.useCaseId)) {
      submittedAt.set(transition.useCaseId, transition.changedAt);
      continue;
    }

    if (DECISION_STATUSES.has(transition.toStatus as never) && submittedAt.has(transition.useCaseId)) {
      const submitted = submittedAt.get(transition.useCaseId)!;
      decisions.push({
        decidedAt: transition.changedAt,
        durationDays: (transition.changedAt.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
      });
      submittedAt.delete(transition.useCaseId);
    }
  }

  const grouped = new Map<string, number[]>();
  for (const decision of decisions) {
    const month = decision.decidedAt.toISOString().slice(0, 7);
    const durations = grouped.get(month) ?? [];
    durations.push(decision.durationDays);
    grouped.set(month, durations);
  }

  const trend = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, durations]) => ({
      month,
      averageDays: durations.reduce((sum, days) => sum + days, 0) / durations.length,
      decidedCount: durations.length
    }));

  return {
    averageDays: decisions.length
      ? decisions.reduce((sum, decision) => sum + decision.durationDays, 0) / decisions.length
      : null,
    decidedCount: decisions.length,
    targetDays: 10,
    trend
  };
}

const NEXT_ACTIONS: Record<UseCaseStatus, string> = {
  [UseCaseStatus.DRAFT]: 'Einreichen',
  [UseCaseStatus.SUBMITTED]: 'Bewertung starten',
  [UseCaseStatus.IN_REVIEW]: 'Entscheidung treffen',
  [UseCaseStatus.NEED_MORE_INFO]: 'Rückfrage beantworten',
  [UseCaseStatus.ON_HOLD]: 'Priorisierung klären',
  [UseCaseStatus.APPROVED]: 'Pilot vorbereiten',
  [UseCaseStatus.PILOT]: 'Umsetzung prüfen',
  [UseCaseStatus.IMPLEMENTED]: 'Erfolg messen',
  [UseCaseStatus.ARCHIVED]: 'Abgeschlossen',
  [UseCaseStatus.REJECTED]: 'Archivieren'
};

const TOP_PRIORITY: Record<UseCaseStatus, number> = {
  [UseCaseStatus.DRAFT]: 1,
  [UseCaseStatus.SUBMITTED]: 4,
  [UseCaseStatus.IN_REVIEW]: 6,
  [UseCaseStatus.NEED_MORE_INFO]: 7,
  [UseCaseStatus.ON_HOLD]: 5,
  [UseCaseStatus.APPROVED]: 4,
  [UseCaseStatus.PILOT]: 3,
  [UseCaseStatus.IMPLEMENTED]: 1,
  [UseCaseStatus.ARCHIVED]: 0,
  [UseCaseStatus.REJECTED]: 1
};

function toTopUseCaseSummary(field: PortfolioOverviewField): TopUseCaseSummary {
  const status = field.status as UseCaseStatus;
  const valueScore = { HOCH: 3, MITTEL: 2, NIEDRIG: 1 }[field.estimatedEffect ?? ''] ?? 0;
  const riskScore = { NIEDRIG: 3, MITTEL: 2, HOCH: 1 }[field.evaluationRisk ?? ''] ?? 0;
  const effortScore = { NIEDRIG: 3, MITTEL: 2, HOCH: 1 }[field.implementationEffort ?? ''] ?? 0;
  const priorityScore = TOP_PRIORITY[status] * 2 + valueScore + riskScore + effortScore;
  return {
    id: field.id,
    title: field.title,
    department: field.department,
    expectedBenefit: field.benefits || field.estimatedEffect,
    effort: field.implementationEffort,
    risk: field.evaluationRisk,
    status,
    nextAction: NEXT_ACTIONS[status],
    priority: priorityScore >= 16 ? 'HIGH' : priorityScore >= 11 ? 'MEDIUM' : 'LOW',
    priorityScore,
    updatedAt: field.updatedAt
  };
}

function buildDepartmentOverview(fields: PortfolioOverviewField[], now: Date): DepartmentSummary[] {
  const departments = new Map<string, DepartmentSummary>();
  for (const field of fields) {
    const summary = departments.get(field.department) ?? {
      department: field.department,
      total: 0,
      openWorkload: 0,
      overdueTargetDates: 0,
      missingResponsible: 0
    };
    summary.total += 1;
    if (field.status !== UseCaseStatus.IMPLEMENTED && field.status !== UseCaseStatus.REJECTED) {
      summary.openWorkload += 1;
    }
    if (isOverdueTargetDate(field.targetDate, now)) summary.overdueTargetDates += 1;
    if (!field.responsible) summary.missingResponsible += 1;
    departments.set(field.department, summary);
  }
  return [...departments.values()].sort(
    (left, right) => right.openWorkload - left.openWorkload || right.total - left.total
  );
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

  async portfolioStats(now = new Date()): Promise<PortfolioStats> {
    const [fields, riskAndRelevance, overviewFields, transitions] = await Promise.all([
      this.useCases.findPortfolioFields(),
      this.evaluations.findAllRiskAndRelevance(),
      this.useCases.findPortfolioOverview(),
      this.history.findAllOrdered()
    ]);

    const attentionItems = fields
      .map((field): DecisionAttentionItem | null => {
        const reasons: DecisionAttentionItem['reasons'] = [];
        if (field.status === UseCaseStatus.NEED_MORE_INFO) reasons.push('NEED_MORE_INFO');
        if (isOverdueTargetDate(field.targetDate, now)) reasons.push('OVERDUE_TARGET_DATE');
        if (field._count.evaluations === 0 && OPEN_DECISION_STATUSES.includes(field.status)) {
          reasons.push('MISSING_EVALUATION');
        }

        if (reasons.length === 0) return null;
        return {
          id: field.id,
          title: field.title,
          department: field.department,
          responsible: field.responsible,
          targetDate: field.targetDate,
          status: field.status as UseCaseStatus,
          reasons
        };
      })
      .filter((item): item is DecisionAttentionItem => item !== null)
      .sort((left, right) => right.reasons.length - left.reasons.length || left.title.localeCompare(right.title, 'de'));

    const topUseCases = overviewFields
      .map(toTopUseCaseSummary)
      .sort((left, right) => right.priorityScore - left.priorityScore || right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, 8);

    return {
      byRisk: tally(riskAndRelevance.map((r) => r.risk)),
      byStrategicRelevance: tally(riskAndRelevance.map((r) => r.strategicRelevance)),
      openDecisions: fields.filter((f) => OPEN_DECISION_STATUSES.includes(f.status)).length,
      needMoreInfo: fields.filter((f) => f.status === UseCaseStatus.NEED_MORE_INFO).length,
      missingEvaluations: fields.filter(
        (f) => f._count.evaluations === 0 && OPEN_DECISION_STATUSES.includes(f.status)
      ).length,
      overdueTargetDates: fields.filter((f) => isOverdueTargetDate(f.targetDate, now)).length,
      attentionItems,
      topUseCases,
      decisionDuration: computeDecisionDurationTrend(transitions),
      departmentOverview: buildDepartmentOverview(overviewFields, now)
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
