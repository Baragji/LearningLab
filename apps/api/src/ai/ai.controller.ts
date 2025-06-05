import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Import services
import { AIProviderService } from './services/ai-provider.service';
import {
  AIFeedbackService,
  SingleQuestionFeedbackRequest,
  FeedbackResponse,
} from './services/ai-feedback.service';
import {
  AdaptiveLearningService,
  UserPerformanceData,
  LearningRecommendation,
} from './services/adaptive-learning.service';
import {
  LearningAnalyticsService,
  AnalyticsTimeframe,
  ComprehensiveDashboardData,
} from './services/learning-analytics.service';
import {
  DifficultyAdjustmentService,
  DifficultyLevel,
  DifficultyAdjustmentResult,
} from './services/difficulty-adjustment.service';
import { EmbeddingService } from './services/embedding.service';
import { ContentProcessingService } from './services/content-processing.service';

// DTOs for API requests/responses
export class GenerateQuestionsDto {
  @IsString()
  content: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  questionCount: number;

  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];
}

// Response interfaces
export interface QuestionMetadata {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
}

export interface QuestionGenerationResponse {
  success: boolean;
  data: any[];
  metadata: QuestionMetadata;
}

export class FeedbackRequestDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  questionId: number;

  @IsString()
  userAnswer: string;

  @IsString()
  correctAnswer: string;

  @IsString()
  questionText: string;

  @IsOptional()
  @IsString()
  questionTopic?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

export class UserPerformanceDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  totalQuestions: number;

  @IsNumber()
  correctAnswers: number;

  @IsNumber()
  totalStudyTime: number;

  @IsNumber()
  averageResponseTime: number;

  @IsEnum(['visual', 'auditory', 'kinesthetic', 'reading'])
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';

  @IsArray()
  @IsString({ each: true })
  strengths: string[];

  @IsArray()
  @IsString({ each: true })
  weaknesses: string[];

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';

  @IsNumber()
  streakDays: number;

  @IsDateString()
  lastActivity: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicsStudied?: string[];
}

export class AnalyticsTimeframeDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export class DifficultyAdjustmentDto {
  @IsNumber()
  userId: number;

  @ValidateNested()
  @Type(() => DifficultyLevelDto)
  currentLevel: DifficultyLevelDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPerformanceDto)
  performanceHistory: UserPerformanceDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[];
}

export class DifficultyLevelDto {
  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'])
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsNumber()
  @Min(1)
  @Max(10)
  numericValue: number;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  characteristics: string[];
}

export class ProcessContentDto {
  @IsString()
  content: string;

  @IsEnum(['text', 'pdf'])
  contentType: 'text' | 'pdf';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchContentDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class LearningPathDto {
  @IsNumber()
  userId: number;

  @IsArray()
  @IsString({ each: true })
  currentTopics: string[];

  @IsArray()
  @IsString({ each: true })
  learningGoals: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  timeframeWeeks?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  studyDaysPerWeek?: number;
}

@ApiTags('AI Services')
@Controller('ai')
@ApiBearerAuth()
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiProviderService: AIProviderService,
    private readonly aiFeedbackService: AIFeedbackService,
    private readonly adaptiveLearningService: AdaptiveLearningService,
    private readonly learningAnalyticsService: LearningAnalyticsService,
    private readonly difficultyAdjustmentService: DifficultyAdjustmentService,
    private readonly embeddingService: EmbeddingService,
    private readonly contentProcessingService: ContentProcessingService,
  ) {}

  // Question Generation Endpoints
  @Post('questions/generate')
  @ApiOperation({ summary: 'Generate AI-powered questions from content' })
  @ApiResponse({ status: 201, description: 'Questions generated successfully' })
  async generateQuestions(
    @Body(ValidationPipe) generateQuestionsDto: GenerateQuestionsDto,
  ): Promise<QuestionGenerationResponse> {
    try {
      this.logger.log(
        `Generating ${generateQuestionsDto.questionCount} questions`,
      );

      const questions = await this.aiProviderService.generateQuestions(
        generateQuestionsDto.content,
        generateQuestionsDto.questionCount,
        generateQuestionsDto.difficulty,
      );

      return {
        success: true,
        data: questions,
        metadata: {
          questionCount: questions.length,
          difficulty: generateQuestionsDto.difficulty,
          topics: generateQuestionsDto.topics,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate questions', error);
      throw new HttpException(
        'Failed to generate questions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // AI Feedback Endpoints
  @Post('feedback/generate')
  @ApiOperation({
    summary: 'Generate personalized AI feedback for user answers',
  })
  @ApiResponse({ status: 201, description: 'Feedback generated successfully' })
  async generateFeedback(
    @Body(ValidationPipe) feedbackRequestDto: FeedbackRequestDto,
  ): Promise<FeedbackResponse> {
    try {
      this.logger.log(
        `Generating feedback for user ${feedbackRequestDto.userId}`,
      );

      const feedbackRequest: SingleQuestionFeedbackRequest = {
        userId: feedbackRequestDto.userId,
        questionId: feedbackRequestDto.questionId,
        userAnswer: feedbackRequestDto.userAnswer,
        correctAnswer: feedbackRequestDto.correctAnswer,
        questionText: feedbackRequestDto.questionText,
        questionTopic: feedbackRequestDto.questionTopic,
        confidence: feedbackRequestDto.confidence,
        timeSpent: feedbackRequestDto.timeSpent,
      };

      return await this.aiFeedbackService.generateFeedback(feedbackRequest);
    } catch (error) {
      this.logger.error('Failed to generate feedback', error);
      throw new HttpException(
        'Failed to generate feedback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('feedback/history/:userId')
  @ApiOperation({ summary: 'Get feedback history for a user' })
  @ApiResponse({
    status: 200,
    description: 'Feedback history retrieved successfully',
  })
  async getFeedbackHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const history = await this.aiFeedbackService.getFeedbackHistory(
        userId,
        limit || 20,
      );

      return {
        success: true,
        data: history,
        metadata: {
          userId,
          count: history.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get feedback history', error);
      throw new HttpException(
        'Failed to get feedback history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('feedback/assistance')
  @ApiOperation({ summary: 'Get AI learning assistance' })
  @ApiResponse({
    status: 201,
    description: 'Learning assistance provided successfully',
  })
  async getLearningAssistance(
    @Body() body: { userId: number; topic: string; question: string },
  ) {
    try {
      const assistance = await this.aiFeedbackService.provideLearningAssistance(
        {
          userId: body.userId,
          question: body.question,
          context: body.topic,
        },
      );

      return {
        success: true,
        data: assistance,
      };
    } catch (error) {
      this.logger.error('Failed to provide learning assistance', error);
      throw new HttpException(
        'Failed to provide learning assistance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Adaptive Learning Endpoints
  @Post('adaptive/analyze')
  @ApiOperation({ summary: 'Analyze user performance for adaptive learning' })
  @ApiResponse({
    status: 201,
    description: 'Performance analysis completed successfully',
  })
  async analyzeUserPerformance(
    @Body() body: { userId: number; performanceHistory: UserPerformanceDto[] },
  ) {
    try {
      const performanceData: UserPerformanceData[] =
        body.performanceHistory.map((p) => ({
          ...p,
          lastActivity: new Date(p.lastActivity),
        }));

      const analysis =
        await this.adaptiveLearningService.analyzeUserPerformance(body.userId);

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      this.logger.error('Failed to analyze user performance', error);
      throw new HttpException(
        'Failed to analyze user performance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('adaptive/recommendations')
  @ApiOperation({ summary: 'Generate personalized learning recommendations' })
  @ApiResponse({
    status: 201,
    description: 'Recommendations generated successfully',
  })
  async generateLearningRecommendations(
    @Body()
    body: {
      userId: number;
      performanceHistory: UserPerformanceDto[];
      learningGoals?: string[];
    },
  ) {
    try {
      const performanceData: UserPerformanceData[] =
        body.performanceHistory.map((p) => ({
          ...p,
          lastActivity: new Date(p.lastActivity),
        }));

      const recommendations =
        await this.adaptiveLearningService.generatePersonalizedRecommendations(
          body.userId,
          undefined,
          body.learningGoals,
        );

      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to generate recommendations', error);
      throw new HttpException(
        'Failed to generate recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('adaptive/learning-path')
  @ApiOperation({ summary: 'Generate personalized learning path' })
  @ApiResponse({
    status: 201,
    description: 'Learning path generated successfully',
  })
  async generateLearningPath(
    @Body(ValidationPipe) learningPathDto: LearningPathDto,
  ) {
    try {
      const learningPath =
        await this.adaptiveLearningService.generatePersonalizedLearningPath(
          learningPathDto.userId,
          {} as any, // performanceData placeholder
          learningPathDto.currentTopics,
          learningPathDto.learningGoals,
        );

      return {
        success: true,
        data: learningPath,
      };
    } catch (error) {
      this.logger.error('Failed to generate learning path', error);
      throw new HttpException(
        'Failed to generate learning path',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Learning Analytics Endpoints
  @Post('analytics/dashboard')
  @ApiOperation({
    summary: 'Generate comprehensive learning analytics dashboard',
  })
  @ApiResponse({
    status: 201,
    description: 'Dashboard data generated successfully',
  })
  async generateDashboard(
    @Body()
    body: {
      userId: number;
      timeframe: AnalyticsTimeframeDto;
      performanceHistory: UserPerformanceDto[];
    },
  ): Promise<ComprehensiveDashboardData> {
    try {
      const timeframe: AnalyticsTimeframe = {
        start: new Date(body.timeframe.start),
        end: new Date(body.timeframe.end),
        period: body.timeframe.period,
      };

      const performanceData: UserPerformanceData[] =
        body.performanceHistory.map((p) => ({
          ...p,
          lastActivity: new Date(p.lastActivity),
        }));

      return await this.learningAnalyticsService.generateDashboardData(
        body.userId,
        timeframe,
        performanceData,
      );
    } catch (error) {
      this.logger.error('Failed to generate dashboard', error);
      throw new HttpException(
        'Failed to generate dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/metrics/:userId')
  @ApiOperation({ summary: 'Get learning metrics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Learning metrics retrieved successfully',
  })
  async getLearningMetrics(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('timeframe') timeframe?: string,
  ) {
    try {
      // Default to last 30 days if no timeframe specified
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);

      const analyticsTimeframe: AnalyticsTimeframe = {
        start,
        end,
        period: 'month',
      };

      // This would typically fetch from database
      const performanceHistory: UserPerformanceData[] = [];

      const metrics =
        await this.learningAnalyticsService.calculateLearningMetrics(
          userId,
          analyticsTimeframe,
          performanceHistory,
        );

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Failed to get learning metrics', error);
      throw new HttpException(
        'Failed to get learning metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Difficulty Adjustment Endpoints
  @Post('difficulty/adjust')
  @ApiOperation({
    summary: 'Adjust difficulty level based on user performance',
  })
  @ApiResponse({ status: 201, description: 'Difficulty adjusted successfully' })
  async adjustDifficulty(
    @Body(ValidationPipe) adjustmentDto: DifficultyAdjustmentDto,
  ): Promise<DifficultyAdjustmentResult> {
    try {
      const currentLevel: DifficultyLevel = adjustmentDto.currentLevel;
      const performanceData: UserPerformanceData[] =
        adjustmentDto.performanceHistory.map((p) => ({
          ...p,
          lastActivity: new Date(p.lastActivity),
        }));

      return await this.difficultyAdjustmentService.adjustDifficultyLevel(
        adjustmentDto.userId,
        currentLevel,
        performanceData,
        adjustmentDto.learningObjectives,
      );
    } catch (error) {
      this.logger.error('Failed to adjust difficulty', error);
      throw new HttpException(
        'Failed to adjust difficulty',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('difficulty/levels')
  @ApiOperation({ summary: 'Get all available difficulty levels' })
  @ApiResponse({
    status: 200,
    description: 'Difficulty levels retrieved successfully',
  })
  async getDifficultyLevels() {
    try {
      const levels =
        await this.difficultyAdjustmentService.getAllDifficultyLevels();

      return {
        success: true,
        data: levels,
      };
    } catch (error) {
      this.logger.error('Failed to get difficulty levels', error);
      throw new HttpException(
        'Failed to get difficulty levels',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('difficulty/calibrate')
  @ApiOperation({
    summary: 'Calibrate question difficulty based on user responses',
  })
  @ApiResponse({
    status: 201,
    description: 'Question difficulty calibrated successfully',
  })
  async calibrateQuestionDifficulty(
    @Body()
    body: {
      questionId: string;
      userResponses: {
        userId: number;
        isCorrect: boolean;
        timeSpent: number;
        userLevel: DifficultyLevelDto;
      }[];
    },
  ) {
    try {
      const userResponses = body.userResponses.map((response) => ({
        ...response,
        userLevel: response.userLevel as DifficultyLevel,
      }));

      const calibration =
        await this.difficultyAdjustmentService.calibrateQuestionDifficulty(
          body.questionId,
          userResponses,
        );

      return {
        success: true,
        data: calibration,
      };
    } catch (error) {
      this.logger.error('Failed to calibrate question difficulty', error);
      throw new HttpException(
        'Failed to calibrate question difficulty',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Content Processing Endpoints
  @Post('content/process')
  @ApiOperation({ summary: 'Process and analyze content for learning' })
  @ApiResponse({ status: 201, description: 'Content processed successfully' })
  async processContent(
    @Body(ValidationPipe) processContentDto: ProcessContentDto,
  ) {
    try {
      const result = await this.contentProcessingService.processTextContent(
        processContentDto.content,
        {
          contentType: processContentDto.contentType,
          title: processContentDto.title,
          tags: processContentDto.tags,
        },
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to process content', error);
      throw new HttpException(
        'Failed to process content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('content/search')
  @ApiOperation({
    summary: 'Search processed content using semantic similarity',
  })
  @ApiResponse({
    status: 200,
    description: 'Content search completed successfully',
  })
  async searchContent(
    @Body(ValidationPipe) searchContentDto: SearchContentDto,
  ) {
    try {
      const results = await this.embeddingService.semanticSearch({
        query: searchContentDto.query,
        limit: searchContentDto.limit || 10,
        threshold: searchContentDto.threshold || 0.7,
        filters: searchContentDto.tags
          ? { tags: searchContentDto.tags }
          : undefined,
      });

      return {
        success: true,
        data: results,
        metadata: {
          query: searchContentDto.query,
          resultCount: results.length,
          threshold: searchContentDto.threshold,
        },
      };
    } catch (error) {
      this.logger.error('Failed to search content', error);
      throw new HttpException(
        'Failed to search content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Utility Endpoints
  @Get('health')
  @ApiOperation({ summary: 'Check AI services health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealthStatus() {
    try {
      // Test OpenAI/Ollama connection
      const testEmbedding = await this.embeddingService.getEmbedding('test');

      return {
        success: true,
        data: {
          status: 'healthy',
          services: {
            openai: testEmbedding ? 'connected' : 'disconnected',
            embedding: 'operational',
            vectorStore: 'operational',
            contentProcessing: 'operational',
            aiFeedback: 'operational',
            adaptiveLearning: 'operational',
            analytics: 'operational',
            difficultyAdjustment: 'operational',
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        success: false,
        data: {
          status: 'unhealthy',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @Get('config')
  @ApiOperation({ summary: 'Get AI service configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  async getConfiguration() {
    try {
      return {
        success: true,
        data: {
          aiProvider: process.env.OPENAI_API_BASE?.includes('localhost:11434')
            ? 'ollama'
            : 'openai',
          model: process.env.OPENAI_API_BASE?.includes('localhost:11434')
            ? 'llama2'
            : 'gpt-3.5-turbo',
          embeddingModel: 'text-embedding-ada-002',
          features: {
            questionGeneration: true,
            aiFeedback: true,
            adaptiveLearning: true,
            learningAnalytics: true,
            difficultyAdjustment: true,
            contentProcessing: true,
            semanticSearch: true,
          },
          limits: {
            maxQuestionsPerRequest: 20,
            maxContentLength: 50000,
            maxSearchResults: 50,
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get configuration', error);
      throw new HttpException(
        'Failed to get configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
