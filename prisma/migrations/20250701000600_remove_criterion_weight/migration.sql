/*
  Warnings:

  - You are about to drop the column `weight` on the `Criterion` table. All the data in the column will be lost.
  - You are about to alter the column `weight` on the `CriterionCycleConfig` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `weight` on the `CriterionTrackConfig` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `weight` on the `PillarCycleConfig` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Criterion" DROP COLUMN "weight";

-- AlterTable
ALTER TABLE "CriterionCycleConfig" ALTER COLUMN "weight" SET DEFAULT 1,
ALTER COLUMN "weight" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "CriterionTrackConfig" ALTER COLUMN "weight" SET DEFAULT 1,
ALTER COLUMN "weight" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "PillarCycleConfig" ALTER COLUMN "weight" SET DEFAULT 1,
ALTER COLUMN "weight" SET DATA TYPE INTEGER;
