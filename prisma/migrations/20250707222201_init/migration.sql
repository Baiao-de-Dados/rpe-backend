-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYER', 'LEADER', 'MENTOR', 'MANAGER', 'RH', 'COMMITTEE', 'DEVELOPER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogged" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleLink" (
    "userId" INTEGER NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,

    CONSTRAINT "UserRoleLink_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "Pillar" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" SERIAL NOT NULL,
    "pillarId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Track" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionTrackConfig" (
    "id" SERIAL NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionTrackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionTrackCycleConfig" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionTrackCycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "evaluateeId" INTEGER NOT NULL,
    "cycleConfigId" INTEGER NOT NULL,
    "trackId" INTEGER,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoEvaluation" (
    "evaluationId" INTEGER NOT NULL,

    CONSTRAINT "AutoEvaluation_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "AutoEvaluationAssignment" (
    "evaluationId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,

    CONSTRAINT "AutoEvaluationAssignment_pkey" PRIMARY KEY ("evaluationId","criterionId")
);

-- CreateTable
CREATE TABLE "Evaluation360" (
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "strengths" TEXT,
    "improvements" TEXT,

    CONSTRAINT "Evaluation360_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "Mentoring" (
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "Mentoring_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "Reference" (
    "evaluationId" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("evaluationId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pillar_name_key" ON "Pillar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_name_key" ON "Criterion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CycleConfig_name_key" ON "CycleConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Track_name_key" ON "Track"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackConfig_criterionId_trackId_key" ON "CriterionTrackConfig"("criterionId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionTrackCycleConfig_cycleId_trackId_criterionId_key" ON "CriterionTrackCycleConfig"("cycleId", "trackId", "criterionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackConfig" ADD CONSTRAINT "CriterionTrackConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackConfig" ADD CONSTRAINT "CriterionTrackConfig_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackCycleConfig" ADD CONSTRAINT "CriterionTrackCycleConfig_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackCycleConfig" ADD CONSTRAINT "CriterionTrackCycleConfig_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionTrackCycleConfig" ADD CONSTRAINT "CriterionTrackCycleConfig_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_cycleConfigId_fkey" FOREIGN KEY ("cycleConfigId") REFERENCES "CycleConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluation" ADD CONSTRAINT "AutoEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluationAssignment" ADD CONSTRAINT "AutoEvaluationAssignment_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "AutoEvaluation"("evaluationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoEvaluationAssignment" ADD CONSTRAINT "AutoEvaluationAssignment_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation360" ADD CONSTRAINT "Evaluation360_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentoring" ADD CONSTRAINT "Mentoring_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
