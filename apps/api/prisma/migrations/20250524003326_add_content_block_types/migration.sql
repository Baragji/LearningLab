-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentBlockType" ADD VALUE 'CODE';
ALTER TYPE "ContentBlockType" ADD VALUE 'FILE';
ALTER TYPE "ContentBlockType" ADD VALUE 'EMBED';
ALTER TYPE "ContentBlockType" ADD VALUE 'INTERACTIVE';

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "maxAttempts" INTEGER,
ADD COLUMN     "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAnswers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timeLimit" INTEGER;
