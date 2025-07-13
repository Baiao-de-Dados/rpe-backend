/*
  Warnings:

  - Added the required column `managerId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "managerId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "LeaderEvaluation" (
    "id" SERIAL NOT NULL,
    "leaderId" INTEGER NOT NULL,
    "collaboratorId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT,
    "improvements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerEvaluationId" INTEGER NOT NULL,

    CONSTRAINT "LeaderEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerEvaluation" (
    "id" SERIAL NOT NULL,
    "managerId" INTEGER NOT NULL,
    "collaboratorId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT,
    "improvements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderAssignment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "leaderId" INTEGER NOT NULL,

    CONSTRAINT "LeaderAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderAssignment_projectId_leaderId_key" ON "LeaderAssignment"("projectId", "leaderId");

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_managerEvaluationId_fkey" FOREIGN KEY ("managerEvaluationId") REFERENCES "ManagerEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderAssignment" ADD CONSTRAINT "LeaderAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderAssignment" ADD CONSTRAINT "LeaderAssignment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
