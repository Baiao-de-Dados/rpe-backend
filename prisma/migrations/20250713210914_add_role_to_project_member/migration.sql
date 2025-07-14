/*
  Warnings:

  - You are about to drop the column `timeSpent` on the `ProjectMember` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[evaluateeId,cycleConfigId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "LeaderAssignment" DROP CONSTRAINT "LeaderAssignment_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "LeaderAssignment" DROP CONSTRAINT "LeaderAssignment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "LeaderEvaluationAssignment" DROP CONSTRAINT "LeaderEvaluationAssignment_collaboratorId_fkey";

-- DropForeignKey
ALTER TABLE "LeaderEvaluationAssignment" DROP CONSTRAINT "LeaderEvaluationAssignment_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "LeaderEvaluationAssignment" DROP CONSTRAINT "LeaderEvaluationAssignment_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "ManagerEvaluation" DROP CONSTRAINT "ManagerEvaluation_collaboratorId_fkey";

-- DropForeignKey
ALTER TABLE "ManagerEvaluation" DROP CONSTRAINT "ManagerEvaluation_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "ManagerEvaluation" DROP CONSTRAINT "ManagerEvaluation_managerId_fkey";

-- DropIndex
DROP INDEX "ProjectMember_projectId_userId_key";

-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "timeSpent";

-- CreateTable
CREATE TABLE "Equalization" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_evaluateeId_cycleConfigId_key" ON "Evaluation"("evaluateeId", "cycleConfigId");

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equalization" ADD CONSTRAINT "Equalization_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderAssignment" ADD CONSTRAINT "LeaderAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderAssignment" ADD CONSTRAINT "LeaderAssignment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
