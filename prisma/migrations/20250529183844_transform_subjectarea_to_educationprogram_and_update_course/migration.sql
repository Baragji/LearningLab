/*
  Warnings:

  - You are about to drop the column `subjectAreaId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `SubjectArea` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `educationProgramId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_subjectAreaId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectArea" DROP CONSTRAINT "SubjectArea_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "SubjectArea" DROP CONSTRAINT "SubjectArea_updatedBy_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "subjectAreaId",
ADD COLUMN     "educationProgramId" INTEGER NOT NULL,
ADD COLUMN     "semesterNumber" INTEGER;

-- DropTable
DROP TABLE "SubjectArea";

-- CreateTable
CREATE TABLE "EducationProgram" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "EducationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationProgram_slug_key" ON "EducationProgram"("slug");

-- AddForeignKey
ALTER TABLE "EducationProgram" ADD CONSTRAINT "EducationProgram_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationProgram" ADD CONSTRAINT "EducationProgram_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_educationProgramId_fkey" FOREIGN KEY ("educationProgramId") REFERENCES "EducationProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
