/*
  Warnings:

  - Added the required column `assignedBy` to the `UserRoleLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRoleLink" ADD COLUMN     "assignedBy" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
