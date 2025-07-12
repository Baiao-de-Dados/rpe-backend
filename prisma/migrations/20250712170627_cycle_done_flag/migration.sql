/*
  Warnings:

  - You are about to drop the column `isActive` on the `CycleConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CycleConfig" DROP COLUMN "isActive",
ADD COLUMN     "done" BOOLEAN NOT NULL DEFAULT false;
