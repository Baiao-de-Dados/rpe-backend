/*
  Warnings:

  - You are about to drop the column `managerEvaluationId` on the `LeaderEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `improvements` on the `ManagerEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `justification` on the `ManagerEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `ManagerEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `ManagerEvaluation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LeaderEvaluation" DROP CONSTRAINT "LeaderEvaluation_managerEvaluationId_fkey";

-- AlterTable
ALTER TABLE "LeaderEvaluation" DROP COLUMN "managerEvaluationId";

-- AlterTable
ALTER TABLE "ManagerEvaluation" DROP COLUMN "improvements",
DROP COLUMN "justification",
DROP COLUMN "score",
DROP COLUMN "strengths";

-- CreateTable
CREATE TABLE "ManagerEvaluationCriteria" (
    "id" SERIAL NOT NULL,
    "managerEvaluationId" INTEGER NOT NULL,
    "criteriaId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,

    CONSTRAINT "ManagerEvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluation" ADD CONSTRAINT "ManagerEvaluation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluationCriteria" ADD CONSTRAINT "ManagerEvaluationCriteria_managerEvaluationId_fkey" FOREIGN KEY ("managerEvaluationId") REFERENCES "ManagerEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerEvaluationCriteria" ADD CONSTRAINT "ManagerEvaluationCriteria_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
