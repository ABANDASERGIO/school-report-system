-- AlterTable
ALTER TABLE "Result" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Result_idempotencyKey_key" ON "Result"("idempotencyKey");
