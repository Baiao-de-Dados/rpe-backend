/*
  Warnings:

  - A unique constraint covering the columns `[cycleId,criterionId,track,position]` on the table `CriterionCycleConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CriterionCycleConfig_cycleId_criterionId_key";

-- AlterTable
ALTER TABLE "CriterionCycleConfig" ADD COLUMN     "position" TEXT,
ADD COLUMN     "track" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "position" TEXT;

-- CreateTable
CREATE TABLE "PillarAssignmentConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "track" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarAssignmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PillarAssignmentConfig_cycleId_pillarId_track_position_key" ON "PillarAssignmentConfig"("cycleId", "pillarId", "track", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionCycleConfig_cycleId_criterionId_track_position_key" ON "CriterionCycleConfig"("cycleId", "criterionId", "track", "position");

-- AddForeignKey
ALTER TABLE "PillarAssignmentConfig" ADD CONSTRAINT "PillarAssignmentConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarAssignmentConfig" ADD CONSTRAINT "PillarAssignmentConfig_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
