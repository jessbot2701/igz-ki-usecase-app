// Domain enums as plain string-literal unions (SQLite has no native enum type).
// Kept in the exact shape of a Prisma/TS enum object so call sites read the same
// (e.g. Role.EMPLOYEE) regardless of the underlying persistence technology.
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

export const BusinessValue = {
  NIEDRIG: 'NIEDRIG',
  MITTEL: 'MITTEL',
  HOCH: 'HOCH'
} as const;
export type BusinessValue = (typeof BusinessValue)[keyof typeof BusinessValue];

export const Feasibility = {
  EINFACH: 'EINFACH',
  MITTEL: 'MITTEL',
  KOMPLEX: 'KOMPLEX'
} as const;
export type Feasibility = (typeof Feasibility)[keyof typeof Feasibility];

export const Risk = {
  NIEDRIG: 'NIEDRIG',
  MITTEL: 'MITTEL',
  HOCH: 'HOCH'
} as const;
export type Risk = (typeof Risk)[keyof typeof Risk];

export const StrategicRelevance = {
  QUICK_WIN: 'QUICK_WIN',
  BEREICH: 'BEREICH',
  IGZ_WEIT: 'IGZ_WEIT'
} as const;
export type StrategicRelevance = (typeof StrategicRelevance)[keyof typeof StrategicRelevance];

// Generic niedrig/mittel/hoch scale used by the Steckbrief template for effect & effort ratings
export const Level = {
  NIEDRIG: 'NIEDRIG',
  MITTEL: 'MITTEL',
  HOCH: 'HOCH'
} as const;
export type Level = (typeof Level)[keyof typeof Level];

// Section 4 "Zielgruppe und Reichweite" of the Steckbrief template
export const Reach = {
  EINZELPERSON: 'EINZELPERSON',
  TEAM: 'TEAM',
  BEREICH_ABTEILUNG: 'BEREICH_ABTEILUNG',
  UNTERNEHMENSWEIT: 'UNTERNEHMENSWEIT'
} as const;
export type Reach = (typeof Reach)[keyof typeof Reach];

// Section 5 "Erwarteter Nutzen" -> Nutzenart (multi-select in the template)
export const BenefitType = {
  ZEITERSPARNIS: 'ZEITERSPARNIS',
  QUALITAET: 'QUALITAET',
  RISIKOREDUKTION: 'RISIKOREDUKTION',
  KUNDENNUTZEN: 'KUNDENNUTZEN',
  WISSENSMANAGEMENT: 'WISSENSMANAGEMENT',
  SONSTIGES: 'SONSTIGES'
} as const;
export type BenefitType = (typeof BenefitType)[keyof typeof BenefitType];

// Section 6 "Lösungsweg und Aufwand" -> KI-Lösung
export const AiSolutionType = {
  M365_COPILOT: 'M365_COPILOT',
  GITHUB_COPILOT: 'GITHUB_COPILOT',
  COPILOT_STUDIO_AGENT: 'COPILOT_STUDIO_AGENT',
  CLAUDE_AI: 'CLAUDE_AI',
  EIGENENTWICKLUNG: 'EIGENENTWICKLUNG',
  SONSTIGES: 'SONSTIGES'
} as const;
export type AiSolutionType = (typeof AiSolutionType)[keyof typeof AiSolutionType];

// Section 7 "Daten, Sicherheit und Compliance" (multi-select in the template)
export const DataClassification = {
  KEINE_SENSIBLEN_DATEN: 'KEINE_SENSIBLEN_DATEN',
  INTERNE_DATEN: 'INTERNE_DATEN',
  VERTRAULICHE_DATEN: 'VERTRAULICHE_DATEN',
  PERSONENBEZOGENE_DATEN: 'PERSONENBEZOGENE_DATEN',
  KUNDENDATEN: 'KUNDENDATEN',
  NOCH_ZU_PRUEFEN: 'NOCH_ZU_PRUEFEN'
} as const;
export type DataClassification = (typeof DataClassification)[keyof typeof DataClassification];
