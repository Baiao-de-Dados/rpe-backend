/*
  Warnings:

  - You are about to drop the column `period` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[evaluatedId,cycle]` on the table `Mentoring` will be added. If there are existing duplicate values, this will fail.
  - Made the column `justification` on table `AutoEvaluation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cycle` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Made the column `grade` on table `Evaluation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `strengths` on table `Evaluation360` required. This step will fail if there are existing NULL values in that column.
  - Made the column `improvements` on table `Evaluation360` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cycle` to the `Mentoring` table without a default value. This is not possible if the table is not empty.
  - Made the column `justification` on table `Mentoring` required. This step will fail if there are existing NULL values in that column.
  - Made the column `justification` on table `Reference` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cycle` to the `Reference` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('EMPLOYER', 'MANAGER', 'LEADER', 'MENTOR', 'RH', 'COMMITTEE', 'ADMIN', 'DEVELOPER');

-- AlterTable
ALTER TABLE "AutoEvaluation" ALTER COLUMN "justification" SET NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "period",
ADD COLUMN     "cycle" TEXT NOT NULL,
ALTER COLUMN "grade" SET NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation360" ALTER COLUMN "strengths" SET NOT NULL,
ALTER COLUMN "improvements" SET NOT NULL;

-- AlterTable
ALTER TABLE "Mentoring" ADD COLUMN     "cycle" TEXT NOT NULL,
ALTER COLUMN "justification" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reference" ALTER COLUMN "justification" SET NOT NULL,
DROP COLUMN "cycle",
ADD COLUMN     "cycle" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleType" "UserRoleEnum" NOT NULL DEFAULT 'EMPLOYER';

-- CreateIndex
CREATE UNIQUE INDEX "Mentoring_evaluatedId_cycle_key" ON "Mentoring"("evaluatedId", "cycle");
