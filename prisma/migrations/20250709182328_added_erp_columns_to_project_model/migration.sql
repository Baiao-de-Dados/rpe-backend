/*
  Warnings:

  - Added the required column `role` to the `ProjectMember` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_mentorId_fkey";

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "role" "UserRole" NOT NULL,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "mentorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
