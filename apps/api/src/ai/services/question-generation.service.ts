import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { QuestionType, Difficulty } from '@prisma/client';

export interface ContentAnalysis {
  mainTopics: string[];
  keyTerms: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'text' | 'code' | 'mixed';
  estimatedReadingTime: number;
}

export interface GeneratedQuestion {
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  points: number;
  answerOptions?: {
    text: string;
    isCorrect: boolean;
  }[];
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  dragDropItems?: any;
  qualityScore: number;
  reasoning: string;
}

export interface QuestionGenerationRequest {
  content: string;
  contentType: 'lesson' | 'topic' | 'course';
  contentId: string;
  targetDifficulty?: Difficulty;
  questionTypes?: QuestionType[];
  numberOfQuestions?: number;
  focusAreas?: string[];
}

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly embeddingService: EmbeddingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyser indhold og generer spørgsmål automatisk
   */
  async generateQuestionsFromContent(
    request: QuestionGenerationRequest,
  ): Promise<GeneratedQuestion[]> {
    try {
      this.logger.log(
        `Genererer spørgsmål for ${request.contentType} ${request.contentId}`,
      );

      // 1. Analyser indholdet
      const analysis = await this.analyzeContent(request.content);
      this.logger.debug('Content analysis completed', analysis);

      // 2. Generer spørgsmål baseret på analyse
      const questions = await this.generateQuestions(
        request.content,
        analysis,
        request,
      );

      // 3. Evaluer kvalitet af spørgsmål
      const evaluatedQuestions = await this.evaluateQuestionQuality(questions);

      // 4. Log AI usage
      await this.logAIUsage(
        'question_generation',
        request,
        evaluatedQuestions.length,
      );

      return evaluatedQuestions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Fejl ved generering af spørgsmål: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to generate questions: ${errorMessage}`);
    }
  }

  /**
   * Analyser indhold for at forstå emner og kompleksitet
   */
  private async analyzeContent(content: string): Promise<ContentAnalysis> {
    const prompt = `
Analyser følgende uddannelsesindhold og returner en JSON struktur med:
- mainTopics: Array af hovedemner (max 5)
- keyTerms: Array af nøgletermer og begreber (max 10)
- complexity: 'beginner', 'intermediate', eller 'advanced'
- contentType: 'text', 'code', eller 'mixed'
- estimatedReadingTime: Estimeret læsetid i minutter

Indhold:
${content}

Returner kun JSON uden yderligere tekst:`;

    const response = await this.openaiService.createChatCompletion([
      {
        role: 'system',
        content:
          'Du er en ekspert i uddannelsesindhold analyse. Returner altid valid JSON.',
      },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.3,
      max_tokens: 500,
    });

    try {
      const parsed = JSON.parse(response);
      // Sikr at arrays er defineret
      return {
        mainTopics: Array.isArray(parsed.mainTopics) ? parsed.mainTopics : ['Generelt emne'],
        keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : ['grundlæggende'],
        complexity: parsed.complexity || 'beginner',
        contentType: parsed.contentType || 'text',
        estimatedReadingTime: parsed.estimatedReadingTime || Math.ceil((content?.length || 0) / 1000),
      };
    } catch (error) {
      this.logger.warn('Kunne ikke parse content analysis, bruger fallback');
      return {
        mainTopics: ['Generelt emne'],
        keyTerms: ['grundlæggende'],
        complexity: 'beginner',
        contentType: 'text',
        estimatedReadingTime: Math.ceil((content?.length || 0) / 1000),
      };
    }
  }

  /**
   * Generer spørgsmål baseret på indhold og analyse
   */
  private async generateQuestions(
    content: string,
    analysis: ContentAnalysis,
    request: QuestionGenerationRequest,
  ): Promise<GeneratedQuestion[]> {
    const numberOfQuestions = request.numberOfQuestions || 5;
    const questionTypes = request.questionTypes || [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.FILL_IN_BLANK,
    ];
    const targetDifficulty =
      request.targetDifficulty || this.mapComplexityToDifficulty(analysis.complexity);

    const prompt = `
Generer ${numberOfQuestions} uddannelsesspørgsmål baseret på følgende indhold.

Indhold:
${content}

Analyse:
- Hovedemner: ${analysis.mainTopics.join(', ')}
- Nøgletermer: ${analysis.keyTerms.join(', ')}
- Kompleksitet: ${analysis.complexity}

Krav:
- Spørgsmålstyper: ${questionTypes.join(', ')}
- Sværhedsgrad: ${targetDifficulty}
- Fokusområder: ${request.focusAreas?.join(', ') || 'Alle emner'}

Returner JSON array med objekter der har følgende struktur:
{
  "text": "Spørgsmålstekst",
  "type": "MULTIPLE_CHOICE|FILL_IN_BLANK|ESSAY",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
  "points": 1-5,
  "answerOptions": [{ "text": "Svar", "isCorrect": true/false }], // kun for MULTIPLE_CHOICE
  "essayMinWords": 50, // kun for ESSAY
  "essayMaxWords": 200, // kun for ESSAY
  "reasoning": "Forklaring af hvorfor dette spørgsmål er relevant"
}

Returner kun JSON array uden yderligere tekst:`;

    const response = await this.openaiService.createChatCompletion([
      {
        role: 'system',
        content:
          'Du er en ekspert i at skabe uddannelsesspørgsmål. Lav relevante, præcise spørgsmål der tester forståelse. Returner altid valid JSON.',
      },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.7,
      max_tokens: 2000,
    });

    try {
      const parsed = JSON.parse(response);
      const questions = parsed.questions || parsed; // Håndter både {questions: [...]} og [...] format
      
      if (!Array.isArray(questions)) {
        this.logger.error('questions.map is not a function', { questions, parsed });
        throw new Error('AI-responsen indeholder ikke et array af spørgsmål');
      }
      
      return questions.map((q: any) => ({
        ...q,
        qualityScore: q.qualityScore || 0, // Brug eksisterende score eller 0
      }));
    } catch (error) {
      this.logger.error('Kunne ikke parse genererede spørgsmål', error);
      throw new Error('Fejl ved parsing af AI-genererede spørgsmål');
    }
  }

  /**
   * Evaluer kvaliteten af genererede spørgsmål
   */
  private async evaluateQuestionQuality(
    questions: GeneratedQuestion[],
  ): Promise<GeneratedQuestion[]> {
    const evaluatedQuestions = [];

    for (const question of questions) {
      const qualityScore = await this.calculateQualityScore(question);
      evaluatedQuestions.push({
        ...question,
        qualityScore,
      });
    }

    // Sorter efter kvalitet (højeste først)
    return evaluatedQuestions.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Beregn kvalitetsscore for et spørgsmål
   */
  private async calculateQualityScore(
    question: GeneratedQuestion,
  ): Promise<number> {
    let score = 50; // Base score

    // Evaluer spørgsmålstekst
    if (question.text.length > 20 && question.text.length < 200) score += 10;
    if (question.text.includes('?')) score += 5;
    if (!question.text.includes('hvad') && !question.text.includes('hvilken')) score += 5; // Undgå for simple spørgsmål

    // Evaluer svaroptioner for multiple choice
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.answerOptions) {
      const correctAnswers = question.answerOptions.filter(opt => opt.isCorrect);
      if (correctAnswers.length === 1) score += 15; // Præcis ét korrekt svar
      if (question.answerOptions.length >= 3 && question.answerOptions.length <= 5) score += 10;
      
      // Check for plausible distractors
      const avgAnswerLength = question.answerOptions.reduce((sum, opt) => sum + opt.text.length, 0) / question.answerOptions.length;
      if (avgAnswerLength > 5 && avgAnswerLength < 50) score += 10;
    }

    // Evaluer essay spørgsmål
    if (question.type === QuestionType.ESSAY) {
      if (question.essayMinWords && question.essayMinWords >= 25) score += 10;
      if (question.essayMaxWords && question.essayMaxWords <= 500) score += 10;
    }

    // Bonus for god reasoning
    if (question.reasoning && question.reasoning.length > 30) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map kompleksitet til sværhedsgrad
   */
  private mapComplexityToDifficulty(complexity: string): Difficulty {
    switch (complexity) {
      case 'beginner':
        return Difficulty.BEGINNER;
      case 'intermediate':
        return Difficulty.INTERMEDIATE;
      case 'advanced':
        return Difficulty.ADVANCED;
      default:
        return Difficulty.BEGINNER;
    }
  }

  /**
   * Log AI usage for monitoring
   */
  private async logAIUsage(
    operation: string,
    request: QuestionGenerationRequest,
    questionsGenerated: number,
  ): Promise<void> {
    try {
      await this.prisma.aIUsageLog.create({
        data: {
          operation,
          model: 'gpt-4',
          tokensUsed: Math.ceil(request.content.length / 4), // Rough estimate
          requestData: {
            contentType: request.contentType,
            contentId: request.contentId,
            numberOfQuestions: request.numberOfQuestions,
          },
          responseData: {
            questionsGenerated,
          },
          success: true,
        },
      });
    } catch (error) {
      this.logger.warn('Kunne ikke logge AI usage', error);
    }
  }

  /**
   * Generer spørgsmål fra eksisterende lesson content
   */
  async generateQuestionsFromLesson(
    lessonId: number,
    options: {
      numberOfQuestions?: number;
      questionTypes?: QuestionType[];
      targetDifficulty?: Difficulty;
    } = {},
  ): Promise<GeneratedQuestion[]> {
    // Hent lesson med content blocks
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        contentBlocks: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new Error(`Lesson med ID ${lessonId} ikke fundet`);
    }

    // Kombiner alt indhold fra content blocks
    const combinedContent = lesson.contentBlocks
      .map(block => block.content)
      .join('\n\n');

    if (!combinedContent.trim()) {
      throw new Error('Ingen indhold fundet i lesson til spørgsmålsgenerering');
    }

    return this.generateQuestionsFromContent({
      content: combinedContent,
      contentType: 'lesson',
      contentId: lessonId.toString(),
      ...options,
    });
  }

  /**
   * Generer spørgsmål fra topic (alle lessons)
   */
  async generateQuestionsFromTopic(
    topicId: number,
    options: {
      numberOfQuestions?: number;
      questionTypes?: QuestionType[];
      targetDifficulty?: Difficulty;
    } = {},
  ): Promise<GeneratedQuestion[]> {
    // Hent topic med lessons og content
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        lessons: {
          where: { deletedAt: null },
          include: {
            contentBlocks: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new Error(`Topic med ID ${topicId} ikke fundet`);
    }

    // Kombiner alt indhold fra alle lessons
    const combinedContent = topic.lessons
      .flatMap(lesson => lesson.contentBlocks)
      .map(block => block.content)
      .join('\n\n');

    if (!combinedContent.trim()) {
      throw new Error('Ingen indhold fundet i topic til spørgsmålsgenerering');
    }

    return this.generateQuestionsFromContent({
      content: combinedContent,
      contentType: 'topic',
      contentId: topicId.toString(),
      ...options,
    });
  }
}
