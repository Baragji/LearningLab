/*
  Warnings:

  - The primary key for the `_UserToGroup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_UserToGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_UserToGroup" DROP CONSTRAINT "_UserToGroup_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_UserToGroup_AB_unique" ON "_UserToGroup"("A", "B");
