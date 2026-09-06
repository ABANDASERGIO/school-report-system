-- AlterTable
ALTER TABLE "Term" ADD COLUMN IF NOT EXISTS "isCurrent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Term_sessionId_isCurrent_idx" ON "Term"("sessionId", "isCurrent");
