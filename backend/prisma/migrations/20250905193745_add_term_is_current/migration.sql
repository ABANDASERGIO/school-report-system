-- AlterTable
ALTER TABLE "Term" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Term_sessionId_isCurrent_idx" ON "Term"("sessionId", "isCurrent");
