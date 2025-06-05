import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationService } from './question-generation.service';
import { ContentAnalyzer } from './content-analyzer';
import { QuestionGenerator } from './question-generator';
import { QualityEvaluator } from './quality-evaluator';
import { AIUsageLogger } from './ai-usage-logger';
import { ContentFetcher } from './content-fetcher';
import { QuestionType, Difficulty } from '@prisma/client';
import { GeneratedQuestion, QuestionGenerationRequest } from './types';

describe('QuestionGenerationService', () => {
  let service: QuestionGenerationService;
  let contentAnalyzer: jest.Mocked<ContentAnalyzer>;
  let questionGenerator: jest.Mocked<QuestionGenerator>;
  let qualityEvaluator: jest.Mocked<QualityEvaluator>;
  let aiUsageLogger: jest.Mocked<AIUsageLogger>;
  let contentFetcher: jest.Mocked<ContentFetcher>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationService,
        {
          provide: ContentAnalyzer,
          useValue: {
            analyzeContent: jest.fn(),
          },
        },
        {
          provide: QuestionGenerator,
          useValue: {
            generateQuestions: jest.fn(),
          },
        },
        {
          provide: QualityEvaluator,
          useValue: {
            evaluateQuestions: jest.fn(),
          },
        },
        {
          provide: AIUsageLogger,
          useValue: {
            logUsage: jest.fn(),
            getUsageStats: jest.fn(),
          },
        },
        {
          provide: ContentFetcher,
          useValue: {
            fetchLessonContent: jest.fn(),
            fetchTopicContent: jest.fn(),
            fetchCourseContent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionGenerationService>(QuestionGenerationService);
    contentAnalyzer = module.get(ContentAnalyzer);
    questionGenerator = module.get(QuestionGenerator);
    qualityEvaluator = module.get(QualityEvaluator);
    aiUsageLogger = module.get(AIUsageLogger);
    contentFetcher = module.get(ContentFetcher);
  });

  describe('generateQuestionsFromContent', () => {
    const mockRequest: QuestionGenerationRequest = {
      content: 'Test content about programming',
      contentType: 'lesson',
      contentId: '123',
      numberOfQuestions: 5,
      questionTypes: [QuestionType.MULTIPLE_CHOICE],
      targetDifficulty: Difficulty.INTERMEDIATE,
    };

    const mockAnalysis = {
      mainTopics: ['programming', 'testing'],
      keyTerms: ['unit test', 'integration test'],
      complexity: 'intermediate' as const,
      contentType: 'text' as const,
      estimatedReadingTime: 5,
    };

    const mockQuestions: GeneratedQuestion[] = [
      {
        text: 'What is unit testing?',
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: Difficulty.INTERMEDIATE,
        points: 3,
        answerOptions: [
          { text: 'Testing individual components', isCorrect: true },
          { text: 'Testing the entire system', isCorrect: false },
          { text: 'Testing user interface', isCorrect: false },
          { text: 'Testing database connections', isCorrect: false },
        ],
        qualityScore: 0,
        reasoning: 'Tests understanding of unit testing concept',
      },
    ];

    const mockEvaluatedQuestions = mockQuestions.map((q) => ({
      ...q,
      qualityScore: 85,
    }));

    it('should generate questions successfully', async () => {
      contentAnalyzer.analyzeContent.mockResolvedValue(mockAnalysis);
      questionGenerator.generateQuestions.mockResolvedValue(mockQuestions);
      qualityEvaluator.evaluateQuestions.mockResolvedValue(
        mockEvaluatedQuestions,
      );
      aiUsageLogger.logUsage.mockResolvedValue(undefined);

      const result = await service.generateQuestionsFromContent(mockRequest);

      expect(contentAnalyzer.analyzeContent).toHaveBeenCalledWith(
        mockRequest.content,
      );
      expect(questionGenerator.generateQuestions).toHaveBeenCalledWith(
        mockRequest.content,
        mockAnalysis,
        mockRequest,
      );
      expect(qualityEvaluator.evaluateQuestions).toHaveBeenCalledWith(
        mockQuestions,
      );
      expect(aiUsageLogger.logUsage).toHaveBeenCalledWith(
        'question_generation',
        mockRequest,
        mockEvaluatedQuestions.length,
      );
      expect(result).toEqual(mockEvaluatedQuestions);
    });

    it('should handle errors and log failure', async () => {
      const error = new Error('AI service unavailable');
      contentAnalyzer.analyzeContent.mockRejectedValue(error);
      aiUsageLogger.logUsage.mockResolvedValue(undefined);

      await expect(
        service.generateQuestionsFromContent(mockRequest),
      ).rejects.toThrow('Failed to generate questions: AI service unavailable');

      expect(aiUsageLogger.logUsage).toHaveBeenCalledWith(
        'question_generation',
        mockRequest,
        0,
        false,
        'AI service unavailable',
      );
    });
  });

  describe('generateQuestionsFromLesson', () => {
    it('should fetch lesson content and generate questions', async () => {
      const lessonId = 1;
      const mockContent = 'Lesson content about testing';
      const options = {
        numberOfQuestions: 3,
        questionTypes: [QuestionType.ESSAY],
        targetDifficulty: Difficulty.BEGINNER,
      };

      contentFetcher.fetchLessonContent.mockResolvedValue(mockContent);
      jest.spyOn(service, 'generateQuestionsFromContent').mockResolvedValue([]);

      await service.generateQuestionsFromLesson(lessonId, options);

      expect(contentFetcher.fetchLessonContent).toHaveBeenCalledWith(lessonId);
      expect(service.generateQuestionsFromContent).toHaveBeenCalledWith({
        content: mockContent,
        contentType: 'lesson',
        contentId: '1',
        ...options,
      });
    });
  });

  describe('validateGeneratedQuestions', () => {
    it('should validate questions correctly', () => {
      const validQuestions: GeneratedQuestion[] = [
        {
          text: 'What is the purpose of integration testing?',
          type: QuestionType.MULTIPLE_CHOICE,
          difficulty: Difficulty.INTERMEDIATE,
          points: 3,
          answerOptions: [
            { text: 'Test component interactions', isCorrect: true },
            { text: 'Test individual functions', isCorrect: false },
            { text: 'Test UI design', isCorrect: false },
            { text: 'Test database schema', isCorrect: false },
          ],
          qualityScore: 75,
          reasoning: 'Tests understanding of integration testing',
        },
        {
          text: 'Explain the benefits of automated testing',
          type: QuestionType.ESSAY,
          difficulty: Difficulty.ADVANCED,
          points: 5,
          essayMinWords: 100,
          essayMaxWords: 300,
          qualityScore: 80,
          reasoning: 'Tests ability to articulate testing benefits',
        },
      ];

      const result = service.validateGeneratedQuestions(validQuestions);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify validation issues', () => {
      const invalidQuestions: GeneratedQuestion[] = [
        {
          text: 'Short?', // Too short
          type: QuestionType.MULTIPLE_CHOICE,
          difficulty: Difficulty.BEGINNER,
          points: 1,
          answerOptions: [{ text: 'Yes', isCorrect: true }], // Too few options
          qualityScore: 30, // Low quality
          reasoning: 'Poor question',
        },
        {
          text: 'Write an essay about testing',
          type: QuestionType.ESSAY,
          difficulty: Difficulty.INTERMEDIATE,
          points: 3,
          // Missing essay word limits
          qualityScore: 60,
          reasoning: 'Essay question',
        },
      ];

      const result = service.validateGeneratedQuestions(invalidQuestions);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain(
        'Spørgsmål 1: Tekst er for kort eller mangler',
      );
      expect(result.issues).toContain('Spørgsmål 1: Mangler svarmuligheder');
      expect(result.issues).toContain('Spørgsmål 1: Lav kvalitetsscore (30)');
      expect(result.issues).toContain(
        'Spørgsmål 2: Mangler ordgrænser for essay',
      );
    });
  });

  describe('getUsageStatistics', () => {
    it('should return usage statistics', async () => {
      const mockStats = {
        totalTokensUsed: 10000,
        totalRequests: 50,
        successRate: 92,
        avgQuestionsPerRequest: 4.5,
        estimatedCost: 0.3,
      };

      aiUsageLogger.getUsageStats.mockResolvedValue(mockStats);

      const result = await service.getUsageStatistics();

      expect(aiUsageLogger.getUsageStats).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(mockStats);
    });
  });
});
