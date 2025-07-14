/*
  Warnings:

  - The primary key for the `Evaluation360` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[evaluationId,evaluatedId]` on the table `Evaluation360` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Evaluation360" DROP CONSTRAINT "Evaluation360_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Evaluation360_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation360_evaluationId_evaluatedId_key" ON "Evaluation360"("evaluationId", "evaluatedId");
