/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `EvaluationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "Evaluation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Evaluation" ALTER COLUMN "status" TYPE "EvaluationStatus_new" USING ("status"::text::"EvaluationStatus_new");
ALTER TYPE "EvaluationStatus" RENAME TO "EvaluationStatus_old";
ALTER TYPE "EvaluationStatus_new" RENAME TO "EvaluationStatus";
DROP TYPE "EvaluationStatus_old";
ALTER TABLE "Evaluation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "mentorId" DROP DEFAULT,
ALTER COLUMN "position" DROP DEFAULT;
