import { Injectable, Logger } from '@nestjs/common';
import { QuestionType, Difficulty } from '@prisma/client';
import { ContentAnalyzer } from './content-analyzer';
import { QuestionGenerator } from './question-generator';
import { QualityEvaluator } from './quality-evaluator';
import { AIUsageLogger } from './ai-usage-logger';
import { ContentFetcher } from './content-fetcher';
import { GeneratedQuestion, QuestionGenerationRequest } from './types';

/**
 * Hovedservice for AI-drevet spørgsmålsgenerering
 * Koordinerer mellem forskellige moduler for at generere kvalitetsspørgsmål
 */
@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private readonly contentAnalyzer: ContentAnalyzer,
    private readonly questionGenerator: QuestionGenerator,
    private readonly qualityEvaluator: QualityEvaluator,
    private readonly aiUsageLogger: AIUsageLogger,
    private readonly contentFetcher: ContentFetcher,
  ) {}

  /**
   * Generer spørgsmål fra indhold
   */
  async generateQuestionsFromContent(
    request: QuestionGenerationRequest,
  ): Promise<GeneratedQuestion[]> {
    try {
      this.logger.log(
        `Genererer spørgsmål for ${request.contentType} ${request.contentId}`,
      );

      // 1. Analyser indholdet
      const analysis = await this.contentAnalyzer.analyzeContent(
        request.content,
      );
      this.logger.debug('Content analysis completed', analysis);

      // 2. Generer spørgsmål baseret på analyse
      const questions = await this.questionGenerator.generateQuestions(
        request.content,
        analysis,
        request,
      );
      this.logger.debug(`Generated ${questions.length} questions`);

      // 3. Evaluer kvalitet af spørgsmål
      const evaluatedQuestions =
        await this.qualityEvaluator.evaluateQuestions(questions);

      // 4. Log AI usage
      await this.aiUsageLogger.logUsage(
        'question_generation',
        request,
        evaluatedQuestions.length,
      );

      return evaluatedQuestions;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log fejl
      await this.aiUsageLogger.logUsage(
        'question_generation',
        request,
        0,
        false,
        errorMessage,
      );

      this.logger.error(
        `Fejl ved generering af spørgsmål: ${errorMessage}`,
        error,
      );
      throw new Error(`Failed to generate questions: ${errorMessage}`);
    }
  }

  /**
   * Generer spørgsmål fra en lesson
   */
  async generateQuestionsFromLesson(
    lessonId: number,
    options: {
      numberOfQuestions?: number;
      questionTypes?: QuestionType[];
      targetDifficulty?: Difficulty;
    } = {},
  ): Promise<GeneratedQuestion[]> {
    const content = await this.contentFetcher.fetchLessonContent(lessonId);

    return this.generateQuestionsFromContent({
      content,
      contentType: 'lesson',
      contentId: lessonId.toString(),
      ...options,
    });
  }

  /**
   * Generer spørgsmål fra et topic
   */
  async generateQuestionsFromTopic(
    topicId: number,
    options: {
      numberOfQuestions?: number;
      questionTypes?: QuestionType[];
      targetDifficulty?: Difficulty;
    } = {},
  ): Promise<GeneratedQuestion[]> {
    const content = await this.contentFetcher.fetchTopicContent(topicId);

    return this.generateQuestionsFromContent({
      content,
      contentType: 'topic',
      contentId: topicId.toString(),
      ...options,
    });
  }

  /**
   * Generer spørgsmål fra et course
   */
  async generateQuestionsFromCourse(
    courseId: number,
    options: {
      numberOfQuestions?: number;
      questionTypes?: QuestionType[];
      targetDifficulty?: Difficulty;
      focusAreas?: string[];
    } = {},
  ): Promise<GeneratedQuestion[]> {
    const content = await this.contentFetcher.fetchCourseContent(courseId);

    return this.generateQuestionsFromContent({
      content,
      contentType: 'course',
      contentId: courseId.toString(),
      ...options,
    });
  }

  /**
   * Hent AI usage statistik
   */
  async getUsageStatistics(startDate?: Date, endDate?: Date) {
    return this.aiUsageLogger.getUsageStats(startDate, endDate);
  }

  /**
   * Valider genererede spørgsmål
   */
  validateGeneratedQuestions(questions: GeneratedQuestion[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    questions.forEach((question, index) => {
      // Valider spørgsmålstekst
      if (!question.text || question.text.length < 10) {
        issues.push(`Spørgsmål ${index + 1}: Tekst er for kort eller mangler`);
      }

      // Valider multiple choice
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        if (!question.answerOptions || question.answerOptions.length < 2) {
          issues.push(`Spørgsmål ${index + 1}: Mangler svarmuligheder`);
        } else {
          const correctAnswers = question.answerOptions.filter(
            (opt) => opt.isCorrect,
          );
          if (correctAnswers.length !== 1) {
            issues.push(
              `Spørgsmål ${index + 1}: Skal have præcis ét korrekt svar`,
            );
          }
        }
      }

      // Valider essay
      if (question.type === QuestionType.ESSAY) {
        if (!question.essayMinWords || !question.essayMaxWords) {
          issues.push(`Spørgsmål ${index + 1}: Mangler ordgrænser for essay`);
        }
      }

      // Valider kvalitetsscore
      if (question.qualityScore < 50) {
        issues.push(
          `Spørgsmål ${index + 1}: Lav kvalitetsscore (${question.qualityScore})`,
        );
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
