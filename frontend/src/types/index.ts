export const Role = {
  EMPLOYEE: 'EMPLOYEE',
  AI_CHAMPION: 'AI_CHAMPION',
  AI_CORE_TEAM: 'AI_CORE_TEAM',
  ADMINISTRATOR: 'ADMINISTRATOR'
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UseCaseStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFO: 'NEED_MORE_INFO',
  ON_HOLD: 'ON_HOLD',
  APPROVED: 'APPROVED',
  PILOT: 'PILOT',
  IMPLEMENTED: 'IMPLEMENTED',
  ARCHIVED: 'ARCHIVED',
  REJECTED: 'REJECTED'
} as const;
export type UseCaseStatus = (typeof UseCaseStatus)[keyof typeof UseCaseStatus];

export const STATUS_LABELS: Record<UseCaseStatus, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  IN_REVIEW: 'In Prüfung',
  NEED_MORE_INFO: 'Rückfrage',
  ON_HOLD: 'Zurückgestellt',
  APPROVED: 'Genehmigt',
  PILOT: 'Pilot',
  IMPLEMENTED: 'Umgesetzt',
  ARCHIVED: 'Archiviert',
  REJECTED: 'Abgelehnt'
};

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: 'Mitarbeiter',
  AI_CHAMPION: 'AI Champion',
  AI_CORE_TEAM: 'AI Core Team',
  ADMINISTRATOR: 'Administrator'
};

export const BusinessValue = { NIEDRIG: 'NIEDRIG', MITTEL: 'MITTEL', HOCH: 'HOCH' } as const;
export type BusinessValue = (typeof BusinessValue)[keyof typeof BusinessValue];

export const Feasibility = { EINFACH: 'EINFACH', MITTEL: 'MITTEL', KOMPLEX: 'KOMPLEX' } as const;
export type Feasibility = (typeof Feasibility)[keyof typeof Feasibility];

export const Risk = { NIEDRIG: 'NIEDRIG', MITTEL: 'MITTEL', HOCH: 'HOCH' } as const;
export type Risk = (typeof Risk)[keyof typeof Risk];

export const StrategicRelevance = {
  QUICK_WIN: 'QUICK_WIN',
  BEREICH: 'BEREICH',
  IGZ_WEIT: 'IGZ_WEIT'
} as const;
export type StrategicRelevance = (typeof StrategicRelevance)[keyof typeof StrategicRelevance];

// Generic niedrig/mittel/hoch scale (Steckbrief template: Sec. 5 Effekt, Sec. 6 Umsetzungsaufwand)
export const Level = { NIEDRIG: 'NIEDRIG', MITTEL: 'MITTEL', HOCH: 'HOCH' } as const;
export type Level = (typeof Level)[keyof typeof Level];
export const LEVEL_LABELS: Record<Level, string> = { NIEDRIG: 'Niedrig', MITTEL: 'Mittel', HOCH: 'Hoch' };

// Steckbrief template Sec. 4 "Zielgruppe und Reichweite"
export const Reach = {
  EINZELPERSON: 'EINZELPERSON',
  TEAM: 'TEAM',
  BEREICH_ABTEILUNG: 'BEREICH_ABTEILUNG',
  UNTERNEHMENSWEIT: 'UNTERNEHMENSWEIT'
} as const;
export type Reach = (typeof Reach)[keyof typeof Reach];
export const REACH_LABELS: Record<Reach, string> = {
  EINZELPERSON: 'Einzelperson',
  TEAM: 'Team',
  BEREICH_ABTEILUNG: 'Bereich / Abteilung',
  UNTERNEHMENSWEIT: 'Unternehmensweit'
};

// Steckbrief template Sec. 5 "Erwarteter Nutzen" -> Nutzenart (multi-select)
export const BenefitType = {
  ZEITERSPARNIS: 'ZEITERSPARNIS',
  QUALITAET: 'QUALITAET',
  RISIKOREDUKTION: 'RISIKOREDUKTION',
  KUNDENNUTZEN: 'KUNDENNUTZEN',
  WISSENSMANAGEMENT: 'WISSENSMANAGEMENT',
  SONSTIGES: 'SONSTIGES'
} as const;
export type BenefitType = (typeof BenefitType)[keyof typeof BenefitType];
export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  ZEITERSPARNIS: 'Zeitersparnis',
  QUALITAET: 'Qualität',
  RISIKOREDUKTION: 'Risikoreduzierung',
  KUNDENNUTZEN: 'Kundennutzen',
  WISSENSMANAGEMENT: 'Wissensmanagement',
  SONSTIGES: 'Sonstiges'
};

// Steckbrief template Sec. 6 "Lösungsweg und Aufwand" -> KI-Lösung
export const AiSolutionType = {
  M365_COPILOT: 'M365_COPILOT',
  GITHUB_COPILOT: 'GITHUB_COPILOT',
  COPILOT_STUDIO_AGENT: 'COPILOT_STUDIO_AGENT',
  CLAUDE_AI: 'CLAUDE_AI',
  EIGENENTWICKLUNG: 'EIGENENTWICKLUNG',
  SONSTIGES: 'SONSTIGES'
} as const;
export type AiSolutionType = (typeof AiSolutionType)[keyof typeof AiSolutionType];
export const AI_SOLUTION_TYPE_LABELS: Record<AiSolutionType, string> = {
  M365_COPILOT: 'Microsoft 365 Copilot',
  GITHUB_COPILOT: 'GitHub Copilot',
  COPILOT_STUDIO_AGENT: 'Copilot Studio / AI Agent',
  CLAUDE_AI: 'Claude AI',
  EIGENENTWICKLUNG: 'Eigenentwicklung',
  SONSTIGES: 'Sonstiges'
};

// Steckbrief template Sec. 7 "Daten, Sicherheit und Compliance" (multi-select)
export const DataClassification = {
  KEINE_SENSIBLEN_DATEN: 'KEINE_SENSIBLEN_DATEN',
  INTERNE_DATEN: 'INTERNE_DATEN',
  VERTRAULICHE_DATEN: 'VERTRAULICHE_DATEN',
  PERSONENBEZOGENE_DATEN: 'PERSONENBEZOGENE_DATEN',
  KUNDENDATEN: 'KUNDENDATEN',
  NOCH_ZU_PRUEFEN: 'NOCH_ZU_PRUEFEN'
} as const;
export type DataClassification = (typeof DataClassification)[keyof typeof DataClassification];
export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  KEINE_SENSIBLEN_DATEN: 'Keine sensiblen Daten',
  INTERNE_DATEN: 'Interne Daten',
  VERTRAULICHE_DATEN: 'Vertrauliche Daten',
  PERSONENBEZOGENE_DATEN: 'Personenbezogene Daten',
  KUNDENDATEN: 'Kundendaten',
  NOCH_ZU_PRUEFEN: 'Noch zu prüfen'
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  active?: boolean;
  createdAt?: string;
}

export interface UseCase {
  id: string;
  title: string;
  requestor: string;
  department: string;
  aiChampion?: string | null;
  problemDescription: string;
  currentProcess?: string | null;
  painPoints?: string | null;
  frequency?: string | null;
  solutionIdea: string;
  dataSources?: string | null;
  expectedOutput?: string | null;
  targetGroup?: string | null;
  reach?: Reach | null;
  estimatedUsers?: number | null;
  usageFrequency?: string | null;
  benefits?: string | null;
  benefitTypes?: BenefitType[];
  estimatedEffect?: Level | null;
  estimatedTimeSavings?: string | null;
  businessValueNote?: string | null;
  aiSolutionType?: AiSolutionType | null;
  aiSolutionOtherText?: string | null;
  implementationEffort?: Level | null;
  dependencies?: string | null;
  dataClassifications?: DataClassification[];
  riskAssessment?: string | null;
  securityNotes?: string | null;
  responsible?: string | null;
  targetDate?: string | null;
  status: UseCaseStatus;
  createdById: string;
  lastModifiedById: string;
  createdAt: string;
  updatedAt: string;
  allowedNextStatuses?: UseCaseStatus[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: UseCaseStatus | null;
  toStatus: UseCaseStatus;
  note?: string | null;
  changedAt: string;
  changedBy: { id: string; name: string; role: Role };
}

export interface CommentEntry {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string; role: Role };
}

export interface EvaluationEntry {
  id: string;
  businessValue: BusinessValue;
  feasibility: Feasibility;
  risk: Risk;
  strategicRelevance: StrategicRelevance;
  note?: string | null;
  createdAt: string;
  evaluator: { id: string; name: string; role: Role };
}

export interface AttachmentEntry {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

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
  timestamp: string;
  detail: string;
}
