/*
  Warnings:

  - You are about to drop the column `userId` on the `AutoEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `Justification` on the `Mentoring` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AutoEvaluation" DROP CONSTRAINT "AutoEvaluation_userId_fkey";

-- AlterTable
ALTER TABLE "AutoEvaluation" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Mentoring" DROP COLUMN "Justification",
ADD COLUMN     "justification" TEXT;
