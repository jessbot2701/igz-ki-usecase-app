# IGZ AI Use Case Portal

Digitaler Ersatz für den Word-basierten AI Use Case Steckbrief: Mitarbeiter reichen AI-Ideen ein,
AI Champions bewerten sie, das AI Core Team entscheidet über Pilotierung und Umsetzung. Gebaut als
erweiterbares Fundament für ein späteres zentrales AI Innovation Portal.

## Tech-Stack

| Schicht      | Technologie                                           |
| ------------ | ------------------------------------------------------ |
| Frontend     | React, TypeScript, Vite, Material UI, React Query       |
| Backend      | Node.js, Express, TypeScript (Clean Architecture)       |
| Persistenz   | SQLite via Prisma ORM (später austauschbar gegen Azure SQL) |
| Deployment   | Docker, Docker Compose                                  |

Details zur Architektur: [docs/architecture.md](docs/architecture.md)

## Schnellstart

### Option A — Docker Compose (empfohlen)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8080/api/v1 (über Nginx-Proxy) bzw. intern Port 4000
- Beim ersten Start werden Migrationen automatisch angewendet und Beispieldaten geseedet.

### Option B — lokale Entwicklung ohne Docker

Voraussetzung: Node.js 20+

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev        # http://localhost:4000

# Frontend (in zweitem Terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

## Beispielbenutzer (Seed-Daten)

Passwort für alle Konten: `Passwort123!`

| Rolle          | E-Mail                     |
| -------------- | -------------------------- |
| Employee       | employee@igz.example        |
| AI Champion    | champion@igz.example        |
| AI Core Team   | coreteam@igz.example         |
| Administrator  | admin@igz.example            |

Die Seed-Daten enthalten zusätzlich 6 Beispiel-Use-Cases über verschiedene Status hinweg inklusive
Kommentaren, Bewertungen und Statushistorie.

## Rollen & Berechtigungen

- **Employee**: Use Cases anlegen, eigene Use Cases ansehen/bearbeiten, einreichen
- **AI Champion**: zusätzlich bewerten, kommentieren, in Review setzen, Rückfragen stellen
- **AI Core Team**: zusätzlich genehmigen/ablehnen, Pilot/Umsetzung freigeben, archivieren
- **Administrator**: Benutzerverwaltung, systemweites Aktivitätsprotokoll

## Statusworkflow

```
Draft → Submitted → In Review → Need More Information → Submitted (Re-Einreichung)
                              ↘ Approved → Pilot → Implemented
                              ↘ Rejected
(jeder nicht-terminale Status) → Archived
```

Alle Statuswechsel werden mit Zeitstempel, Benutzer und optionalem Kommentar historisiert
(sichtbar im Tab "Historie" jedes Use Case).

## Tests

```bash
cd backend && npm test    # Unit- und Integrationstests (Vitest + Supertest)
cd frontend && npm test   # Komponententests (Vitest + React Testing Library)
```

## Qualität

- TypeScript strict mode in beiden Paketen
- ESLint + Prettier
- Zod-Validierung an der API-Grenze (Backend) und im Formular (Frontend)
- Zentrales Error Handling & strukturiertes Logging (pino)

## KI-Integration (vorbereitet, nicht aktiviert)

Das Backend definiert die Schnittstelle `IAIService` (`backend/src/ai/IAIService.ts`) mit den
Methoden `summarizeUseCase()`, `classifyUseCase()`, `generateManagementSummary()`. Standardmäßig
aktiv ist `MockAIService` (deterministisch, offline). Eine reale Azure-OpenAI-Anbindung
(`AzureOpenAIService`) ist als Erweiterungspunkt vorbereitet und lässt sich per Umgebungsvariable
aktivieren, **ohne dass sich am Frontend etwas ändern muss**:

```bash
AI_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=...
```

## Geplante Erweiterungen (bewusst außerhalb des MVP-Scopes)

- Volle Observability (Prometheus/Grafana) über das aktuelle Aktivitätsprotokoll hinaus
- Austausch der SQLite-Persistenz gegen Azure SQL (Repository-Schnittstellen sind bereits
  Datenbank-agnostisch gehalten)
- Visuelle Aufwertung (Illustrationen/Branding) über Higgsfield-generierte Assets — die zentrale
  Theme-Datei (`frontend/src/theme/theme.ts`) und ein `assets/illustrations`-Ordner sind als
  Erweiterungspunkt vorgesehen, damit dies ohne Komponentenänderungen möglich ist.
