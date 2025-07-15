/*
  Warnings:

  - A unique constraint covering the columns `[evaluationId]` on the table `Equalization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collaboratorId` to the `Equalization` table without a default value. This is not possible if the table is not empty.
  - Made the column `score` on table `Equalization` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Equalization" DROP CONSTRAINT "Equalization_evaluationId_fkey";

-- AlterTable
ALTER TABLE "Equalization" ADD COLUMN     "collaboratorId" INTEGER NOT NULL,
ALTER COLUMN "score" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Equalization_evaluationId_key" ON "Equalization"("evaluationId");

-- AddForeignKey
ALTER TABLE "Equalization" ADD CONSTRAINT "Equalization_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equalization" ADD CONSTRAINT "Equalization_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationDraft" ADD CONSTRAINT "EvaluationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
