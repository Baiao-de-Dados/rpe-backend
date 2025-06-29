/*
  Warnings:

  - The values [LEADER] on the enum `EvaluationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cycle` on the `Evaluation` table. All the data in the column will be lost.
  - Added the required column `cycleConfigId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationType_new" AS ENUM ('AUTOEVALUATION', 'PEER_360', 'MENTOR');
ALTER TABLE "Evaluation" ALTER COLUMN "type" TYPE "EvaluationType_new" USING ("type"::text::"EvaluationType_new");
ALTER TYPE "EvaluationType" RENAME TO "EvaluationType_old";
ALTER TYPE "EvaluationType_new" RENAME TO "EvaluationType";
DROP TYPE "EvaluationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ProjectRole" ADD VALUE 'BUSINESSMAN';

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_evaluateeId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "Okr" DROP CONSTRAINT "Okr_userId_fkey";

-- DropForeignKey
ALTER TABLE "Pdi" DROP CONSTRAINT "Pdi_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_toId_fkey";

-- DropForeignKey
ALTER TABLE "UserRoleLink" DROP CONSTRAINT "UserRoleLink_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserRoleLink" DROP CONSTRAINT "UserRoleLink_userId_fkey";

-- DropIndex
DROP INDEX "ProjectMember_projectId_userId_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "cycle",
ADD COLUMN     "cycleConfigId" INTEGER NOT NULL,
ADD COLUMN     "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "position" TEXT,
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserRoleLink" ALTER COLUMN "assignedBy" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagReference" (
    "tagId" INTEGER NOT NULL,
    "referenceId" INTEGER NOT NULL,

    CONSTRAINT "TagReference_pkey" PRIMARY KEY ("tagId","referenceId")
);

-- CreateTable
CREATE TABLE "CycleConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PillarCycleConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarCycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionCycleConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionCycleConfig_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "CycleConfig_name_key" ON "CycleConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PillarCycleConfig_cycleId_pillarId_key" ON "PillarCycleConfig"("cycleId", "pillarId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionCycleConfig_cycleId_criterionId_key" ON "CriterionCycleConfig"("cycleId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "PillarTrackConfig_pillarId_track_position_key" ON "PillarTrackConfig"("pillarId", "track", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackConfig_criterionId_track_position_key" ON "CriterionTrackConfig"("criterionId", "track", "position");

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_cycleConfigId_fkey" FOREIGN KEY ("cycleConfigId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagReference" ADD CONSTRAINT "TagReference_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagReference" ADD CONSTRAINT "TagReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Okr" ADD CONSTRAINT "Okr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdi" ADD CONSTRAINT "Pdi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarCycleConfig" ADD CONSTRAINT "PillarCycleConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarCycleConfig" ADD CONSTRAINT "PillarCycleConfig_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionCycleConfig" ADD CONSTRAINT "CriterionCycleConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionCycleConfig" ADD CONSTRAINT "CriterionCycleConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarTrackConfig" ADD CONSTRAINT "PillarTrackConfig_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackConfig" ADD CONSTRAINT "CriterionTrackConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
