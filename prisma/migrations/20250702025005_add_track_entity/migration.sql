/*
  Warnings:

  - You are about to drop the column `track` on the `CriterionTrackConfig` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[criterionId,trackId]` on the table `CriterionTrackConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackId` to the `CriterionTrackConfig` table without a default value. This is not possible if the table is not empty.
  - Made the column `track` on table `PillarTrackConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `track` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CriterionTrackConfig_criterionId_track_key";

-- AlterTable
ALTER TABLE "CriterionTrackConfig" DROP COLUMN "track",
ADD COLUMN     "trackId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PillarTrackConfig" ALTER COLUMN "track" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "position",
ALTER COLUMN "track" SET NOT NULL;

-- CreateTable
CREATE TABLE "Track" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Track_name_key" ON "Track"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackConfig_criterionId_trackId_key" ON "CriterionTrackConfig"("criterionId", "trackId");

-- AddForeignKey
ALTER TABLE "CriterionTrackConfig" ADD CONSTRAINT "CriterionTrackConfig_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
