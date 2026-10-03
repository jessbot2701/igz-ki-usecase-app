# Architektur — IGZ AI Use Case Portal

## Mitarbeiterzugang per E-Mail

Die Anwendung hat einen öffentlichen Einstieg (`/`, `/idee-melden`, `/zugang`) und zwei
authentifizierte Oberflächen: `/meine-ideen` für Mitarbeitende, den bisherigen Verwaltungsbereich
für Champions/Core Team/Administration. Beide verwenden dieselben Use Cases und Kommentare.

`POST /api/v1/auth/email-link` validiert Firmen-Domain und Eingaben, begrenzt Anforderungen pro
E-Mail und Client-IP und sendet einen 15 Minuten gültigen Einmal-Link. `EmailLoginToken` enthält
den Token-Hash sowie bei einer neuen Idee die unbestätigten Formularangaben. Der Klartext-Token
steht ausschließlich im E-Mail-Link (URL-Fragment, nicht Querystring). Der Browser entfernt ihn
aus der URL und löst erst nach einem ausdrücklichen Klick
`POST /api/v1/auth/email-link/verify` aus.

Die Verifikation verbraucht den Token und erstellt gegebenenfalls Mitarbeiterkonto, eingereichten
Use Case, Statushistorie und Benachrichtigung in einer Datenbanktransaktion. Neue Konten erhalten
keinen nutzbaren Passwort-Hash. Bestehende aktive Mitarbeiterkonten werden weiterverwendet.
Verwaltungsrollen werden niemals durch einen E-Mail-Link authentifiziert. Das resultierende JWT
ist auf Mitarbeiterzugang begrenzt; die Middleware prüft bei jeder Anfrage zusätzlich den
aktuellen Kontostatus und die Rolle aus der Datenbank.

`EmailNotification` ist die dauerhafte Versandwarteschlange. Statusänderungen und Kommentare
werden jeweils gemeinsam mit ihren Benachrichtigungen transaktional gespeichert. Der Worker in
`server.ts` läuft alle 30 Sekunden, wiederholt fehlgeschlagene Zustellungen und entfernt abgelaufene
Verifikationseinträge sowie seit sieben Tagen versendete Benachrichtigungen. Zustellung erfolgt
mindestens einmal; ein Absturz zwischen Versand und Bestätigung kann eine doppelte Mail verursachen.
Der Worker setzt eine Backend-Instanz voraus. SMTP-Details und lokaler Dateimodus stehen in der README.

Die Zugriffskontrolle für alle `use-cases/:id`-Unterrouten erfolgt zentral vor dem jeweiligen Handler
und vor Dateiuploads. Downloads prüfen ebenfalls den Besitzerzugriff. `allowedNextStatuses` ist nach
Rolle und Eigentümerschaft gefiltert; `canEdit` steuert die Bearbeitungsschaltfläche. Die API erzwingt
dieselben Rechte unabhängig von der Oberfläche.

## 1. Systemübersicht

```mermaid
flowchart LR
    subgraph Client
        Browser[Browser: React SPA]
    end
    subgraph FrontendContainer["Frontend Container (nginx)"]
        SPA[Static Build]
    end
    subgraph BackendContainer["Backend Container (Node/Express)"]
        API[REST API]
        AI[IAIService: Mock / Azure OpenAI]
        FS[uploads/ Dateisystem]
    end
    DB[(SQLite via Prisma\nspäter: Azure SQL)]

    Browser --> SPA
    SPA -- "/api/* (nginx proxy)" --> API
    API --> AI
    API --> FS
    API --> DB
```

Bewusste Entscheidung: Frontend und Backend sind getrennt deploybare Container, die nur über eine
REST-Schnittstelle kommunizieren. Das Frontend enthält keine Businesslogik — jede Regel (Workflow,
Berechtigungen, Validierung) lebt im Backend und wird von dort als Zustand (`allowedNextStatuses`,
HTTP-Fehlercodes) an das Frontend transportiert.

## 2. Verzeichnisstruktur

```
backend/
  src/
    config/        Umgebungsvariablen, Prisma-Client-Singleton
    domain/         Enums + Workflow-Regeln (fachliche Kernlogik, keine Abhängigkeit zu Express/Prisma)
    repositories/    Interface + Prisma-Implementierung pro Aggregat (austauschbar gg. Azure SQL)
    services/        Fachlogik / Use Cases (Auth, User, UseCase, Workflow, Comment, Evaluation, ...)
    ai/              IAIService, MockAIService, AzureOpenAIService (Erweiterungspunkt), Factory
    controllers/routes/  HTTP-Schicht (dünn, delegiert an Services)
    middleware/      Auth, RBAC, Fehlerbehandlung, Datei-Upload
    validation/      Zod-Schemas (einzige Quelle der Wahrheit für Eingabevalidierung)
  prisma/           schema.prisma, Migrationen, Seed-Skript
  tests/            unit/ (Domain-/Servicelogik), integration/ (Supertest gegen echte SQLite-Testdatenbank)

frontend/
  src/
    api/            Typisierter HTTP-Client pro Ressource
    types/           Gemeinsame DTO-Typen (gespiegelt vom Backend)
    context/         AuthContext (JWT, aktueller Benutzer)
    theme/           Zentrales Design (Farben, Typografie) — einziger Ort für spätere visuelle Anpassungen
    features/
      auth/ dashboard/ usecases/ admin/
    components/      Layout, Routen-Guards, wiederverwendbare UI-Bausteine
    tests/           Komponententests (Vitest + Testing Library)

docker-compose.yml, backend/Dockerfile, frontend/Dockerfile, frontend/nginx.conf
```

## 3. Datenmodell (ER-Diagramm)

```mermaid
erDiagram
    USER ||--o{ USE_CASE : erstellt
    USER ||--o{ STATUS_HISTORY : aendert
    USER ||--o{ COMMENT : verfasst
    USER ||--o{ EVALUATION : bewertet
    USER ||--o{ ATTACHMENT : laedt_hoch
    USE_CASE ||--o{ STATUS_HISTORY : hat
    USE_CASE ||--o{ COMMENT : hat
    USE_CASE ||--o{ EVALUATION : hat
    USE_CASE ||--o{ ATTACHMENT : hat

    USER {
        string id PK
        string name
        string email
        string role
        string department
        boolean active
    }
    USE_CASE {
        string id PK
        string title
        string requestor
        string department
        string problemDescription
        string solutionIdea
        string status
        string createdById FK
        string lastModifiedById FK
    }
    STATUS_HISTORY {
        string id PK
        string useCaseId FK
        string fromStatus
        string toStatus
        string changedById FK
        string note
    }
    COMMENT {
        string id PK
        string useCaseId FK
        string authorId FK
        string text
    }
    EVALUATION {
        string id PK
        string useCaseId FK
        string evaluatorId FK
        string businessValue
        string feasibility
        string risk
        string strategicRelevance
    }
    ATTACHMENT {
        string id PK
        string useCaseId FK
        string fileName
        string storedPath
        string mimeType
    }
```

Hinweis: Alle Enum-Felder (`role`, `status`, `businessValue`, ...) werden als validierte Strings
gespeichert, da SQLite keine nativen Enums unterstützt. Die Werte-Listen sind in
`backend/src/domain/enums.ts` zentral definiert und über Zod an der API-Grenze erzwungen.

## 4. Komponentenmodell (Backend, Clean Architecture)

```mermaid
flowchart TB
    Routes[Routes / Controller] --> Services
    Services --> Repositories
    Repositories --> Prisma[(Prisma Client)]
    Services --> AI[IAIService]
    Routes --> Middleware[Auth / RBAC / Validation / Error Handling]
```

- **Repository Pattern**: Bestehende Ressourcen verwenden `I*Repository`-Interfaces mit
  Prisma-Implementierungen. E-Mail-Verifikation, Kommentarversand und Workflowänderungen nutzen
  explizite Prisma-Transaktionen für zusammengehörige Schreibvorgänge. Ein Datenbankwechsel erfordert
  daher auch eine Prüfung dieser Transaktionen, Migrationen und datenbankspezifischen Abfragen.
- **Service Layer**: Enthält die gesamte Fachlogik, insbesondere `WorkflowService` (zentrale
  Statusübergangs- und Berechtigungsregeln, siehe `domain/workflowRules.ts`).
- **Keine Businesslogik im Frontend**: Das Frontend zeigt nur an, was die API erlaubt
  (`allowedNextStatuses`), führt aber keine eigene Workflow- oder Berechtigungslogik aus.

## 5. API-Design (Auszug)

| Methode | Pfad                                   | Beschreibung                                   |
| ------- | --------------------------------------- | ----------------------------------------------- |
| POST    | `/api/v1/auth/login`                    | Login, gibt JWT zurück                          |
| GET     | `/api/v1/use-cases`                     | Suche/Filter/Sortierung/Paging                  |
| POST    | `/api/v1/use-cases`                     | Neuen Use Case anlegen                          |
| GET     | `/api/v1/use-cases/:id`                 | Detail inkl. `allowedNextStatuses`              |
| PATCH   | `/api/v1/use-cases/:id`                 | Felder bearbeiten (RBAC-geprüft)                |
| POST    | `/api/v1/use-cases/:id/status`          | Statuswechsel (Workflow- und RBAC-geprüft)      |
| GET/POST| `/api/v1/use-cases/:id/comments`        | Kommentare                                      |
| GET/POST| `/api/v1/use-cases/:id/evaluations`     | Bewertungen (nur AI Champion/Core Team)         |
| GET/POST| `/api/v1/use-cases/:id/attachments`     | Datei-Upload/-Liste                             |
| GET     | `/api/v1/attachments/:id/download`      | Datei-Download                                  |
| GET     | `/api/v1/dashboard/stats`               | KPI-Zahlen für das Dashboard                    |
| GET     | `/api/v1/admin/activity`                | Systemweites Aktivitätsprotokoll (Monitoring)    |
| POST    | `/api/v1/use-cases/:id/ai/summarize`    | KI-Zusammenfassung (aktuell Mock)               |
| GET     | `/api/v1/health`                        | Healthcheck                                     |

## 6. Erweiterbarkeit (Ausblick AI Innovation Portal)

- Neue Ressourcen (z. B. weitere Ideen-Typen) lassen sich als zusätzliche Prisma-Modelle +
  Repository/Service/Route-Trios ergänzen, ohne bestehende Module anzufassen.
- `IAIService` kapselt jede KI-Fähigkeit hinter einer stabilen Schnittstelle — ein Wechsel auf
  Azure OpenAI oder ein anderes Modell ändert nur `ai/aiServiceFactory.ts` und Umgebungsvariablen.
- Die Repository-Schicht bündelt viele Datenzugriffe. Bei einem Wechsel auf Azure SQL sind zusätzlich
  Transaktionen und die SQLite-Abfrage für E-Mail-Adressen ohne Beachtung der Großschreibung anzupassen.
