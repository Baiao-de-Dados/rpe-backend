/*
  Warnings:

  - You are about to drop the column `name` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `User` table. All the data in the column will be lost.
  - Added the required column `trackId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Track_name_key";

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "track",
ADD COLUMN     "trackId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
