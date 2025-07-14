/*
  Warnings:

  - The primary key for the `Reference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[evaluationId,collaboratorId]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Reference_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_evaluationId_collaboratorId_key" ON "Reference"("evaluationId", "collaboratorId");
