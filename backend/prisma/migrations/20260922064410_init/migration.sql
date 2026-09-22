-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "requestor" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "aiChampion" TEXT,
    "problemDescription" TEXT NOT NULL,
    "currentProcess" TEXT,
    "painPoints" TEXT,
    "frequency" TEXT,
    "solutionIdea" TEXT NOT NULL,
    "dataSources" TEXT,
    "expectedOutput" TEXT,
    "targetGroup" TEXT,
    "estimatedUsers" INTEGER,
    "usageFrequency" TEXT,
    "benefits" TEXT,
    "estimatedTimeSavings" TEXT,
    "businessValueNote" TEXT,
    "implementationEffort" TEXT,
    "dependencies" TEXT,
    "dataClassification" TEXT,
    "riskAssessment" TEXT,
    "securityNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "use_cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "use_cases_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "useCaseId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "status_history_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "use_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "useCaseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "use_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "useCaseId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "businessValue" TEXT NOT NULL,
    "feasibility" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "strategicRelevance" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluations_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "use_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "useCaseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "use_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "use_cases_status_idx" ON "use_cases"("status");

-- CreateIndex
CREATE INDEX "use_cases_department_idx" ON "use_cases"("department");

-- CreateIndex
CREATE INDEX "status_history_useCaseId_idx" ON "status_history"("useCaseId");

-- CreateIndex
CREATE INDEX "comments_useCaseId_idx" ON "comments"("useCaseId");

-- CreateIndex
CREATE INDEX "evaluations_useCaseId_idx" ON "evaluations"("useCaseId");

-- CreateIndex
CREATE INDEX "attachments_useCaseId_idx" ON "attachments"("useCaseId");
