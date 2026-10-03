# IGZ AI Use Case Portal

Digitaler Ersatz für den Word-basierten AI Use Case Steckbrief: Mitarbeiter reichen AI-Ideen ein,
AI Champions bewerten sie, das AI Core Team entscheidet über Pilotierung und Umsetzung. Gebaut als
erweiterbares Fundament für ein späteres zentrales AI Innovation Portal.

## Lokale Vorführung ohne SMTP

Unter Windows im Projektverzeichnis starten (Node.js und npm erforderlich):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-demo.ps1
```

Danach **http://127.0.0.1:5175** öffnen. Das Skript installiert bei Bedarf die Abhängigkeiten,
wendet Migrationen an und startet Backend und Frontend im Hintergrund. Es nutzt ausschließlich
`backend/prisma/demo.db`, bindet beide Dienste an den lokalen Rechner und versendet keine E-Mails.
Die Demo ist sichtbar gekennzeichnet; ausschließlich Beispieldaten verwenden.

Vorführablauf:

1. Unter **Idee melden** Name und Beispielidee eingeben. Die feste Demo-Adresse
   `demo.mitarbeiter@igz.com` ist vorausgefüllt.
2. **Demo-Bestätigungslink erstellen**, danach **Demo-Bestätigungslink öffnen** und ausdrücklich bestätigen.
3. In einem zweiten Browserprofil unter `/login` mit `champion@igz.example` / `Passwort123!`
   anmelden. Idee öffnen, Champion zuordnen, in Prüfung nehmen und eine Rückfrage stellen.
4. Im Mitarbeiterfenster die Idee neu laden, unter **Kommentare** antworten und **Erneut einreichen**.
5. Für Entscheidungen das Core-Team-Konto `coreteam@igz.example` / `Passwort123!` verwenden.

Später öffnet **Meine Ideen** per Demo-Link wieder dasselbe Mitarbeiterkonto. Benachrichtigungen
werden nur lokal protokolliert; der Wechsel zwischen den Browserfenstern ersetzt den Postfachschritt.
Die Demo-Daten bleiben zwischen Starts erhalten. Beenden:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-demo.ps1
```

**Späterer Echtbetrieb:** `DEMO_MODE=false`, `MAIL_TRANSPORT=smtp` sowie SMTP-Daten,
Absender und produktive HTTPS-App-URL konfigurieren und den normalen Produktivstart verwenden.
Der E-Mail-Link-Ablauf ist bereits implementiert; dafür ist kein Umbau der App nötig.
Demo-Links sind dann ungültig. Demo-Datenbank und Beispielkonten werden nicht ins Produktivsystem übernommen.
Der Server verweigert den Start mit `DEMO_MODE=true` unter `NODE_ENV=production` oder mit SMTP-Transport.

## Zwei Einstiege: Ideen melden und Use Cases verwalten

- **`/`**: Öffentliche Startseite mit Zugang zur Meldung und zur Verwaltung.
- **`/idee-melden`**: Kurzes Formular mit Name, Firmen-E-Mail, Titel, Bereich, Problem und Lösungsidee.
  Ein Use Case wird erst nach Bestätigung der E-Mail angelegt, direkt im Status `SUBMITTED`.
- **`/zugang` / `/meine-ideen`**: Mitarbeitende öffnen ihre eigenen Ideen über einen einmaligen
  E-Mail-Link. Sie können Status, Kommentare und Historie lesen, antworten und bei Rückfragen
  ihre Angaben ergänzen und erneut einreichen. Ein eigenes Passwort ist nicht erforderlich.
- **`/login`**: Bestehender Passwortzugang für AI Champions, AI Core Team und Administration.
  Bestehende Mitarbeiterkonten bleiben kompatibel; sie gelangen in den persönlichen Ideenbereich.

Champion und Core Team sehen weiterhin alle Use Cases und deren gemeinsame Kommentare.
Champions starten die Prüfung und stellen Rückfragen; das Core Team entscheidet über Freigabe,
Ablehnung, Zurückstellung, Pilotierung, Umsetzung und Archivierung. Portfolioauswertungen und
systemweites Aktivitätsprotokoll sind weiterhin Core Team und Administratoren vorbehalten.
Es gibt keine Beschränkung der Champions auf den eigenen Bereich und keine internen Privatkommentare.

### E-Mail-Versand einrichten

Für den produktiven Mitarbeiterzugang müssen folgende Umgebungsvariablen gesetzt sein
(lokal in `backend/.env`, bei Docker Compose in der `.env` im Projektverzeichnis):

| Variable | Bedeutung |
| --- | --- |
| `PUBLIC_APP_URL` | Öffentliche Basis-URL, in Produktion zwingend HTTPS |
| `EMAIL_ALLOWED_DOMAINS` | `igz.com` – freigegebene Mitarbeiter-Domain, ohne `@`; in Produktion erforderlich |
| `MAIL_TRANSPORT` | `smtp` für echten Versand |
| `SMTP_HOST`, `SMTP_PORT` | SMTP-Server und Port, standardmäßig 587 |
| `SMTP_SECURE` | `true` für direktes TLS, typischerweise Port 465; sonst STARTTLS erforderlich |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP-Zugangsdaten, falls der Server Authentifizierung verlangt |
| `MAIL_FROM` | Freigegebene Absenderadresse |
| `TRUST_PROXY` | Explizit vertrauenswürdige Proxy-IP-Adressen/Subnetze für die IP-Begrenzung |

Ohne Mail-Konfiguration meldet die API einen verständlichen Fehler (503). Domains werden nicht
aus einer eingegebenen Adresse abgeleitet. SMTP-Zugangsdaten gehören nicht ins Repository.
Der SMTP-Transport verwendet [Nodemailer](https://nodemailer.com/smtp).

**Lokaler Test ohne E-Mail-Versand:** `MAIL_TRANSPORT=file` und
`PUBLIC_APP_URL=http://localhost:5173` setzen. Die Nachrichten einschließlich Testlinks werden
in `backend/.local-mail/` gespeichert (Git-ignoriert). Dieser Modus ist in Produktion gesperrt.
Die Dateien enthalten Zugangslinks und sollten nach lokalen Tests entfernt werden.

Nach Aktualisierung zuerst `npm run prisma:generate` und `npm run prisma:deploy` im Backend
ausführen, danach Backend und Frontend starten. Docker übernimmt Migrationen beim Start.

### Rückfragen und Benachrichtigungen

Die Abstimmung erfolgt unter **Kommentare** am Use Case. Bei `NEED_MORE_INFO` zeigt der
Mitarbeiterbereich zusätzlich die Rückfrage aus der Statusänderung an. Nach Ergänzung kann
die Idee über **Erneut einreichen** zurück an das AI-Team gegeben werden.

Die Anzeige unterscheidet **Antwort ausstehend** und **Antwort eingegangen**. Erst ein Kommentar
des Einreichers nach der aktuellen Rückfrage zählt als Antwort; das Öffnen des Vorgangs oder ein
Kommentar des AI-Teams ändert diese Anzeige nicht. Ob die Antwort ausreicht, beurteilt das AI-Team.
Jede neue Rückfrage setzt die Anzeige zurück. In der Verwaltung und unter **Meine Ideen** können
unbeantwortete Rückfragen gefiltert werden, auch über mehrere Ergebnisseiten hinweg.

Champions werden durch das AI-Team aus aktiven Champion-Konten ausgewählt und über `aiChampionId`
fest zugeordnet. Namensänderungen lösen die Zuordnung nicht auf. Die Migration übernimmt alte
Freitextangaben nur bei eindeutigem Treffer (Name, E-Mail oder Benutzer-ID). Uneindeutige Angaben
bleiben als Altangabe sichtbar und können manuell zugeordnet werden. Bereits deaktivierte
Zuordnungen bleiben beim Bearbeiten erhalten, sind aber für neue Zuordnungen nicht auswählbar.

- Kommentare und Statusänderungen durch das AI-Team benachrichtigen den Einreicher.
- Neue Einreichungen und Antworten des Einreichers benachrichtigen zugeordnete bzw. bereits
  beteiligte Champions/Core-Team-Mitglieder. Die Champion-Zuordnung erfolgt über das ausgewählte
  Benutzerkonto. Ohne aktive Zuordnung oder
  Beteiligte werden aktive Champions desselben Bereichs benachrichtigt, ersatzweise alle aktiven Champions.
- Benachrichtigungen enthalten einen Link zum Vorgang, keine Kommentartexte oder Problembeschreibungen.
  Bei abgelaufener Mitarbeitersitzung wird ein frischer E-Mail-Zugangslink angefordert; das Ziel bleibt erhalten.
- Benachrichtigungen werden zusammen mit der Änderung gespeichert und vom Backend alle 30 Sekunden
  versendet. Fehler werden mit zunehmendem Abstand (bis zu einer Stunde) erneut versucht.
  Der Worker ist für den bestehenden Betrieb mit **einer Backend-Instanz** ausgelegt; vor horizontaler
  Skalierung muss eine instanzübergreifende Reservierung der Warteschlangeneinträge ergänzt werden.

Zugangslinks gelten 15 Minuten, sind einmal verwendbar und werden nur als SHA-256-Hash in der
Datenbank gespeichert. Der Browser fordert eine ausdrückliche Bestätigung an, damit E-Mail-Scanner
keine Ideen einreichen. Erneutes Anfordern derselben Idee entwertet den vorherigen Link.
Pro 15 Minuten sind drei Anforderungen je E-Mail und 20 je Client-IP möglich. Beim Einsatz hinter
einem Proxy muss `TRUST_PROXY` zum tatsächlichen Netzwerk passen. Abgelaufene unbestätigte Ideen
werden spätestens beim nächsten Worker-Durchlauf oder einer neuen Linkanforderung entfernt.

E-Mail-Links gewähren ausschließlich Mitarbeiterzugang. Verwaltungskonten und deaktivierte Konten
erhalten darüber keinen Zugang. Die API prüft Besitzerrechte auch für Kommentare, Historie,
Bewertungen, KI-Aktionen sowie Uploads und Downloads; Mitarbeiterstatistiken enthalten nur eigene Ideen.

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
