import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Commented out until auth module is available
import { OpenAIService } from './services/openai.service';
import { EmbeddingService } from './services/embedding.service';
import { ContentProcessingService } from './services/content-processing.service';
import { VectorStoreService } from './services/vector-store.service';
import * as multer from 'multer';
import * as path from 'path';

// DTOs for request/response
export class CreateEmbeddingDto {
  @IsString({ message: 'Indhold skal være en streng' })
  @IsNotEmpty({ message: 'Indhold må ikke være tomt' })
  content: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'ID skal være en streng' })
  id?: string;
}

export class SearchEmbeddingsDto {
  @IsString({ message: 'Søgeforespørgsel skal være en streng' })
  @IsNotEmpty({ message: 'Søgeforespørgsel må ikke være tom' })
  query: string;

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsNumber({}, { message: 'Grænse skal være et tal' })
  limit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Tærskel skal være et tal' })
  threshold?: number;
}

export class ProcessContentDto {
  @IsString({ message: 'Indhold skal være en streng' })
  @IsNotEmpty({ message: 'Indhold må ikke være tomt' })
  content: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class GenerateQuestionsDto {
  @IsOptional()
  @IsString({ message: 'Indhold skal være en streng' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'Indhold ID skal være en streng' })
  contentId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Antal spørgsmål skal være et tal' })
  questionCount?: number;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'], { message: 'Sværhedsgrad skal være easy, medium eller hard' })
  difficulty?: 'easy' | 'medium' | 'hard';
}

class MessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatCompletionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsNotEmpty({ message: 'Beskeder må ikke være tomme' })
  messages: MessageDto[];

  @IsOptional()
  @IsNumber({}, { message: 'Max tokens skal være et tal' })
  maxTokens?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Temperatur skal være et tal' })
  temperature?: number;
}

@ApiTags('AI')
@Controller('ai')
// @UseGuards(JwtAuthGuard) // Commented out until auth module is available
export class AIController {
  constructor(
    private openaiService: OpenAIService,
    private embeddingService: EmbeddingService,
    private contentProcessingService: ContentProcessingService,
    private vectorStoreService: VectorStoreService,
  ) {}

  @Post('embeddings')
  @ApiOperation({ summary: 'Create and store an embedding' })
  @ApiResponse({ status: 201, description: 'Embedding created successfully' })
  async createEmbedding(@Body() createEmbeddingDto: CreateEmbeddingDto) {
    try {
      const embeddingId = await this.embeddingService.createAndStoreEmbedding({
        content: createEmbeddingDto.content,
        metadata: createEmbeddingDto.metadata || {},
        id: createEmbeddingDto.id,
      });

      return {
        success: true,
        embeddingId,
        message: 'Embedding created successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create embedding: ${errorMessage}`);
    }
  }

  @Post('embeddings/search')
  @ApiOperation({ summary: 'Search embeddings using semantic similarity' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchEmbeddings(@Body() searchDto: SearchEmbeddingsDto) {
    try {
      const results = await this.embeddingService.semanticSearch({
        query: searchDto.query,
        filters: searchDto.filters,
        limit: searchDto.limit || 10,
        threshold: searchDto.threshold || 0.7,
      });

      return {
        success: true,
        results,
        count: results.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to search embeddings: ${errorMessage}`);
    }
  }

  @Post('content/process')
  @ApiOperation({ summary: 'Process text content and create embeddings' })
  @ApiResponse({ status: 201, description: 'Content processed successfully' })
  async processContent(@Body() processContentDto: ProcessContentDto) {
    try {
      const result = await this.contentProcessingService.processTextContent(
        processContentDto.content,
        processContentDto.metadata || {},
      );

      return {
        success: true,
        contentId: result.id,
        chunksCreated: result.chunks.length,
        embeddingsCreated: result.embeddingIds.length,
        analysis: result.analysis,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to process content: ${errorMessage}`);
    }
  }

  @Post('content/upload')
  @ApiOperation({ summary: 'Upload and process a PDF file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadAndProcessFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata?: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Save file temporarily
      const tempFilePath = path.join(
        process.cwd(),
        'temp',
        `${Date.now()}_${file.originalname}`,
      );
      
      // Ensure temp directory exists
      const fs = require('fs');
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, file.buffer);

      try {
        const parsedMetadata = metadata ? JSON.parse(metadata) : {};
        const result = await this.contentProcessingService.processPDFFile(
          tempFilePath,
          {
            ...parsedMetadata,
            originalFileName: file.originalname,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          },
        );

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        return {
          success: true,
          contentId: result.id,
          chunksCreated: result.chunks.length,
          embeddingsCreated: result.embeddingIds.length,
          analysis: result.analysis,
        };
      } catch (processingError) {
        // Clean up temp file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw processingError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to process uploaded file: ${errorMessage}`);
    }
  }

  @Post('questions/generate')
  @ApiOperation({ summary: 'Generate questions from content' })
  @ApiResponse({ status: 200, description: 'Questions generated successfully' })
  async generateQuestions(@Body() generateQuestionsDto: GenerateQuestionsDto) {
    try {
      let questions;

      if (generateQuestionsDto.contentId) {
        // Generate from processed content
        questions = await this.contentProcessingService.generateQuestionsFromContent(
          generateQuestionsDto.contentId,
          generateQuestionsDto.questionCount || 5,
          generateQuestionsDto.difficulty || 'medium',
        );
      } else if (generateQuestionsDto.content) {
        // Generate from raw content
        questions = await this.openaiService.generateQuestions(
          generateQuestionsDto.content,
          generateQuestionsDto.questionCount || 5,
          generateQuestionsDto.difficulty || 'medium',
        );
      } else {
        throw new BadRequestException('Either content or contentId must be provided');
      }

      return {
        success: true,
        questions,
        count: questions.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to generate questions: ${errorMessage}`);
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Create a chat completion' })
  @ApiResponse({ status: 200, description: 'Chat completion generated' })
  async createChatCompletion(@Body() chatDto: ChatCompletionDto) {
    try {
      const response = await this.openaiService.createChatCompletion(
        chatDto.messages,
        {
          max_tokens: chatDto.maxTokens,
          temperature: chatDto.temperature,
        },
      );

      return {
        success: true,
        response,
        usage: this.openaiService.getUsageStats(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create chat completion: ${errorMessage}`);
    }
  }

  @Get('embeddings/stats')
  @ApiOperation({ summary: 'Get embedding statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getEmbeddingStats() {
    try {
      const stats = await this.embeddingService.getStats();
      const vectorStoreStats = this.vectorStoreService.getStats();
      const usageStats = this.openaiService.getUsageStats();

      return {
        success: true,
        embeddings: stats,
        vectorStore: vectorStoreStats,
        openaiUsage: usageStats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to get statistics: ${errorMessage}`);
    }
  }

  @Get('embeddings/:id')
  @ApiOperation({ summary: 'Get a specific embedding' })
  @ApiResponse({ status: 200, description: 'Embedding retrieved' })
  async getEmbedding(@Param('id') id: string) {
    try {
      const embedding = await this.embeddingService.getEmbedding(id);
      
      if (!embedding) {
        throw new BadRequestException('Embedding not found');
      }

      return {
        success: true,
        embedding,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to get embedding: ${errorMessage}`);
    }
  }

  @Post('embeddings/:id')
  @ApiOperation({ summary: 'Update an existing embedding' })
  @ApiResponse({ status: 200, description: 'Embedding updated' })
  async updateEmbedding(
    @Param('id') id: string,
    @Body() updateData: { content?: string; metadata?: Record<string, any> },
  ) {
    try {
      await this.embeddingService.updateEmbedding(id, updateData.content || '', updateData.metadata);

      return {
        success: true,
        message: 'Embedding updated successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update embedding: ${errorMessage}`);
    }
  }

  @Post('embeddings/:id/delete')
  @ApiOperation({ summary: 'Delete an embedding' })
  @ApiResponse({ status: 200, description: 'Embedding deleted' })
  async deleteEmbedding(@Param('id') id: string) {
    try {
      await this.embeddingService.deleteEmbedding(id);

      return {
        success: true,
        message: 'Embedding deleted successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete embedding: ${errorMessage}`);
    }
  }

  @Get('content/search')
  @ApiOperation({ summary: 'Search content using natural language' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchContent(
    @Query('query') query: string,
    @Query('limit') limit?: number,
    @Query('filters') filters?: string,
  ) {
    try {
      if (!query) {
        throw new BadRequestException('Query parameter is required');
      }

      const parsedFilters = filters ? JSON.parse(filters) : undefined;
      const results = await this.contentProcessingService.searchContent(
        query,
        parsedFilters,
        limit || 10,
      );

      return {
        success: true,
        results,
        count: results.length,
        query,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to search content: ${errorMessage}`);
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async healthCheck() {
    try {
      // Test OpenAI connection
      const testEmbedding = await this.openaiService.createEmbedding('test');
      
      return {
        success: true,
        status: 'healthy',
        services: {
          openai: 'connected',
          vectorStore: 'operational',
          embedding: 'operational',
          contentProcessing: 'operational',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
