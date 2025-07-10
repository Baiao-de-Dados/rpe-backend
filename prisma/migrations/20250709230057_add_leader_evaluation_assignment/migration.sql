-- CreateTable
CREATE TABLE "LeaderEvaluationAssignment" (
    "id" SERIAL NOT NULL,
    "leaderId" INTEGER NOT NULL,
    "collaboratorId" INTEGER NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderEvaluationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderEvaluationAssignment_collaboratorId_cycleId_key" ON "LeaderEvaluationAssignment"("collaboratorId", "cycleId");

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluationAssignment" ADD CONSTRAINT "LeaderEvaluationAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
