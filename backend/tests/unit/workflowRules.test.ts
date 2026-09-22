import { describe, expect, it } from 'vitest';
import { Role, UseCaseStatus } from '../../src/domain/enums';
import { allowedNextStatuses, canEditFields, findRule } from '../../src/domain/workflowRules';

describe('workflowRules', () => {
  it('allows the owner to submit a draft', () => {
    const rule = findRule(UseCaseStatus.DRAFT, UseCaseStatus.SUBMITTED);
    expect(rule?.allowed).toContain('OWNER');
  });

  it('only AI_CHAMPION can move SUBMITTED to IN_REVIEW', () => {
    const rule = findRule(UseCaseStatus.SUBMITTED, UseCaseStatus.IN_REVIEW);
    expect(rule?.allowed).toEqual([Role.AI_CHAMPION]);
  });

  it('only AI_CORE_TEAM can approve or reject from IN_REVIEW', () => {
    expect(findRule(UseCaseStatus.IN_REVIEW, UseCaseStatus.APPROVED)?.allowed).toEqual([Role.AI_CORE_TEAM]);
    expect(findRule(UseCaseStatus.IN_REVIEW, UseCaseStatus.REJECTED)?.allowed).toEqual([Role.AI_CORE_TEAM]);
  });

  it('rejects an undefined transition, e.g. DRAFT -> IMPLEMENTED', () => {
    expect(findRule(UseCaseStatus.DRAFT, UseCaseStatus.IMPLEMENTED)).toBeUndefined();
  });

  it('lists all allowed next statuses for IN_REVIEW', () => {
    const next = allowedNextStatuses(UseCaseStatus.IN_REVIEW);
    expect(next.sort()).toEqual(
      [
        UseCaseStatus.NEED_MORE_INFO,
        UseCaseStatus.APPROVED,
        UseCaseStatus.REJECTED,
        UseCaseStatus.ON_HOLD,
        UseCaseStatus.ARCHIVED
      ].sort()
    );
  });

  it('allows AI_CORE_TEAM to put an IN_REVIEW use case on hold and reactivate it', () => {
    expect(findRule(UseCaseStatus.IN_REVIEW, UseCaseStatus.ON_HOLD)?.allowed).toEqual([Role.AI_CORE_TEAM]);
    expect(findRule(UseCaseStatus.ON_HOLD, UseCaseStatus.IN_REVIEW)?.allowed).toEqual([Role.AI_CORE_TEAM]);
  });

  it('allows any non-terminal status to be archived by ADMINISTRATOR or AI_CORE_TEAM', () => {
    const rule = findRule(UseCaseStatus.PILOT, UseCaseStatus.ARCHIVED);
    expect(rule?.allowed).toEqual(expect.arrayContaining([Role.ADMINISTRATOR, Role.AI_CORE_TEAM]));
  });

  describe('canEditFields', () => {
    it('allows the owning employee to edit a DRAFT use case', () => {
      expect(canEditFields(Role.EMPLOYEE, true, UseCaseStatus.DRAFT)).toBe(true);
    });

    it('forbids the owning employee from editing a SUBMITTED use case', () => {
      expect(canEditFields(Role.EMPLOYEE, true, UseCaseStatus.SUBMITTED)).toBe(false);
    });

    it('forbids a non-owning employee from editing at all', () => {
      expect(canEditFields(Role.EMPLOYEE, false, UseCaseStatus.DRAFT)).toBe(false);
    });

    it('always allows AI_CHAMPION and AI_CORE_TEAM to edit regardless of ownership', () => {
      expect(canEditFields(Role.AI_CHAMPION, false, UseCaseStatus.IMPLEMENTED)).toBe(true);
      expect(canEditFields(Role.AI_CORE_TEAM, false, UseCaseStatus.ARCHIVED)).toBe(true);
    });
  });
});
