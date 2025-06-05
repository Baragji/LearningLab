import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { AIProviderService } from './ai-provider.service';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

export interface ContentAnalysis {
  summary: string;
  keyTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime: number;
  wordCount: number;
  language: string;
}

export interface ProcessedContent {
  id: string;
  originalContent: string;
  chunks: ContentChunk[];
  analysis: ContentAnalysis;
  embeddingIds: string[];
}

export interface ContentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: {
    startPosition: number;
    endPosition: number;
    wordCount: number;
    parentId: string;
    chunkType: 'paragraph' | 'section' | 'heading' | 'list';
  };
}

@Injectable()
export class ContentProcessingService {
  private readonly logger = new Logger(ContentProcessingService.name);
  private readonly maxChunkSize = 1000; // Maximum characters per chunk
  private readonly chunkOverlap = 100; // Overlap between chunks

  constructor(
    private embeddingService: EmbeddingService,
    private aiProviderService: AIProviderService,
  ) {}

  /**
   * Process text content and create embeddings
   */
  async processTextContent(
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<ProcessedContent> {
    try {
      const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Analyze content
      const analysis = await this.analyzeContent(content);

      // Split content into chunks
      const chunks = this.splitIntoChunks(content, contentId);

      // Create embeddings for each chunk
      const embeddingIds: string[] = [];

      for (const chunk of chunks) {
        const embeddingId = await this.embeddingService.createAndStoreEmbedding(
          {
            content: chunk.content,
            metadata: {
              ...metadata,
              ...chunk.metadata,
              contentType: 'text',
              analysis,
            },
            id: chunk.id,
          },
        );
        embeddingIds.push(embeddingId);
      }

      this.logger.log(`Processed text content with ${chunks.length} chunks`);

      return {
        id: contentId,
        originalContent: content,
        chunks,
        analysis,
        embeddingIds,
      };
    } catch (error) {
      this.logger.error('Failed to process text content', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process text content: ${errorMessage}`);
    }
  }

  /**
   * Process PDF file and create embeddings
   */
  async processPDFFile(
    filePath: string,
    metadata: Record<string, any> = {},
  ): Promise<ProcessedContent> {
    try {
      // Read and parse PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      const enhancedMetadata = {
        ...metadata,
        fileName: path.basename(filePath),
        fileType: 'pdf',
        pageCount: pdfData.numpages,
        pdfInfo: pdfData.info,
      };

      // Process the extracted text
      return await this.processTextContent(pdfData.text, enhancedMetadata);
    } catch (error) {
      this.logger.error(`Failed to process PDF file: ${filePath}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process PDF file: ${errorMessage}`);
    }
  }

  /**
   * Process lesson content from database
   */
  async processLessonContent(
    lessonId: number,
    title: string,
    content: string,
    additionalMetadata: Record<string, any> = {},
  ): Promise<ProcessedContent> {
    const metadata = {
      lessonId,
      title,
      contentType: 'lesson',
      ...additionalMetadata,
    };

    return await this.processTextContent(content, metadata);
  }

  /**
   * Analyze content to extract insights
   */
  private async analyzeContent(content: string): Promise<ContentAnalysis> {
    try {
      const prompt = `
Analyze the following educational content and provide insights in JSON format:

{
  "summary": "Brief 2-3 sentence summary",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedReadingTime": 5,
  "language": "en|da|etc"
}

Content:
${content.substring(0, 2000)}...
`;

      const response = await this.aiProviderService.generateChatCompletion(
        [
          {
            role: 'system',
            content:
              'You are an educational content analyst. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: 0.3,
          maxTokens: 1000,
        },
      );

      const analysis = JSON.parse(response.content);

      // Add calculated fields
      const wordCount = content.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute

      return {
        ...analysis,
        wordCount,
        estimatedReadingTime,
      };
    } catch (error) {
      this.logger.warn(
        'Failed to analyze content with AI, using fallback',
        error,
      );

      // Fallback analysis
      const wordCount = content.split(/\s+/).length;
      return {
        summary: 'Content analysis not available',
        keyTopics: [],
        difficulty: 'intermediate',
        estimatedReadingTime: Math.ceil(wordCount / 200),
        wordCount,
        language: 'en',
      };
    }
  }

  /**
   * Split content into manageable chunks
   */
  private splitIntoChunks(content: string, parentId: string): ContentChunk[] {
    const chunks: ContentChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < content.length) {
      const endPosition = Math.min(
        currentPosition + this.maxChunkSize,
        content.length,
      );

      // Try to break at a sentence or paragraph boundary
      let actualEndPosition = endPosition;
      if (endPosition < content.length) {
        const lastSentence = content.lastIndexOf('.', endPosition);
        const lastParagraph = content.lastIndexOf('\n\n', endPosition);
        const lastSpace = content.lastIndexOf(' ', endPosition);

        // Use the best break point
        if (lastParagraph > currentPosition + this.maxChunkSize * 0.5) {
          actualEndPosition = lastParagraph + 2;
        } else if (lastSentence > currentPosition + this.maxChunkSize * 0.5) {
          actualEndPosition = lastSentence + 1;
        } else if (lastSpace > currentPosition + this.maxChunkSize * 0.5) {
          actualEndPosition = lastSpace;
        }
      }

      const chunkContent = content
        .substring(currentPosition, actualEndPosition)
        .trim();

      if (chunkContent.length > 0) {
        const chunkId = `${parentId}_chunk_${chunkIndex}`;

        chunks.push({
          id: chunkId,
          content: chunkContent,
          chunkIndex,
          metadata: {
            startPosition: currentPosition,
            endPosition: actualEndPosition,
            wordCount: chunkContent.split(/\s+/).length,
            parentId,
            chunkType: this.determineChunkType(chunkContent),
          },
        });

        chunkIndex++;
      }

      // Move to next chunk with overlap
      currentPosition = Math.max(
        actualEndPosition - this.chunkOverlap,
        actualEndPosition,
      );
    }

    this.logger.debug(`Split content into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Determine the type of content chunk
   */
  private determineChunkType(
    content: string,
  ): 'paragraph' | 'section' | 'heading' | 'list' {
    const trimmed = content.trim();

    // Check for headings (lines that are short and don't end with punctuation)
    if (
      trimmed.length < 100 &&
      !trimmed.endsWith('.') &&
      !trimmed.endsWith('!') &&
      !trimmed.endsWith('?')
    ) {
      return 'heading';
    }

    // Check for lists (contains bullet points or numbered items)
    if (/^\s*[-*•]|^\s*\d+\./m.test(trimmed)) {
      return 'list';
    }

    // Check for sections (contains multiple paragraphs)
    if (trimmed.includes('\n\n')) {
      return 'section';
    }

    return 'paragraph';
  }

  /**
   * Search for content related to a query
   */
  async searchContent(
    query: string,
    filters?: Record<string, any>,
    limit: number = 10,
  ) {
    return await this.embeddingService.semanticSearch({
      query,
      filters,
      limit,
      threshold: 0.7,
    });
  }

  /**
   * Generate questions from processed content
   */
  async generateQuestionsFromContent(
    contentId: string,
    questionCount: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ) {
    try {
      // Get content chunks
      const chunks = await this.embeddingService.semanticSearch({
        query: '',
        filters: { parentId: contentId },
        limit: 100,
        threshold: 0,
      });

      if (chunks.length === 0) {
        throw new Error(`No content found for ID: ${contentId}`);
      }

      // Combine chunks into full content
      const fullContent = chunks
        .sort(
          (a, b) =>
            a.document.metadata.chunkIndex - b.document.metadata.chunkIndex,
        )
        .map((chunk) => chunk.document.content)
        .join('\n\n');

      // Generate questions
      return await this.aiProviderService.generateQuestions(
        fullContent,
        questionCount,
        difficulty,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate questions for content ${contentId}`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate questions: ${errorMessage}`);
    }
  }
}
