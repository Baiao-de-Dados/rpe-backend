/*
  Warnings:

  - Added the required column `evaluatedId` to the `Evaluation360` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentorId` to the `Mentoring` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collaboratorId` to the `Reference` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation360" ADD COLUMN     "evaluatedId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Mentoring" ADD COLUMN     "mentorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reference" ADD COLUMN     "collaboratorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Evaluation360" ADD CONSTRAINT "Evaluation360_evaluatedId_fkey" FOREIGN KEY ("evaluatedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentoring" ADD CONSTRAINT "Mentoring_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
