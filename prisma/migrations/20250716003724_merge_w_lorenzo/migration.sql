/*
  Warnings:

  - You are about to drop the column `evaluationId` on the `Equalization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[collaboratorId,cycleId]` on the table `Equalization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cycleId` to the `Equalization` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Equalization" DROP CONSTRAINT "Equalization_collaboratorId_fkey";

-- DropForeignKey
ALTER TABLE "Equalization" DROP CONSTRAINT "Equalization_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "ManagerEvaluationCriteria" DROP CONSTRAINT "ManagerEvaluationCriteria_managerEvaluationId_fkey";

-- DropIndex
DROP INDEX "Equalization_evaluationId_key";

-- AlterTable
ALTER TABLE "Equalization" DROP COLUMN "evaluationId",
ADD COLUMN     "cycleId" INTEGER NOT NULL,
ALTER COLUMN "score" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Equalization_collaboratorId_cycleId_key" ON "Equalization"("collaboratorId", "cycleId");

-- AddForeignKey
ALTER TABLE "ManagerEvaluationCriteria" ADD CONSTRAINT "ManagerEvaluationCriteria_managerEvaluationId_fkey" FOREIGN KEY ("managerEvaluationId") REFERENCES "ManagerEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equalization" ADD CONSTRAINT "Equalization_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equalization" ADD CONSTRAINT "Equalization_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
