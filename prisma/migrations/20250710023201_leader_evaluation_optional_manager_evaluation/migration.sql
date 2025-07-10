-- DropForeignKey
ALTER TABLE "LeaderEvaluation" DROP CONSTRAINT "LeaderEvaluation_managerEvaluationId_fkey";

-- AlterTable
ALTER TABLE "LeaderEvaluation" ALTER COLUMN "managerEvaluationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_managerEvaluationId_fkey" FOREIGN KEY ("managerEvaluationId") REFERENCES "ManagerEvaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
