/*
  Warnings:

  - A unique constraint covering the columns `[leaderId,collaboratorId,cycleId]` on the table `LeaderEvaluation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LeaderEvaluation" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiSummary" TEXT;

-- CreateTable
CREATE TABLE "DateModel" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderEvaluation_leaderId_collaboratorId_cycleId_key" ON "LeaderEvaluation"("leaderId", "collaboratorId", "cycleId");
