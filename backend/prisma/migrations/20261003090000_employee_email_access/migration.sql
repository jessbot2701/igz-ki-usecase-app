CREATE TABLE "email_login_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "ideaJson" TEXT,
    "targetId" TEXT,
    "requestIpHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);
CREATE UNIQUE INDEX "email_login_tokens_tokenHash_key" ON "email_login_tokens"("tokenHash");
CREATE INDEX "email_login_tokens_email_createdAt_idx" ON "email_login_tokens"("email", "createdAt");
CREATE INDEX "email_login_tokens_requestIpHash_createdAt_idx" ON "email_login_tokens"("requestIpHash", "createdAt");
CREATE INDEX "email_login_tokens_expiresAt_idx" ON "email_login_tokens"("expiresAt");

CREATE TABLE "email_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_notifications_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "use_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "email_notifications_sentAt_nextAttemptAt_idx" ON "email_notifications"("sentAt", "nextAttemptAt");
