-- Add nullable class promotion destination without changing existing class rows.
ALTER TABLE "Class"
ADD COLUMN "nextClassId" TEXT;

-- Existing terms default to not-current until selected in the application.
ALTER TABLE "Term"
ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;

-- Match the Prisma ClassPromotion relation and preserve referenced classes on delete.
ALTER TABLE "Class"
ADD CONSTRAINT "Class_nextClassId_fkey"
FOREIGN KEY ("nextClassId") REFERENCES "Class"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Match @@index([sessionId, isCurrent]) in the Prisma schema.
CREATE INDEX "Term_sessionId_isCurrent_idx"
ON "Term"("sessionId", "isCurrent");
