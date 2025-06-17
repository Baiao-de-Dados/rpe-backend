/*
  Warnings:

  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Committee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Developer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Leader` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Manager` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RH` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- DropForeignKey
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Developer" DROP CONSTRAINT "Developer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Employer" DROP CONSTRAINT "Employer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Leader" DROP CONSTRAINT "Leader_userId_fkey";

-- DropForeignKey
ALTER TABLE "Manager" DROP CONSTRAINT "Manager_userId_fkey";

-- DropForeignKey
ALTER TABLE "RH" DROP CONSTRAINT "RH_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "password",
DROP COLUMN "role",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Committee";

-- DropTable
DROP TABLE "Developer";

-- DropTable
DROP TABLE "Employer";

-- DropTable
DROP TABLE "Leader";

-- DropTable
DROP TABLE "Manager";

-- DropTable
DROP TABLE "RH";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
