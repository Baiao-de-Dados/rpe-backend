/*
  Warnings:

  - You are about to drop the column `evaluatedId` on the `Evaluation360` table. All the data in the column will be lost.
  - You are about to drop the column `mentorId` on the `Mentoring` table. All the data in the column will be lost.
  - You are about to drop the column `collaboratorId` on the `Reference` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Evaluation360" DROP CONSTRAINT "Evaluation360_evaluatedId_fkey";

-- DropForeignKey
ALTER TABLE "Mentoring" DROP CONSTRAINT "Mentoring_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_collaboratorId_fkey";

-- AlterTable
ALTER TABLE "Evaluation360" DROP COLUMN "evaluatedId";

-- AlterTable
ALTER TABLE "Mentoring" DROP COLUMN "mentorId";

-- AlterTable
ALTER TABLE "Reference" DROP COLUMN "collaboratorId";
