/*
  Warnings:

  - A unique constraint covering the columns `[evaluationId]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reference" ADD COLUMN     "evaluationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Reference_evaluationId_key" ON "Reference"("evaluationId");

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
