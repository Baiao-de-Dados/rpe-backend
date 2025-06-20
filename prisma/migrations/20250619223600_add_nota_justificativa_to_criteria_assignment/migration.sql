/*
  Warnings:

  - Added the required column `justificativa` to the `CriteriaAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nota` to the `CriteriaAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CriteriaAssignment" ADD COLUMN     "justificativa" TEXT NOT NULL,
ADD COLUMN     "nota" INTEGER NOT NULL;
