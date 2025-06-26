-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_evaluateeId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_evaluatorId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "Okr" DROP CONSTRAINT "Okr_userId_fkey";

-- DropForeignKey
ALTER TABLE "Pdi" DROP CONSTRAINT "Pdi_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_toId_fkey";

-- DropForeignKey
ALTER TABLE "UserRoleLink" DROP CONSTRAINT "UserRoleLink_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserRoleLink" DROP CONSTRAINT "UserRoleLink_userId_fkey";

-- AlterTable
ALTER TABLE "UserRoleLink" ALTER COLUMN "assignedBy" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CycleConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PillarCycleConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarCycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionCycleConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionCycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CycleConfig_name_key" ON "CycleConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PillarCycleConfig_cycleId_pillarId_key" ON "PillarCycleConfig"("cycleId", "pillarId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionCycleConfig_cycleId_criterionId_key" ON "CriterionCycleConfig"("cycleId", "criterionId");

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Okr" ADD CONSTRAINT "Okr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdi" ADD CONSTRAINT "Pdi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarCycleConfig" ADD CONSTRAINT "PillarCycleConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PillarCycleConfig" ADD CONSTRAINT "PillarCycleConfig_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionCycleConfig" ADD CONSTRAINT "CriterionCycleConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionCycleConfig" ADD CONSTRAINT "CriterionCycleConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
