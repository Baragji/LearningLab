-- CreateTable
CREATE TABLE "ContentEmbedding" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "chunkIndex" INTEGER,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "requestData" JSONB,
    "responseData" JSONB,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedContent" (
    "id" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "analysis" JSONB,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "embeddingIds" TEXT[],
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProcessedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentEmbedding_contentType_idx" ON "ContentEmbedding"("contentType");

-- CreateIndex
CREATE INDEX "ContentEmbedding_contentId_idx" ON "ContentEmbedding"("contentId");

-- CreateIndex
CREATE INDEX "ContentEmbedding_parentId_idx" ON "ContentEmbedding"("parentId");

-- CreateIndex
CREATE INDEX "ContentEmbedding_createdAt_idx" ON "ContentEmbedding"("createdAt");

-- CreateIndex
CREATE INDEX "ContentEmbedding_deletedAt_idx" ON "ContentEmbedding"("deletedAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_operation_idx" ON "AIUsageLog"("operation");

-- CreateIndex
CREATE INDEX "AIUsageLog_model_idx" ON "AIUsageLog"("model");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_success_idx" ON "AIUsageLog"("success");

-- CreateIndex
CREATE INDEX "ProcessedContent_contentType_idx" ON "ProcessedContent"("contentType");

-- CreateIndex
CREATE INDEX "ProcessedContent_contentId_idx" ON "ProcessedContent"("contentId");

-- CreateIndex
CREATE INDEX "ProcessedContent_processingStatus_idx" ON "ProcessedContent"("processingStatus");

-- CreateIndex
CREATE INDEX "ProcessedContent_createdAt_idx" ON "ProcessedContent"("createdAt");

-- CreateIndex
CREATE INDEX "ProcessedContent_deletedAt_idx" ON "ProcessedContent"("deletedAt");

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
