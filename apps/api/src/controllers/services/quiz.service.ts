// apps/api/src/controllers/services/quiz.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  BaseService,
  PaginationOptions,
  PaginatedResult,
} from '../../common/services/base.service';
import { Quiz, Question, AnswerOption, QuestionType } from '@prisma/client';
import { CreateQuizDto, UpdateQuizDto } from '../dto/quiz/quiz.dto';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/quiz/question.dto';
import {
  CreateAnswerOptionDto,
  UpdateAnswerOptionDto,
} from '../dto/quiz/answerOption.dto';

@Injectable()
export class QuizService extends BaseService<Quiz> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Finder alle quizzer
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med quizzer
   */
  async findAllQuizzes(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Quiz>> {
    // Tilføj standard include for quizzer
    const include = {
      ...options.include,
      questions: options.include?.questions ?? false,
      lesson: options.include?.lesson ?? false,
      topic: options.include?.topic ?? false,
    };

    // Tilføj filter for slettede quizzer
    const filter = {
      ...options.filter,
      deletedAt: null,
    };

    return this.findAll({ ...options, include, filter });
  }

  /**
   * Finder quizzer for et specifikt topic
   * @param topicId Topic ID
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med quizzer
   */
  async findQuizzesByTopic(
    topicId: number,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Quiz>> {
    // Tilføj standard include for quizzer
    const include = {
      ...options.include,
      questions: options.include?.questions ?? false,
      lesson: options.include?.lesson ?? false,
      topic: options.include?.topic ?? false,
    };

    // Tilføj topicId til filteret
    const filter = {
      ...options.filter,
      topicId,
      deletedAt: null,
    };

    return this.findAll({ ...options, include, filter });
  }

  /**
   * Finder quizzer for en specifik lektion
   * @param lessonId Lektion ID
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med quizzer
   */
  async findQuizzesByLesson(
    lessonId: number,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Quiz>> {
    // Tilføj standard include for quizzer
    const include = {
      ...options.include,
      questions: options.include?.questions ?? false,
      lesson: options.include?.lesson ?? false,
      topic: options.include?.topic ?? false,
    };

    // Tilføj lessonId til filteret
    const filter = {
      ...options.filter,
      lessonId,
      deletedAt: null,
    };

    return this.findAll({ ...options, include, filter });
  }

  /**
   * Finder en quiz ud fra ID
   * @param id Quiz ID
   * @param includeQuestions Om spørgsmål skal inkluderes
   * @returns Quiz eller null hvis ikke fundet
   */
  async findQuizById(
    id: number,
    includeQuestions: boolean = false,
  ): Promise<Quiz | null> {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: includeQuestions
        ? {
            questions: {
              orderBy: { id: 'asc' },
              include: {
                answerOptions: {
                  orderBy: { id: 'asc' },
                },
              },
            },
            lesson: true,
            topic: true,
          }
        : undefined,
    });

    if (!quiz) {
      throw new NotFoundException('Quizzen blev ikke fundet');
    }

    return quiz;
  }

  /**
   * Opretter en ny quiz
   * @param createQuizDto DTO med quiz data
   * @param userId ID på brugeren der opretter quizzen
   * @returns Den oprettede quiz
   */
  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId?: number,
  ): Promise<Quiz> {
    const { title, description, lessonId, topicId } = createQuizDto;

    // Tjek om enten lektion eller topic er angivet
    if (!lessonId && !topicId) {
      throw new BadRequestException(
        'Enten lessonId eller topicId skal angives',
      );
    }

    // Tjek om lektionen eksisterer, hvis angivet
    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Den angivne lektion findes ikke');
      }
    }

    // Tjek om emnet eksisterer, hvis angivet
    if (topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic) {
        throw new NotFoundException('Det angivne emne findes ikke');
      }
    }

    return this.create(
      {
        title,
        description,
        lessonId: lessonId || null,
        topicId: topicId || null,
        timeLimit: createQuizDto.timeLimit || null,
        maxAttempts: createQuizDto.maxAttempts || null,
        randomizeQuestions: createQuizDto.randomizeQuestions || false,
        showAnswers: createQuizDto.showAnswers ?? true,
        passingScore: createQuizDto.passingScore || null,
        issueCertificate: createQuizDto.issueCertificate || false,
        questionBankCategory: createQuizDto.questionBankCategory || null,
        tags: createQuizDto.tags || [],
      },
      userId,
    );
  }

  /**
   * Opdaterer en eksisterende quiz
   * @param id Quiz ID
   * @param updateQuizDto DTO med opdateret quiz data
   * @param userId ID på brugeren der opdaterer quizzen
   * @returns Den opdaterede quiz
   */
  async updateQuiz(
    id: number,
    updateQuizDto: UpdateQuizDto,
    userId?: number,
  ): Promise<Quiz> {
    const { title, description, lessonId, topicId } = updateQuizDto;

    // Tjek om quizzen eksisterer
    const existingQuiz = await this.findById(id);

    // Tjek om lektionen eksisterer, hvis angivet
    if (lessonId !== undefined && lessonId !== null) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Den angivne lektion findes ikke');
      }
    }

    // Tjek om emnet eksisterer, hvis angivet
    if (topicId !== undefined && topicId !== null) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic) {
        throw new NotFoundException('Det angivne emne findes ikke');
      }
    }

    return this.update(
      id,
      {
        title: title || existingQuiz.title,
        description: description || existingQuiz.description,
        lessonId: lessonId !== undefined ? lessonId : existingQuiz.lessonId,
        topicId: topicId !== undefined ? topicId : existingQuiz.topicId,
        timeLimit:
          updateQuizDto.timeLimit !== undefined
            ? updateQuizDto.timeLimit
            : existingQuiz.timeLimit,
        maxAttempts:
          updateQuizDto.maxAttempts !== undefined
            ? updateQuizDto.maxAttempts
            : existingQuiz.maxAttempts,
        randomizeQuestions:
          updateQuizDto.randomizeQuestions !== undefined
            ? updateQuizDto.randomizeQuestions
            : existingQuiz.randomizeQuestions,
        showAnswers:
          updateQuizDto.showAnswers !== undefined
            ? updateQuizDto.showAnswers
            : existingQuiz.showAnswers,
        passingScore:
          updateQuizDto.passingScore !== undefined
            ? updateQuizDto.passingScore
            : existingQuiz.passingScore,
        issueCertificate:
          updateQuizDto.issueCertificate !== undefined
            ? updateQuizDto.issueCertificate
            : existingQuiz.issueCertificate,
        questionBankCategory:
          updateQuizDto.questionBankCategory !== undefined
            ? updateQuizDto.questionBankCategory
            : existingQuiz.questionBankCategory,
        tags:
          updateQuizDto.tags !== undefined
            ? updateQuizDto.tags
            : existingQuiz.tags,
      },
      userId,
    );
  }

  /**
   * Sletter en quiz (soft delete)
   * @param id Quiz ID
   * @param userId ID på brugeren der sletter quizzen
   * @returns Den slettede quiz
   */
  async deleteQuiz(id: number, userId?: number): Promise<Quiz> {
    // Tjek om quizzen eksisterer
    const existingQuiz = await this.findById(id);

    // Hent alle spørgsmål for quizzen
    const questions = await this.prisma.question.findMany({
      where: { quizId: id },
    });

    // Slet alle svar på spørgsmål i quizzen
    if (questions && questions.length > 0) {
      for (const question of questions) {
        await this.prisma.answerOption.deleteMany({
          where: { questionId: question.id },
        });
      }

      // Slet alle spørgsmål i quizzen
      await this.prisma.question.deleteMany({
        where: { quizId: id },
      });
    }

    // Soft delete quizzen
    return this.softDelete(id, userId);
  }

  /**
   * Opretter et nyt spørgsmål til en quiz
   * @param quizId Quiz ID
   * @param createQuestionDto DTO med spørgsmål data
   * @param userId ID på brugeren der opretter spørgsmålet
   * @returns Det oprettede spørgsmål med svarmuligheder
   */
  async createQuestion(
    quizId: number,
    createQuestionDto: CreateQuestionDto,
    userId?: number,
  ): Promise<Question> {
    const { text, type, answerOptions } = createQuestionDto;

    // Tjek om quizzen eksisterer
    const quiz = await this.findById(quizId);

    // Opret spørgsmålet
    const newQuestion = await this.prisma.question.create({
      data: {
        text,
        type: type as QuestionType,
        quizId,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
      include: {
        answerOptions: true,
      },
    });

    // Opret svarmuligheder hvis angivet
    if (answerOptions && answerOptions.length > 0) {
      const answerOptionPromises = answerOptions.map((option, index) => {
        return this.prisma.answerOption.create({
          data: {
            text: option.text,
            isCorrect: option.isCorrect || false,
            questionId: newQuestion.id,
            createdBy: userId || null,
            updatedBy: userId || null,
          },
        });
      });

      await Promise.all(answerOptionPromises);
    }

    // Hent det oprettede spørgsmål med svarmuligheder
    const questionWithOptions = await this.prisma.question.findUnique({
      where: { id: newQuestion.id },
      include: {
        answerOptions: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return questionWithOptions;
  }

  /**
   * Opdaterer et eksisterende spørgsmål
   * @param id Spørgsmål ID
   * @param updateQuestionDto DTO med opdateret spørgsmål data
   * @param userId ID på brugeren der opdaterer spørgsmålet
   * @returns Det opdaterede spørgsmål
   */
  async updateQuestion(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId?: number,
  ): Promise<Question> {
    const { text, type } = updateQuestionDto;

    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await this.prisma.question.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!existingQuestion) {
      throw new NotFoundException('Spørgsmålet blev ikke fundet');
    }

    // Opdater spørgsmålet
    const updatedQuestion = await this.prisma.question.update({
      where: { id },
      data: {
        text: text || existingQuestion.text,
        type:
          type !== undefined ? (type as QuestionType) : existingQuestion.type,
        updatedBy: userId || null,
        updatedAt: new Date(),
      },
      include: {
        answerOptions: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return updatedQuestion;
  }

  /**
   * Sletter et spørgsmål
   * @param id Spørgsmål ID
   * @param userId ID på brugeren der sletter spørgsmålet
   * @returns Besked om at spørgsmålet er slettet
   */
  async deleteQuestion(
    id: number,
    userId?: number,
  ): Promise<{ message: string }> {
    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await this.prisma.question.findUnique({
      where: { id },
      include: {
        answerOptions: true,
      },
    });

    if (!existingQuestion) {
      throw new NotFoundException('Spørgsmålet blev ikke fundet');
    }

    // Slet alle svarmuligheder for spørgsmålet
    if (existingQuestion.answerOptions.length > 0) {
      await this.prisma.answerOption.deleteMany({
        where: { questionId: id },
      });
    }

    // Slet spørgsmålet
    await this.prisma.question.delete({
      where: { id },
    });

    return { message: 'Spørgsmålet blev slettet' };
  }

  /**
   * Opretter en ny svarmulighed til et spørgsmål
   * @param questionId Spørgsmål ID
   * @param createAnswerOptionDto DTO med svarmulighed data
   * @param userId ID på brugeren der opretter svarmuligheden
   * @returns Den oprettede svarmulighed
   */
  async createAnswerOption(
    questionId: number,
    createAnswerOptionDto: CreateAnswerOptionDto,
    userId?: number,
  ): Promise<AnswerOption> {
    const { text, isCorrect } = createAnswerOptionDto;

    // Tjek om spørgsmålet eksisterer
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Spørgsmålet blev ikke fundet');
    }

    // Opret svarmuligheden
    const newAnswerOption = await this.prisma.answerOption.create({
      data: {
        text,
        isCorrect: isCorrect || false,
        questionId,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });

    return newAnswerOption;
  }

  /**
   * Opdaterer en eksisterende svarmulighed
   * @param id Svarmulighed ID
   * @param updateAnswerOptionDto DTO med opdateret svarmulighed data
   * @param userId ID på brugeren der opdaterer svarmuligheden
   * @returns Den opdaterede svarmulighed
   */
  async updateAnswerOption(
    id: number,
    updateAnswerOptionDto: UpdateAnswerOptionDto,
    userId?: number,
  ): Promise<AnswerOption> {
    const { text, isCorrect } = updateAnswerOptionDto;

    // Tjek om svarmuligheden eksisterer
    const existingAnswerOption = await this.prisma.answerOption.findUnique({
      where: { id },
      include: {
        question: true,
      },
    });

    if (!existingAnswerOption) {
      throw new NotFoundException('Svarmuligheden blev ikke fundet');
    }

    // Opdater svarmuligheden
    const updatedAnswerOption = await this.prisma.answerOption.update({
      where: { id },
      data: {
        text: text !== undefined ? text : existingAnswerOption.text,
        isCorrect:
          isCorrect !== undefined ? isCorrect : existingAnswerOption.isCorrect,
        updatedBy: userId || null,
      },
    });

    return updatedAnswerOption;
  }

  /**
   * Sletter en svarmulighed
   * @param id Svarmulighed ID
   * @param userId ID på brugeren der sletter svarmuligheden
   * @returns Besked om at svarmuligheden er slettet
   */
  async deleteAnswerOption(
    id: number,
    userId?: number,
  ): Promise<{ message: string }> {
    // Tjek om svarmuligheden eksisterer
    const existingAnswerOption = await this.prisma.answerOption.findUnique({
      where: { id },
    });

    if (!existingAnswerOption) {
      throw new NotFoundException('Svarmuligheden blev ikke fundet');
    }

    // Slet svarmuligheden
    await this.prisma.answerOption.delete({
      where: { id },
    });

    return { message: 'Svarmuligheden blev slettet' };
  }

  /**
   * Returnerer modelnavnet for Prisma-klienten
   */
  protected getModelName(): string {
    return 'quiz';
  }

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   */
  protected getModelDisplayName(): string {
    return 'Quiz';
  }
}
