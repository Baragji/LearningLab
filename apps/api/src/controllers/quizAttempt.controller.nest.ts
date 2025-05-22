// apps/api/src/controllers/quizAttempt.controller.nest.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ProgressStatus } from '@prisma/client';
import {
  QuizAttemptDto,
  CreateQuizAttemptDto,
  SubmitQuizAnswerDto,
  CompleteQuizAttemptDto,
  QuizAttemptResultDto,
  UserAnswerDto,
} from './dto/quiz-attempt/quiz-attempt.dto';

@ApiTags('Quiz Attempts')
@Controller('quiz-attempts')
export class QuizAttemptController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle quiz-forsøg for den aktuelle bruger' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle quiz-forsøg for brugeren',
    type: [QuizAttemptDto],
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserQuizAttempts(@Request() req): Promise<QuizAttemptDto[]> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      return await this.prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: true,
          _count: {
            select: { userAnswers: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af quiz-forsøg for bruger ${userId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quiz-forsøg',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt quiz-forsøg ud fra ID' })
  @ApiParam({ name: 'id', description: 'Quiz-forsøg ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Det angivne quiz-forsøg',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Ikke adgang til dette quiz-forsøg',
  })
  @ApiResponse({ status: 404, description: 'Quiz-forsøget blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getQuizAttemptById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<QuizAttemptDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      const quizAttempt = await this.prisma.quizAttempt.findUnique({
        where: { id },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answerOptions: true,
                },
              },
            },
          },
          userAnswers: {
            include: {
              question: true,
              selectedAnswerOption: true,
            },
          },
        },
      });

      if (!quizAttempt) {
        throw new NotFoundException('Quiz-forsøget blev ikke fundet');
      }

      // Tjek om quiz-forsøget tilhører den aktuelle bruger
      if (quizAttempt.userId !== userId) {
        throw new ForbiddenException(
          'Du har ikke adgang til dette quiz-forsøg',
        );
      }

      return quizAttempt;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error(`Fejl ved hentning af quiz-forsøg med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quiz-forsøget',
      );
    }
  }

  @ApiOperation({ summary: 'Start et nyt quiz-forsøg' })
  @ApiBody({ type: CreateQuizAttemptDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz-forsøget blev startet',
    type: QuizAttemptDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Quizzen har ingen spørgsmål',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 404, description: 'Quizzen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startQuizAttempt(
    @Body() createQuizAttemptDto: CreateQuizAttemptDto,
    @Request() req,
  ): Promise<QuizAttemptDto> {
    const { quizId } = createQuizAttemptDto;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Tjek om quizzen eksisterer
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      });

      if (!quiz) {
        throw new NotFoundException('Den angivne quiz findes ikke');
      }

      // Tjek om quizzen har spørgsmål
      if (quiz.questions.length === 0) {
        throw new BadRequestException('Quizzen har ingen spørgsmål');
      }

      // Opret et nyt quiz-forsøg
      const newQuizAttempt = await this.prisma.quizAttempt.create({
        data: {
          userId,
          quizId,
          score: 0,
          startedAt: new Date(),
        },
      });

      // Opdater eller opret brugerens fremskridt for denne quiz
      const existingProgress = await this.prisma.userProgress.findFirst({
        where: {
          userId,
          quizId,
        },
      });

      if (existingProgress) {
        await this.prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: ProgressStatus.IN_PROGRESS,
            quizAttemptId: newQuizAttempt.id,
          },
        });
      } else {
        await this.prisma.userProgress.create({
          data: {
            userId,
            quizId,
            status: ProgressStatus.IN_PROGRESS,
            quizAttemptId: newQuizAttempt.id,
          },
        });
      }

      return newQuizAttempt;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error(`Fejl ved start af quiz-forsøg for quiz ${quizId}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved start af quiz-forsøget',
      );
    }
  }

  @ApiOperation({ summary: 'Indsend et svar på et spørgsmål i et quiz-forsøg' })
  @ApiBody({ type: SubmitQuizAnswerDto })
  @ApiResponse({
    status: 200,
    description: 'Svaret blev opdateret',
    type: UserAnswerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Svaret blev oprettet',
    type: UserAnswerDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ugyldig anmodning - Quiz-forsøget er allerede afsluttet eller spørgsmålet tilhører ikke denne quiz',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Ikke adgang til dette quiz-forsøg',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz-forsøget eller spørgsmålet blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('submit-answer')
  async submitAnswer(
    @Body() submitQuizAnswerDto: SubmitQuizAnswerDto,
    @Request() req,
  ): Promise<UserAnswerDto> {
    const { quizAttemptId, questionId, selectedAnswerOptionId, inputText } =
      submitQuizAnswerDto;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Tjek om quiz-forsøget eksisterer og tilhører brugeren
      const quizAttempt = await this.prisma.quizAttempt.findUnique({
        where: { id: quizAttemptId },
        include: { quiz: true },
      });

      if (!quizAttempt) {
        throw new NotFoundException('Quiz-forsøget blev ikke fundet');
      }

      if (quizAttempt.userId !== userId) {
        throw new ForbiddenException(
          'Du har ikke adgang til dette quiz-forsøg',
        );
      }

      // Tjek om quiz-forsøget er afsluttet
      if (quizAttempt.completedAt) {
        throw new BadRequestException('Quiz-forsøget er allerede afsluttet');
      }

      // Tjek om spørgsmålet eksisterer og tilhører quizzen
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
        include: { answerOptions: true },
      });

      if (!question) {
        throw new NotFoundException('Spørgsmålet blev ikke fundet');
      }

      if (question.quizId !== quizAttempt.quizId) {
        throw new BadRequestException('Spørgsmålet tilhører ikke denne quiz');
      }

      // Tjek om der allerede er et svar på dette spørgsmål i dette forsøg
      const existingAnswer = await this.prisma.userAnswer.findFirst({
        where: {
          quizAttemptId,
          questionId,
        },
      });

      // Hvis der er et eksisterende svar, opdater det
      if (existingAnswer) {
        return await this.prisma.userAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedAnswerOptionId: selectedAnswerOptionId || null,
            inputText: inputText || null,
          },
        });
      }

      // Ellers opret et nyt svar
      return await this.prisma.userAnswer.create({
        data: {
          quizAttemptId,
          questionId,
          selectedAnswerOptionId: selectedAnswerOptionId || null,
          inputText: inputText || null,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved indsendelse af svar for quiz-forsøg ${quizAttemptId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved indsendelse af svaret',
      );
    }
  }

  @ApiOperation({ summary: 'Afslut et quiz-forsøg og beregn scoren' })
  @ApiBody({ type: CompleteQuizAttemptDto })
  @ApiResponse({
    status: 200,
    description: 'Quiz-forsøget blev afsluttet og scoren beregnet',
    type: QuizAttemptResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Quiz-forsøget er allerede afsluttet',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Ikke adgang til dette quiz-forsøg',
  })
  @ApiResponse({ status: 404, description: 'Quiz-forsøget blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('complete')
  async completeQuizAttempt(
    @Body() completeQuizAttemptDto: CompleteQuizAttemptDto,
    @Request() req,
  ): Promise<QuizAttemptResultDto> {
    const { quizAttemptId } = completeQuizAttemptDto;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Tjek om quiz-forsøget eksisterer og tilhører brugeren
      const quizAttempt = await this.prisma.quizAttempt.findUnique({
        where: { id: quizAttemptId },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answerOptions: true,
                },
              },
            },
          },
          userAnswers: {
            include: {
              selectedAnswerOption: true,
            },
          },
        },
      });

      if (!quizAttempt) {
        throw new NotFoundException('Quiz-forsøget blev ikke fundet');
      }

      if (quizAttempt.userId !== userId) {
        throw new ForbiddenException(
          'Du har ikke adgang til dette quiz-forsøg',
        );
      }

      // Tjek om quiz-forsøget allerede er afsluttet
      if (quizAttempt.completedAt) {
        throw new BadRequestException('Quiz-forsøget er allerede afsluttet');
      }

      // Beregn scoren
      let score = 0;
      const totalQuestions = quizAttempt.quiz.questions.length;

      // For hvert spørgsmål, tjek om svaret er korrekt
      for (const question of quizAttempt.quiz.questions) {
        const userAnswer = quizAttempt.userAnswers.find(
          (answer) => answer.questionId === question.id,
        );

        if (
          userAnswer &&
          userAnswer.selectedAnswerOption &&
          userAnswer.selectedAnswerOption.isCorrect
        ) {
          score += 1;
        }
      }

      // Beregn procentvis score (0-100)
      const percentageScore =
        totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

      // Opdater quiz-forsøget med score og afslutningsdato
      const updatedQuizAttempt = await this.prisma.quizAttempt.update({
        where: { id: quizAttemptId },
        data: {
          score: percentageScore,
          completedAt: new Date(),
        },
      });

      // Opdater brugerens fremskridt for denne quiz
      await this.prisma.userProgress.updateMany({
        where: {
          userId,
          quizId: quizAttempt.quizId,
        },
        data: {
          status: ProgressStatus.COMPLETED,
          score: percentageScore,
        },
      });

      return {
        ...updatedQuizAttempt,
        totalQuestions,
        correctAnswers: score,
        percentageScore,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved afslutning af quiz-forsøg ${quizAttemptId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved afslutning af quiz-forsøget',
      );
    }
  }
}
