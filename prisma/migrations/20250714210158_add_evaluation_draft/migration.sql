-- AlterTable
ALTER TABLE "CycleConfig" ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reference" ALTER COLUMN "justification" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EvaluationDraft" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "draft" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationDraft_pkey" PRIMARY KEY ("id")
);
