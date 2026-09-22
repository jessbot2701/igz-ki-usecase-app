/*
  Warnings:

  - You are about to drop the column `dataClassification` on the `use_cases` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_use_cases" (
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
    "reach" TEXT,
    "estimatedUsers" INTEGER,
    "usageFrequency" TEXT,
    "benefits" TEXT,
    "benefitTypes" TEXT,
    "estimatedEffect" TEXT,
    "estimatedTimeSavings" TEXT,
    "businessValueNote" TEXT,
    "aiSolutionType" TEXT,
    "aiSolutionOtherText" TEXT,
    "implementationEffort" TEXT,
    "dependencies" TEXT,
    "dataClassifications" TEXT,
    "riskAssessment" TEXT,
    "securityNotes" TEXT,
    "responsible" TEXT,
    "targetDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "use_cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "use_cases_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_use_cases" ("aiChampion", "benefits", "businessValueNote", "createdAt", "createdById", "currentProcess", "dataSources", "department", "dependencies", "estimatedTimeSavings", "estimatedUsers", "expectedOutput", "frequency", "id", "implementationEffort", "lastModifiedById", "painPoints", "problemDescription", "requestor", "riskAssessment", "securityNotes", "solutionIdea", "status", "targetGroup", "title", "updatedAt", "usageFrequency") SELECT "aiChampion", "benefits", "businessValueNote", "createdAt", "createdById", "currentProcess", "dataSources", "department", "dependencies", "estimatedTimeSavings", "estimatedUsers", "expectedOutput", "frequency", "id", "implementationEffort", "lastModifiedById", "painPoints", "problemDescription", "requestor", "riskAssessment", "securityNotes", "solutionIdea", "status", "targetGroup", "title", "updatedAt", "usageFrequency" FROM "use_cases";
DROP TABLE "use_cases";
ALTER TABLE "new_use_cases" RENAME TO "use_cases";
CREATE INDEX "use_cases_status_idx" ON "use_cases"("status");
CREATE INDEX "use_cases_department_idx" ON "use_cases"("department");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
