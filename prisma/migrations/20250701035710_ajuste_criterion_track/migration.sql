/*
  Warnings:

  - You are about to drop the column `position` on the `CriterionTrackConfig` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `PillarTrackConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Criterion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[criterionId,track]` on the table `CriterionTrackConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Pillar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pillarId,track]` on the table `PillarTrackConfig` will be added. If there are existing duplicate values, this will fail.
  - Made the column `track` on table `CriterionTrackConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CriterionTrackConfig_criterionId_track_position_key";

-- DropIndex
DROP INDEX "PillarTrackConfig_pillarId_track_position_key";

-- AlterTable
ALTER TABLE "CriterionTrackConfig" DROP COLUMN "position",
ALTER COLUMN "track" SET NOT NULL;

-- AlterTable
ALTER TABLE "PillarTrackConfig" DROP COLUMN "position";

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_name_key" ON "Criterion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackConfig_criterionId_track_key" ON "CriterionTrackConfig"("criterionId", "track");

-- CreateIndex
CREATE UNIQUE INDEX "Pillar_name_key" ON "Pillar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PillarTrackConfig_pillarId_track_key" ON "PillarTrackConfig"("pillarId", "track");
