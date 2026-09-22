import { Role, UseCaseStatus } from './enums';

export interface TransitionRule {
  from: UseCaseStatus;
  to: UseCaseStatus;
  /** Roles allowed to perform this transition, or 'OWNER' meaning the use case's creator */
  allowed: Array<Role | 'OWNER'>;
}

// Central, explicit definition of the Use Case status workflow (single source of truth)
export const TRANSITION_RULES: TransitionRule[] = [
  { from: UseCaseStatus.DRAFT, to: UseCaseStatus.SUBMITTED, allowed: ['OWNER'] },
  { from: UseCaseStatus.SUBMITTED, to: UseCaseStatus.IN_REVIEW, allowed: [Role.AI_CHAMPION] },
  { from: UseCaseStatus.IN_REVIEW, to: UseCaseStatus.NEED_MORE_INFO, allowed: [Role.AI_CHAMPION] },
  { from: UseCaseStatus.NEED_MORE_INFO, to: UseCaseStatus.SUBMITTED, allowed: ['OWNER'] },
  { from: UseCaseStatus.IN_REVIEW, to: UseCaseStatus.APPROVED, allowed: [Role.AI_CORE_TEAM] },
  { from: UseCaseStatus.IN_REVIEW, to: UseCaseStatus.REJECTED, allowed: [Role.AI_CORE_TEAM] },
  { from: UseCaseStatus.IN_REVIEW, to: UseCaseStatus.ON_HOLD, allowed: [Role.AI_CORE_TEAM] },
  { from: UseCaseStatus.ON_HOLD, to: UseCaseStatus.IN_REVIEW, allowed: [Role.AI_CORE_TEAM] },
  { from: UseCaseStatus.APPROVED, to: UseCaseStatus.PILOT, allowed: [Role.AI_CORE_TEAM] },
  { from: UseCaseStatus.PILOT, to: UseCaseStatus.IMPLEMENTED, allowed: [Role.AI_CORE_TEAM] }
];

// Archiving is allowed from any non-terminal status by Administrators or the AI Core Team
const ARCHIVABLE_FROM: UseCaseStatus[] = [
  UseCaseStatus.DRAFT,
  UseCaseStatus.SUBMITTED,
  UseCaseStatus.IN_REVIEW,
  UseCaseStatus.NEED_MORE_INFO,
  UseCaseStatus.ON_HOLD,
  UseCaseStatus.APPROVED,
  UseCaseStatus.PILOT,
  UseCaseStatus.IMPLEMENTED,
  UseCaseStatus.REJECTED
];

for (const from of ARCHIVABLE_FROM) {
  TRANSITION_RULES.push({
    from,
    to: UseCaseStatus.ARCHIVED,
    allowed: [Role.ADMINISTRATOR, Role.AI_CORE_TEAM]
  });
}

export function findRule(from: UseCaseStatus, to: UseCaseStatus): TransitionRule | undefined {
  return TRANSITION_RULES.find((r) => r.from === from && r.to === to);
}

export function allowedNextStatuses(from: UseCaseStatus): UseCaseStatus[] {
  return TRANSITION_RULES.filter((r) => r.from === from).map((r) => r.to);
}

// Employees may edit use case fields only while it is their own draft or awaiting more info
export function canEditFields(role: Role, isOwner: boolean, status: UseCaseStatus): boolean {
  if (role !== Role.EMPLOYEE) {
    return true;
  }
  return isOwner && (status === UseCaseStatus.DRAFT || status === UseCaseStatus.NEED_MORE_INFO);
}
