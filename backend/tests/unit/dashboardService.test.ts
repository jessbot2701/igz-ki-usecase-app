import { describe, expect, it } from 'vitest';
import { computeAvgDecisionDays } from '../../src/services/dashboardService';
import { UseCaseStatus } from '../../src/domain/enums';

function at(daysFromEpoch: number): Date {
  return new Date(daysFromEpoch * 24 * 60 * 60 * 1000);
}

describe('computeAvgDecisionDays', () => {
  it('returns null when no use case has reached a decision', () => {
    const result = computeAvgDecisionDays([
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.DRAFT, changedAt: at(0) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(1) }
    ]);
    expect(result).toBeNull();
  });

  it('computes the day difference between first SUBMITTED and first decision', () => {
    const result = computeAvgDecisionDays([
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.IN_REVIEW, changedAt: at(1) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.APPROVED, changedAt: at(5) }
    ]);
    expect(result).toBe(5);
  });

  it('averages across multiple decided use cases', () => {
    const result = computeAvgDecisionDays([
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.APPROVED, changedAt: at(4) },
      { useCaseId: 'uc-2', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-2', toStatus: UseCaseStatus.REJECTED, changedAt: at(10) }
    ]);
    expect(result).toBe(7);
  });

  it('ignores use cases that are submitted but not yet decided', () => {
    const result = computeAvgDecisionDays([
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.APPROVED, changedAt: at(2) },
      { useCaseId: 'uc-2', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-2', toStatus: UseCaseStatus.IN_REVIEW, changedAt: at(1) }
    ]);
    expect(result).toBe(2);
  });

  it('uses only the first SUBMITTED and first decision when re-submitted after NEED_MORE_INFO', () => {
    const result = computeAvgDecisionDays([
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(0) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.IN_REVIEW, changedAt: at(1) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.NEED_MORE_INFO, changedAt: at(2) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.SUBMITTED, changedAt: at(3) },
      { useCaseId: 'uc-1', toStatus: UseCaseStatus.APPROVED, changedAt: at(6) }
    ]);
    expect(result).toBe(6);
  });
});
