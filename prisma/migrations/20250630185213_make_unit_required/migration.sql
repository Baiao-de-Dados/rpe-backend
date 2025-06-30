/*
  Warnings:

  - Made the column `unit` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `track` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `position` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" 
  ALTER COLUMN "unit"     SET NOT NULL,
  ALTER COLUMN "track"    SET NOT NULL,
  ALTER COLUMN "position" SET NOT NULL;
