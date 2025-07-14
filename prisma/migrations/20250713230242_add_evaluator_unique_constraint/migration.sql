/*
  Warnings:

  - You are about to drop the column `evaluateeId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[evaluatorId,cycleConfigId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_evaluateeId_fkey";

-- DropIndex
DROP INDEX "Evaluation_evaluateeId_cycleConfigId_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "evaluateeId",
DROP COLUMN "status";

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_evaluatorId_cycleConfigId_key" ON "Evaluation"("evaluatorId", "cycleConfigId");
