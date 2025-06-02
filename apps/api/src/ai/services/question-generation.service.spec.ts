import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationService } from './question-generation.service';
import { OpenAIService } from './openai.service';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { QuestionType, Difficulty } from '@prisma/client';

describe('QuestionGenerationService', () => {
  let service: QuestionGenerationService;
  let openaiService: OpenAIService;
  let prismaService: PrismaService;

  const mockOpenAIService = {
    createChatCompletion: jest.fn(),
  };

  const mockEmbeddingService = {
    generateEmbedding: jest.fn(),
    searchSimilarContent: jest.fn(),
  };

  const mockPrismaService = {
    aIUsageLog: {
      create: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: EmbeddingService,
          useValue: mockEmbeddingService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QuestionGenerationService>(QuestionGenerationService);
    openaiService = module.get<OpenAIService>(OpenAIService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQuestionsFromContent', () => {
    it('should generate questions from content successfully', async () => {
      const mockContent = 'This is test content about mathematics.';
      const mockOptions = {
        count: 3,
        difficulty: 'medium' as const,
        questionTypes: ['multiple_choice'] as const,
        focusAreas: ['key_concepts'],
      };

      const mockAIResponse = JSON.stringify([
        {
          text: 'What is 2+2?',
          type: QuestionType.MULTIPLE_CHOICE,
          difficulty: Difficulty.BEGINNER,
          points: 1,
          answerOptions: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
            { text: '6', isCorrect: false }
          ],
          qualityScore: 0.9,
          reasoning: 'Clear and straightforward question'
        }
      ]);

      mockOpenAIService.createChatCompletion.mockResolvedValue(mockAIResponse);
      mockPrismaService.aIUsageLog.create.mockResolvedValue({});

      const result = await service.generateQuestionsFromContent(mockContent, mockOptions);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('What is 2+2?');
      expect(result[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(result[0].difficulty).toBe(Difficulty.BEGINNER);
      expect(mockPrismaService.aIUsageLog.create).toHaveBeenCalled();
    });

    it('should handle AI service errors gracefully', async () => {
      const mockContent = 'Test content';
      const mockOptions = {
        count: 1,
        difficulty: 'easy' as const,
        questionTypes: ['multiple_choice'] as const,
        focusAreas: ['key_concepts'],
      };

      mockOpenAIService.createChatCompletion.mockRejectedValue(new Error('AI service error'));

      await expect(service.generateQuestionsFromContent(mockContent, mockOptions))
        .rejects.toThrow('Failed to generate questions: AI service error');
    });

    it('should validate question quality', () => {
      const goodQuestion = {
        text: 'What is the capital of France?',
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: Difficulty.BEGINNER,
        points: 1,
        answerOptions: [
          { text: 'London', isCorrect: false },
          { text: 'Berlin', isCorrect: false },
          { text: 'Paris', isCorrect: true },
          { text: 'Madrid', isCorrect: false }
        ],
        qualityScore: 0.9,
        reasoning: 'Clear question with good options'
      };

      const poorQuestion = {
        text: 'What?',
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: Difficulty.BEGINNER,
        points: 1,
        answerOptions: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false }
        ],
        qualityScore: 0.3,
        reasoning: 'Unclear question'
      };

      expect(service['evaluateQuestionQuality'](goodQuestion)).toBe(true);
      expect(service['evaluateQuestionQuality'](poorQuestion)).toBe(false);
    });
  });

  describe('generateQuestionsFromLesson', () => {
    it('should generate questions from lesson content', async () => {
      const mockLesson = {
        id: '1',
        title: 'Math Lesson',
        content: 'This lesson covers basic arithmetic operations.',
        contentBlocks: [
          {
            type: 'TEXT',
            content: 'Addition is a mathematical operation.'
          }
        ]
      };

      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      
      const mockAIResponse = JSON.stringify([
        {
          text: 'What is addition?',
          type: QuestionType.MULTIPLE_CHOICE,
          difficulty: Difficulty.BEGINNER,
          points: 1,
          answerOptions: [
            { text: 'Math operation', isCorrect: true },
            { text: 'Subtraction', isCorrect: false },
            { text: 'Division', isCorrect: false },
            { text: 'Multiplication', isCorrect: false }
          ],
          qualityScore: 0.8,
          reasoning: 'Basic concept question'
        }
      ]);

      mockOpenAIService.createChatCompletion.mockResolvedValue(mockAIResponse);
      mockPrismaService.aIUsageLog.create.mockResolvedValue({});

      const result = await service.generateQuestionsFromLesson('1', {
        count: 1,
        difficulty: 'easy',
        questionTypes: ['multiple_choice'],
        focusAreas: ['key_concepts']
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('What is addition?');
      expect(result[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(result[0].difficulty).toBe(Difficulty.BEGINNER);
      expect(mockPrismaService.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { contentBlocks: true }
      });
    });

    it('should throw error if lesson not found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(service.generateQuestionsFromLesson('999', {
        count: 1,
        difficulty: 'easy',
        questionTypes: ['multiple_choice'],
        focusAreas: ['key_concepts']
      })).rejects.toThrow('Lesson not found');
    });
  });

  describe('generateQuestionsFromTopic', () => {
    it('should generate questions from topic and its lessons', async () => {
      const mockTopic = {
        id: '1',
        title: 'Mathematics',
        description: 'Basic mathematics concepts',
        lessons: [
          {
            id: '1',
            title: 'Addition',
            content: 'Learn about addition',
            contentBlocks: []
          }
        ]
      };

      mockPrismaService.topic.findUnique.mockResolvedValue(mockTopic);
      
      const mockAIResponse = JSON.stringify([
        {
          text: 'What is mathematics?',
          type: QuestionType.MULTIPLE_CHOICE,
          difficulty: Difficulty.INTERMEDIATE,
          points: 2,
          answerOptions: [
            { text: 'Science', isCorrect: true },
            { text: 'Art', isCorrect: false },
            { text: 'Language', isCorrect: false },
            { text: 'Sport', isCorrect: false }
          ],
          qualityScore: 0.85,
          reasoning: 'Good foundational question'
        }
      ]);

      mockOpenAIService.createChatCompletion.mockResolvedValue(mockAIResponse);
      mockPrismaService.aIUsageLog.create.mockResolvedValue({});

      const result = await service.generateQuestionsFromTopic('1', {
        count: 1,
        difficulty: 'medium',
        questionTypes: ['multiple_choice'],
        focusAreas: ['overview']
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('What is mathematics?');
      expect(result[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(result[0].difficulty).toBe(Difficulty.INTERMEDIATE);
      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          lessons: {
            include: { contentBlocks: true }
          }
        }
      });
    });
  });
});