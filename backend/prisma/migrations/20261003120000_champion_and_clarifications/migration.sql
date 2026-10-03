ALTER TABLE "use_cases" ADD COLUMN "aiChampionId" TEXT REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "use_cases" ADD COLUMN "clarificationRequestedAt" DATETIME;
ALTER TABLE "use_cases" ADD COLUMN "clarificationAnsweredAt" DATETIME;
CREATE INDEX "use_cases_aiChampionId_idx" ON "use_cases"("aiChampionId");

-- Keep the old label; only map unambiguous matches to actual champions.
UPDATE "use_cases"
SET "aiChampionId" = (
  SELECT "users"."id" FROM "users"
  WHERE "users"."role" = 'AI_CHAMPION'
    AND (lower(trim("use_cases"."aiChampion")) = lower("users"."id")
      OR lower(trim("use_cases"."aiChampion")) = lower("users"."email")
      OR lower(trim("use_cases"."aiChampion")) = lower("users"."name"))
)
WHERE (SELECT count(*) FROM "users"
  WHERE "users"."role" = 'AI_CHAMPION'
    AND (lower(trim("use_cases"."aiChampion")) = lower("users"."id")
      OR lower(trim("use_cases"."aiChampion")) = lower("users"."email")
      OR lower(trim("use_cases"."aiChampion")) = lower("users"."name"))) = 1;

UPDATE "use_cases"
SET "clarificationRequestedAt" = (
  SELECT max("changedAt") FROM "status_history"
  WHERE "useCaseId" = "use_cases"."id" AND "toStatus" = 'NEED_MORE_INFO'
)
WHERE "status" = 'NEED_MORE_INFO';

UPDATE "use_cases"
SET "clarificationAnsweredAt" = (
  SELECT max("createdAt") FROM "comments"
  WHERE "useCaseId" = "use_cases"."id" AND "authorId" = "use_cases"."createdById"
    AND "createdAt" >= "use_cases"."clarificationRequestedAt"
)
WHERE "status" = 'NEED_MORE_INFO' AND "clarificationRequestedAt" IS NOT NULL;
