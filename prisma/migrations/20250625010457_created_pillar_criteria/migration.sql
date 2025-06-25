/*
  Warnings:

  - The values [AUTO,PEER] on the enum `EvaluationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationType_new" AS ENUM ('AUTOEVALUATION', 'PEER_360', 'LEADER');
ALTER TABLE "Evaluation" ALTER COLUMN "type" TYPE "EvaluationType_new" USING ("type"::text::"EvaluationType_new");
ALTER TYPE "EvaluationType" RENAME TO "EvaluationType_old";
ALTER TYPE "EvaluationType_new" RENAME TO "EvaluationType";
DROP TYPE "EvaluationType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Pillar" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" SERIAL NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriteriaAssignment" (
    "autoEvaluationID" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,

    CONSTRAINT "CriteriaAssignment_pkey" PRIMARY KEY ("autoEvaluationID","criterionId")
);

-- CreateIndex
CREATE INDEX "EvaluationTypeIndex" ON "Evaluation"("type");

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssignment" ADD CONSTRAINT "CriteriaAssignment_autoEvaluationID_fkey" FOREIGN KEY ("autoEvaluationID") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaAssignment" ADD CONSTRAINT "CriteriaAssignment_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
