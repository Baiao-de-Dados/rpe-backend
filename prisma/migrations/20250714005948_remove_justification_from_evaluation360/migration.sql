/*
  Warnings:

  - You are about to drop the column `justification` on the `Evaluation360` table. All the data in the column will be lost.
  - Made the column `score` on table `Evaluation360` required. This step will fail if there are existing NULL values in that column.
  - Made the column `strengths` on table `Evaluation360` required. This step will fail if there are existing NULL values in that column.
  - Made the column `improvements` on table `Evaluation360` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Evaluation360" DROP COLUMN "justification",
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "strengths" SET NOT NULL,
ALTER COLUMN "improvements" SET NOT NULL;
