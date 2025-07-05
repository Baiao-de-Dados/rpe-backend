/*
  Warnings:

  - You are about to drop the column `justification` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `PillarTrackConfig` table. All the data in the column will be lost.
  - The primary key for the `Reference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `comment` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `fromId` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `CriteriaAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Okr` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pdi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagReference` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pillarId,trackId]` on the table `PillarTrackConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackId` to the `PillarTrackConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evaluationId` to the `Reference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `justification` to the `Reference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentorId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CriteriaAssignment" DROP CONSTRAINT "CriteriaAssignment_autoEvaluationID_fkey";

-- DropForeignKey
ALTER TABLE "CriteriaAssignment" DROP CONSTRAINT "CriteriaAssignment_criterionId_fkey";

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
ALTER TABLE "TagReference" DROP CONSTRAINT "TagReference_referenceId_fkey";

-- DropForeignKey
ALTER TABLE "TagReference" DROP CONSTRAINT "TagReference_tagId_fkey";

-- DropIndex
DROP INDEX "EvaluationTypeIndex";

-- DropIndex
DROP INDEX "PillarTrackConfig_pillarId_track_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "justification",
DROP COLUMN "score",
DROP COLUMN "submittedAt",
DROP COLUMN "type",
ADD COLUMN     "trackId" INTEGER;

-- AlterTable
ALTER TABLE "PillarTrackConfig" DROP COLUMN "track",
ADD COLUMN     "trackId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_pkey",
DROP COLUMN "comment",
DROP COLUMN "fromId",
DROP COLUMN "id",
DROP COLUMN "tags",
DROP COLUMN "toId",
ADD COLUMN     "evaluationId" INTEGER NOT NULL,
ADD COLUMN     "justification" TEXT NOT NULL,
ADD CONSTRAINT "Reference_pkey" PRIMARY KEY ("evaluationId");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "unit",
ADD COLUMN     "mentorId" INTEGER NOT NULL,
ADD COLUMN     "position" TEXT NOT NULL;

-- DropTable
DROP TABLE "CriteriaAssignment";

-- DropTable
DROP TABLE "Feedback";

-- DropTable
DROP TABLE "Okr";

-- DropTable
DROP TABLE "Pdi";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "TagReference";

-- DropEnum
DROP TYPE "EvaluationType";

-- DropEnum
DROP TYPE "FeedbackSource";

-- CreateTable
CREATE TABLE "AutoEvaluation" (
    "evaluationId" INTEGER NOT NULL,

    CONSTRAINT "AutoEvaluation_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "AutoEvaluationAssignment" (
    "evaluationId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,

    CONSTRAINT "AutoEvaluationAssignment_pkey" PRIMARY KEY ("evaluationId","criterionId")
);

-- CreateTable
CREATE TABLE "Evaluation360" (
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "strengths" TEXT,
    "improvements" TEXT,

    CONSTRAINT "Evaluation360_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "Mentoring" (
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "Mentoring_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PillarTrackConfig_pillarId_trackId_key" ON "PillarTrackConfig"("pillarId", "trackId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarTrackConfig" ADD CONSTRAINT "PillarTrackConfig_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluation" ADD CONSTRAINT "AutoEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluationAssignment" ADD CONSTRAINT "AutoEvaluationAssignment_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "AutoEvaluation"("evaluationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluationAssignment" ADD CONSTRAINT "AutoEvaluationAssignment_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation360" ADD CONSTRAINT "Evaluation360_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentoring" ADD CONSTRAINT "Mentoring_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
