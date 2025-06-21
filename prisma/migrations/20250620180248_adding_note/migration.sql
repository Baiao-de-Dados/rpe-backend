/*
  Warnings:

  - You are about to drop the column `justificativa` on the `CriteriaAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `nota` on the `CriteriaAssignment` table. All the data in the column will be lost.
  - Added the required column `justification` to the `CriteriaAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `note` to the `CriteriaAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CriteriaAssignment" DROP COLUMN "justificativa",
DROP COLUMN "nota",
ADD COLUMN     "justification" TEXT NOT NULL,
ADD COLUMN     "note" INTEGER NOT NULL;
