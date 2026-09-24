import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  Role,
  UseCaseStatus,
  BusinessValue,
  Feasibility,
  Risk,
  StrategicRelevance,
  Reach,
  BenefitType,
  Level,
  AiSolutionType,
  DataClassification
} from '../src/domain/enums';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Passwort123!';
const SEED_DEPARTMENTS = ['AI Core Team', 'Finanzen', 'IT', 'Personal', 'Produktion', 'Recht', 'Vertrieb'];

async function seedDepartments() {
  await Promise.all(
    SEED_DEPARTMENTS.map((name) =>
      prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
}

async function upsertUser(name: string, email: string, role: Role, department: string) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role, department }
  });
}

async function main() {
  await seedDepartments();
  const employee = await upsertUser('Anna Employee', 'employee@igz.example', Role.EMPLOYEE, 'Vertrieb');
  const champion = await upsertUser('Chris Champion', 'champion@igz.example', Role.AI_CHAMPION, 'IT');
  const coreTeam = await upsertUser('Cora Coreteam', 'coreteam@igz.example', Role.AI_CORE_TEAM, 'AI Core Team');
  const admin = await upsertUser('Adam Admin', 'admin@igz.example', Role.ADMINISTRATOR, 'IT');

  const existingCount = await prisma.useCase.count();
  if (existingCount > 0) {
    console.log('Use Cases bereits vorhanden, überspringe Seed-Daten für Use Cases.');
    return;
  }

  const useCase1 = await prisma.useCase.create({
    data: {
      title: 'Automatisierte Rechnungsprüfung',
      requestor: employee.name,
      department: 'Finanzen',
      aiChampion: champion.name,
      problemDescription: 'Eingangsrechnungen werden manuell auf Plausibilität geprüft, was viel Zeit kostet.',
      currentProcess: 'Manuelle Sichtprüfung durch die Buchhaltung.',
      painPoints: 'Hoher manueller Aufwand, Fehleranfälligkeit.',
      frequency: 'Täglich',
      solutionIdea: 'KI-gestützte Extraktion und Plausibilitätsprüfung von Rechnungsdaten.',
      dataSources: 'PDF-Rechnungen, ERP-Stammdaten',
      expectedOutput: 'Automatisch geprüfte und markierte Rechnungen',
      targetGroup: 'Buchhaltung',
      reach: Reach.BEREICH_ABTEILUNG,
      estimatedUsers: 12,
      usageFrequency: 'Täglich',
      benefits: 'Zeitersparnis, weniger Fehler',
      benefitTypes: [BenefitType.ZEITERSPARNIS, BenefitType.RISIKOREDUKTION].join(','),
      estimatedEffect: Level.MITTEL,
      estimatedTimeSavings: '10 Stunden/Woche',
      aiSolutionType: AiSolutionType.COPILOT_STUDIO_AGENT,
      implementationEffort: Level.MITTEL,
      dataClassifications: [DataClassification.INTERNE_DATEN].join(','),
      riskAssessment: 'Niedrig',
      status: UseCaseStatus.SUBMITTED,
      createdById: employee.id,
      lastModifiedById: employee.id
    }
  });

  const useCase2 = await prisma.useCase.create({
    data: {
      title: 'Chatbot für IT-Support',
      requestor: champion.name,
      department: 'IT',
      aiChampion: champion.name,
      problemDescription: 'Wiederkehrende IT-Support-Anfragen binden viel Kapazität des Helpdesks.',
      currentProcess: 'Ticketsystem mit manueller Beantwortung.',
      painPoints: 'Lange Wartezeiten bei Standardanfragen.',
      frequency: 'Mehrmals täglich',
      solutionIdea: 'KI-Chatbot beantwortet Standardfragen automatisiert.',
      dataSources: 'FAQ-Datenbank, Ticket-Historie',
      expectedOutput: 'Automatisierte Erstantworten',
      targetGroup: 'Alle Mitarbeitenden',
      reach: Reach.UNTERNEHMENSWEIT,
      estimatedUsers: 300,
      usageFrequency: 'Täglich',
      benefits: 'Entlastung des Helpdesks',
      benefitTypes: [BenefitType.ZEITERSPARNIS, BenefitType.WISSENSMANAGEMENT].join(','),
      estimatedEffect: Level.HOCH,
      estimatedTimeSavings: '15 Stunden/Woche',
      aiSolutionType: AiSolutionType.COPILOT_STUDIO_AGENT,
      implementationEffort: Level.HOCH,
      dataClassifications: [DataClassification.INTERNE_DATEN].join(','),
      riskAssessment: 'Niedrig',
      status: UseCaseStatus.IN_REVIEW,
      createdById: champion.id,
      lastModifiedById: champion.id
    }
  });

  const useCase3 = await prisma.useCase.create({
    data: {
      title: 'KI-gestützte Vertragsanalyse',
      requestor: employee.name,
      department: 'Recht',
      aiChampion: champion.name,
      problemDescription: 'Verträge müssen manuell auf Risikoklauseln geprüft werden.',
      currentProcess: 'Juristische Einzelprüfung jedes Vertrags.',
      painPoints: 'Zeitintensiv, abhängig von Verfügbarkeit der Fachabteilung.',
      frequency: 'Wöchentlich',
      solutionIdea: 'KI markiert kritische Klauseln automatisch zur Vorprüfung.',
      dataSources: 'Vertragsdokumente (PDF/DOCX)',
      expectedOutput: 'Markierte Risikoklauseln je Vertrag',
      targetGroup: 'Rechtsabteilung',
      reach: Reach.BEREICH_ABTEILUNG,
      estimatedUsers: 8,
      usageFrequency: 'Wöchentlich',
      benefits: 'Schnellere Vertragsprüfung',
      benefitTypes: [BenefitType.ZEITERSPARNIS, BenefitType.QUALITAET].join(','),
      estimatedEffect: Level.MITTEL,
      estimatedTimeSavings: '5 Stunden/Woche',
      aiSolutionType: AiSolutionType.EIGENENTWICKLUNG,
      implementationEffort: Level.MITTEL,
      dataClassifications: [DataClassification.VERTRAULICHE_DATEN, DataClassification.PERSONENBEZOGENE_DATEN].join(
        ','
      ),
      riskAssessment: 'Mittel',
      securityNotes: 'Enthält personenbezogene und vertrauliche Daten.',
      responsible: coreTeam.name,
      targetDate: 'Q1 nächstes Jahr (Pilotstart)',
      status: UseCaseStatus.APPROVED,
      createdById: employee.id,
      lastModifiedById: coreTeam.id
    }
  });

  const useCase4 = await prisma.useCase.create({
    data: {
      title: 'Predictive Maintenance für Produktionsanlagen',
      requestor: champion.name,
      department: 'Produktion',
      aiChampion: champion.name,
      problemDescription: 'Ungeplante Maschinenausfälle verursachen Produktionsstillstand.',
      currentProcess: 'Reaktive Wartung nach Ausfall.',
      painPoints: 'Hohe Ausfallkosten, ungeplante Stillstände.',
      frequency: 'Laufend',
      solutionIdea: 'Sensordaten-basierte Vorhersage von Wartungsbedarf.',
      dataSources: 'Maschinensensordaten, Wartungshistorie',
      expectedOutput: 'Wartungsempfehlungen vor Ausfall',
      targetGroup: 'Produktionsteam',
      reach: Reach.BEREICH_ABTEILUNG,
      estimatedUsers: 25,
      usageFrequency: 'Laufend',
      benefits: 'Weniger Stillstandszeiten',
      benefitTypes: [BenefitType.RISIKOREDUKTION].join(','),
      estimatedEffect: Level.HOCH,
      estimatedTimeSavings: 'Nicht quantifiziert',
      aiSolutionType: AiSolutionType.EIGENENTWICKLUNG,
      implementationEffort: Level.HOCH,
      dataClassifications: [DataClassification.INTERNE_DATEN].join(','),
      riskAssessment: 'Mittel',
      responsible: coreTeam.name,
      targetDate: 'Review nach 3 Monaten Pilotbetrieb',
      status: UseCaseStatus.PILOT,
      createdById: champion.id,
      lastModifiedById: coreTeam.id
    }
  });

  const useCase5 = await prisma.useCase.create({
    data: {
      title: 'Automatische Meeting-Protokolle',
      requestor: employee.name,
      department: 'Vertrieb',
      aiChampion: champion.name,
      problemDescription: 'Meeting-Protokolle werden inkonsistent und zeitverzögert erstellt.',
      solutionIdea: 'KI transkribiert und fasst Meetings automatisch zusammen.',
      targetGroup: 'Alle Teams',
      reach: Reach.UNTERNEHMENSWEIT,
      estimatedUsers: 150,
      benefits: 'Konsistente, schnelle Protokolle',
      benefitTypes: [BenefitType.ZEITERSPARNIS, BenefitType.QUALITAET].join(','),
      estimatedEffect: Level.MITTEL,
      aiSolutionType: AiSolutionType.M365_COPILOT,
      implementationEffort: Level.NIEDRIG,
      dataClassifications: [DataClassification.INTERNE_DATEN].join(','),
      riskAssessment: 'Niedrig',
      responsible: coreTeam.name,
      status: UseCaseStatus.IMPLEMENTED,
      createdById: employee.id,
      lastModifiedById: coreTeam.id
    }
  });

  const useCase6 = await prisma.useCase.create({
    data: {
      title: 'KI-Bewerbungsvorauswahl',
      requestor: employee.name,
      department: 'Personal',
      aiChampion: champion.name,
      problemDescription: 'Große Menge an Bewerbungen erschwert schnelle Vorauswahl.',
      solutionIdea: 'Automatisches Ranking von Bewerbungen nach Anforderungsprofil.',
      targetGroup: 'HR',
      reach: Reach.TEAM,
      estimatedUsers: 5,
      benefits: 'Schnellere Vorauswahl',
      benefitTypes: [BenefitType.ZEITERSPARNIS].join(','),
      estimatedEffect: Level.NIEDRIG,
      aiSolutionType: AiSolutionType.SONSTIGES,
      aiSolutionOtherText: 'Externes HR-Scoring-Tool (Anbieter offen)',
      implementationEffort: Level.MITTEL,
      dataClassifications: [DataClassification.PERSONENBEZOGENE_DATEN].join(','),
      riskAssessment: 'Hoch',
      securityNotes: 'Personenbezogene Bewerberdaten, hohes Diskriminierungsrisiko.',
      responsible: coreTeam.name,
      status: UseCaseStatus.REJECTED,
      createdById: employee.id,
      lastModifiedById: coreTeam.id
    }
  });

  await prisma.statusHistory.createMany({
    data: [
      { useCaseId: useCase1.id, fromStatus: null, toStatus: UseCaseStatus.DRAFT, changedById: employee.id },
      { useCaseId: useCase1.id, fromStatus: UseCaseStatus.DRAFT, toStatus: UseCaseStatus.SUBMITTED, changedById: employee.id },
      { useCaseId: useCase2.id, fromStatus: null, toStatus: UseCaseStatus.DRAFT, changedById: champion.id },
      { useCaseId: useCase2.id, fromStatus: UseCaseStatus.DRAFT, toStatus: UseCaseStatus.SUBMITTED, changedById: champion.id },
      { useCaseId: useCase2.id, fromStatus: UseCaseStatus.SUBMITTED, toStatus: UseCaseStatus.IN_REVIEW, changedById: champion.id },
      { useCaseId: useCase3.id, fromStatus: UseCaseStatus.IN_REVIEW, toStatus: UseCaseStatus.APPROVED, changedById: coreTeam.id, note: 'Vielversprechender Use Case, Pilot empfohlen.' },
      { useCaseId: useCase4.id, fromStatus: UseCaseStatus.APPROVED, toStatus: UseCaseStatus.PILOT, changedById: coreTeam.id },
      { useCaseId: useCase5.id, fromStatus: UseCaseStatus.PILOT, toStatus: UseCaseStatus.IMPLEMENTED, changedById: coreTeam.id },
      { useCaseId: useCase6.id, fromStatus: UseCaseStatus.IN_REVIEW, toStatus: UseCaseStatus.REJECTED, changedById: coreTeam.id, note: 'Zu hohes rechtliches Risiko ohne weitere Absicherung.' }
    ]
  });

  await prisma.comment.createMany({
    data: [
      { useCaseId: useCase1.id, authorId: champion.id, text: 'Bitte genauer beschreiben, welche Rechnungsformate vorliegen.' },
      { useCaseId: useCase2.id, authorId: coreTeam.id, text: 'Guter Ansatz, bitte Datenschutzaspekte klären.' },
      { useCaseId: useCase6.id, authorId: coreTeam.id, text: 'Diskriminierungsrisiko muss vor Freigabe adressiert werden.' }
    ]
  });

  await prisma.evaluation.createMany({
    data: [
      {
        useCaseId: useCase2.id,
        evaluatorId: champion.id,
        businessValue: BusinessValue.HOCH,
        feasibility: Feasibility.MITTEL,
        risk: Risk.NIEDRIG,
        strategicRelevance: StrategicRelevance.IGZ_WEIT
      },
      {
        useCaseId: useCase3.id,
        evaluatorId: coreTeam.id,
        businessValue: BusinessValue.MITTEL,
        feasibility: Feasibility.MITTEL,
        risk: Risk.MITTEL,
        strategicRelevance: StrategicRelevance.BEREICH
      },
      {
        useCaseId: useCase6.id,
        evaluatorId: coreTeam.id,
        businessValue: BusinessValue.NIEDRIG,
        feasibility: Feasibility.EINFACH,
        risk: Risk.HOCH,
        strategicRelevance: StrategicRelevance.QUICK_WIN
      }
    ]
  });

  console.log('Seed abgeschlossen. Beispielbenutzer (Passwort für alle: %s):', SEED_PASSWORD);
  console.log([employee, champion, coreTeam, admin].map((u) => `${u.role}: ${u.email}`).join('\n'));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
