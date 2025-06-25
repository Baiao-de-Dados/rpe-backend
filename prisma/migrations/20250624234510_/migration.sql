/*
  Warnings:

  - You are about to drop the column `grade` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `cycle` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `evaluatedId` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `evaluationId` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `evaluatorId` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the column `justification` on the `Reference` table. All the data in the column will be lost.
  - You are about to drop the `AutoEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CriteriaAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Criterion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evaluation360` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mentoring` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pillar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagReference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `evaluateeId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evaluatorId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `justification` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `cycle` on the `Evaluation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `comment` to the `Reference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromId` to the `Reference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toId` to the `Reference` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('AUTO', 'PEER', 'LEADER');

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('TEXT', 'AUDIO_TRANSCRIBED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COLLABORATOR', 'RH', 'MANAGER', 'COMMITTEE', 'ADMIN', 'DEVELOPER');

-- DropForeignKey
ALTER TABLE "AutoEvaluation" DROP CONSTRAINT "AutoEvaluation_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "CriteriaAssignment" DROP CONSTRAINT "CriteriaAssignment_autoEvaluationId_fkey";

-- DropForeignKey
ALTER TABLE "CriteriaAssignment" DROP CONSTRAINT "CriteriaAssignment_criterionId_fkey";

-- DropForeignKey
ALTER TABLE "Criterion" DROP CONSTRAINT "Criterion_pillarId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation360" DROP CONSTRAINT "Evaluation360_evaluatedId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation360" DROP CONSTRAINT "Evaluation360_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation360" DROP CONSTRAINT "Evaluation360_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "Mentoring" DROP CONSTRAINT "Mentoring_evaluatedId_fkey";

-- DropForeignKey
ALTER TABLE "Mentoring" DROP CONSTRAINT "Mentoring_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "Mentoring" DROP CONSTRAINT "Mentoring_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_evaluatedId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "TagReference" DROP CONSTRAINT "TagReference_referenceId_fkey";

-- DropForeignKey
ALTER TABLE "TagReference" DROP CONSTRAINT "TagReference_tagId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropIndex
DROP INDEX "Reference_evaluationId_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "grade",
DROP COLUMN "userId",
ADD COLUMN     "evaluateeId" INTEGER NOT NULL,
ADD COLUMN     "evaluatorId" INTEGER NOT NULL,
ADD COLUMN     "justification" TEXT NOT NULL,
ADD COLUMN     "score" INTEGER NOT NULL,
ADD COLUMN     "type" "EvaluationType" NOT NULL,
DROP COLUMN "cycle",
ADD COLUMN     "cycle" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reference" DROP COLUMN "cycle",
DROP COLUMN "evaluatedId",
DROP COLUMN "evaluationId",
DROP COLUMN "evaluatorId",
DROP COLUMN "justification",
ADD COLUMN     "comment" TEXT NOT NULL,
ADD COLUMN     "fromId" INTEGER NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "toId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "AutoEvaluation";

-- DropTable
DROP TABLE "CriteriaAssignment";

-- DropTable
DROP TABLE "Criterion";

-- DropTable
DROP TABLE "Evaluation360";

-- DropTable
DROP TABLE "Mentoring";

-- DropTable
DROP TABLE "Pillar";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "TagReference";

-- DropTable
DROP TABLE "user_roles";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "UserRoleEnum";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "unit" TEXT,
    "track" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "sourceType" "FeedbackSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Okr" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "objective" TEXT NOT NULL,
    "keyResults" TEXT[],
    "progress" DOUBLE PRECISION NOT NULL,
    "cycle" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Okr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pdi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pdi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Okr" ADD CONSTRAINT "Okr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdi" ADD CONSTRAINT "Pdi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
