-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "fileId" INTEGER;

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_uploadedBy_idx" ON "File"("uploadedBy");

-- CreateIndex
CREATE INDEX "File_mimeType_idx" ON "File"("mimeType");

-- CreateIndex
CREATE INDEX "File_filename_idx" ON "File"("filename");

-- CreateIndex
CREATE INDEX "AnswerOption_questionId_idx" ON "AnswerOption"("questionId");

-- CreateIndex
CREATE INDEX "AnswerOption_isCorrect_idx" ON "AnswerOption"("isCorrect");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_quizId_idx" ON "Certificate"("quizId");

-- CreateIndex
CREATE INDEX "Certificate_issueDate_idx" ON "Certificate"("issueDate");

-- CreateIndex
CREATE INDEX "Certificate_certificateId_idx" ON "Certificate"("certificateId");

-- CreateIndex
CREATE INDEX "ContentBlock_lessonId_idx" ON "ContentBlock"("lessonId");

-- CreateIndex
CREATE INDEX "ContentBlock_type_idx" ON "ContentBlock"("type");

-- CreateIndex
CREATE INDEX "ContentBlock_order_idx" ON "ContentBlock"("order");

-- CreateIndex
CREATE INDEX "ContentBlock_fileId_idx" ON "ContentBlock"("fileId");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "Course_slug_idx" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_educationProgramId_idx" ON "Course"("educationProgramId");

-- CreateIndex
CREATE INDEX "Course_difficulty_idx" ON "Course"("difficulty");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "EducationProgram_name_idx" ON "EducationProgram"("name");

-- CreateIndex
CREATE INDEX "Lesson_topicId_idx" ON "Lesson"("topicId");

-- CreateIndex
CREATE INDEX "Lesson_title_idx" ON "Lesson"("title");

-- CreateIndex
CREATE INDEX "Lesson_order_idx" ON "Lesson"("order");

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- CreateIndex
CREATE INDEX "Question_type_idx" ON "Question"("type");

-- CreateIndex
CREATE INDEX "Question_deletedAt_idx" ON "Question"("deletedAt");

-- CreateIndex
CREATE INDEX "QuestionBank_name_idx" ON "QuestionBank"("name");

-- CreateIndex
CREATE INDEX "QuestionBank_category_idx" ON "QuestionBank"("category");

-- CreateIndex
CREATE INDEX "QuestionBank_deletedAt_idx" ON "QuestionBank"("deletedAt");

-- CreateIndex
CREATE INDEX "QuestionBankItem_questionBankId_idx" ON "QuestionBankItem"("questionBankId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_type_idx" ON "QuestionBankItem"("type");

-- CreateIndex
CREATE INDEX "QuestionBankItem_difficulty_idx" ON "QuestionBankItem"("difficulty");

-- CreateIndex
CREATE INDEX "QuestionBankItem_deletedAt_idx" ON "QuestionBankItem"("deletedAt");

-- CreateIndex
CREATE INDEX "Quiz_lessonId_idx" ON "Quiz"("lessonId");

-- CreateIndex
CREATE INDEX "Quiz_topicId_idx" ON "Quiz"("topicId");

-- CreateIndex
CREATE INDEX "Quiz_title_idx" ON "Quiz"("title");

-- CreateIndex
CREATE INDEX "Quiz_questionBankCategory_idx" ON "Quiz"("questionBankCategory");

-- CreateIndex
CREATE INDEX "Quiz_createdAt_idx" ON "Quiz"("createdAt");

-- CreateIndex
CREATE INDEX "Quiz_deletedAt_idx" ON "Quiz"("deletedAt");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_idx" ON "QuizAttempt"("userId", "quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_completedAt_idx" ON "QuizAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "QuizAttempt_score_idx" ON "QuizAttempt"("score");

-- CreateIndex
CREATE INDEX "Topic_courseId_idx" ON "Topic"("courseId");

-- CreateIndex
CREATE INDEX "Topic_title_idx" ON "Topic"("title");

-- CreateIndex
CREATE INDEX "Topic_order_idx" ON "Topic"("order");

-- CreateIndex
CREATE INDEX "Topic_subjectCategory_idx" ON "Topic"("subjectCategory");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserAnswer_quizAttemptId_idx" ON "UserAnswer"("quizAttemptId");

-- CreateIndex
CREATE INDEX "UserAnswer_questionId_idx" ON "UserAnswer"("questionId");

-- CreateIndex
CREATE INDEX "UserAnswer_isCorrect_idx" ON "UserAnswer"("isCorrect");

-- CreateIndex
CREATE INDEX "UserGroup_name_idx" ON "UserGroup"("name");

-- CreateIndex
CREATE INDEX "UserGroup_deletedAt_idx" ON "UserGroup"("deletedAt");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_lessonId_idx" ON "UserProgress"("lessonId");

-- CreateIndex
CREATE INDEX "UserProgress_quizId_idx" ON "UserProgress"("quizId");

-- CreateIndex
CREATE INDEX "UserProgress_status_idx" ON "UserProgress"("status");

-- CreateIndex
CREATE INDEX "UserProgress_userId_lessonId_idx" ON "UserProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "UserProgress_userId_quizId_idx" ON "UserProgress"("userId", "quizId");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
