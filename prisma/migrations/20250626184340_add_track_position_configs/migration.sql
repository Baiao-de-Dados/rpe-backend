/*
  Warnings:

  - You are about to drop the column `position` on the `CriterionCycleConfig` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `CriterionCycleConfig` table. All the data in the column will be lost.
  - You are about to drop the `PillarAssignmentConfig` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cycleId,criterionId]` on the table `CriterionCycleConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PillarAssignmentConfig" DROP CONSTRAINT "PillarAssignmentConfig_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "PillarAssignmentConfig" DROP CONSTRAINT "PillarAssignmentConfig_pillarId_fkey";

-- DropIndex
DROP INDEX "CriterionCycleConfig_cycleId_criterionId_track_position_key";

-- AlterTable
ALTER TABLE "CriterionCycleConfig" DROP COLUMN "position",
DROP COLUMN "track";

-- DropTable
DROP TABLE "PillarAssignmentConfig";

-- CreateTable
CREATE TABLE "PillarTrackConfig" (
    "id" SERIAL NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "track" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarTrackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionTrackConfig" (
    "id" SERIAL NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "track" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionTrackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PillarTrackConfig_pillarId_track_position_key" ON "PillarTrackConfig"("pillarId", "track", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackConfig_criterionId_track_position_key" ON "CriterionTrackConfig"("criterionId", "track", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionCycleConfig_cycleId_criterionId_key" ON "CriterionCycleConfig"("cycleId", "criterionId");

-- AddForeignKey
ALTER TABLE "PillarTrackConfig" ADD CONSTRAINT "PillarTrackConfig_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackConfig" ADD CONSTRAINT "CriterionTrackConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
