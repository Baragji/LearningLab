-- AlterTable
ALTER TABLE "_UserToUserGroup" ADD CONSTRAINT "_UserToUserGroup_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserToUserGroup_AB_unique";
