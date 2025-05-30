// apps/api/src/controllers/quiz.controller.nest.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/core';
import { QuizService } from './services/quiz.service';
import { QuestionType } from '@prisma/client';
import { QuizDto, CreateQuizDto, UpdateQuizDto } from './dto/quiz/quiz.dto';
import {
  QuestionDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from './dto/quiz/question.dto';
import {
  AnswerOptionDto,
  CreateAnswerOptionDto,
  UpdateAnswerOptionDto,
} from './dto/quiz/answerOption.dto';
import { PrismaService } from '../persistence/prisma/prisma.service';

// Udvid Express Request interface til at inkludere userId
interface RequestWithUser extends ExpressRequest {
  userId?: number;
}

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly prisma: PrismaService
  ) {}

  @ApiOperation({ summary: 'Hent alle quizzer' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle quizzer',
    type: [QuizDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get()
  async getAllQuizzes(): Promise<QuizDto[]> {
    try {
      return await this.prisma.quiz.findMany({
        include: {
          lesson: true,
          topic: true,
          questions: {
            include: {
              _count: {
                select: { answerOptions: true },
              },
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { title: 'asc' },
      });
    } catch (error) {
      console.error('Fejl ved hentning af quizzer:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quizzer',
      );
    }
  }

  @ApiOperation({ summary: 'Hent quizzer for en specifik lektion' })
  @ApiParam({ name: 'lessonId', description: 'ID for lektionen', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af quizzer for den angivne lektion',
    type: [QuizDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('lesson/:lessonId')
  async getQuizzesByLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<QuizDto[]> {
    try {
      return await this.prisma.quiz.findMany({
        where: { lessonId },
        include: {
          questions: {
            include: {
              _count: {
                select: { answerOptions: true },
              },
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { title: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af quizzer for lektion ${lessonId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quizzer',
      );
    }
  }

  @ApiOperation({ summary: 'Hent quizzer for et specifikt emne' })
  @ApiParam({ name: 'topicId', description: 'ID for emnet', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af quizzer for det angivne emne',
    type: [QuizDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('topic/:topicId')
  async getQuizzesByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<QuizDto[]> {
    try {
      return await this.prisma.quiz.findMany({
        where: { topicId },
        include: {
          questions: {
            include: {
              _count: {
                select: { answerOptions: true },
              },
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { title: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af quizzer for emne ${topicId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quizzer',
      );
    }
  }

  @ApiOperation({ summary: 'Hent en specifik quiz ud fra ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Den angivne quiz',
    type: QuizDto,
  })
  @ApiResponse({ status: 404, description: 'Quizzen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getQuizById(@Param('id', ParseIntPipe) id: number): Promise<QuizDto> {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
          lesson: true,
          topic: true,
          questions: {
            include: {
              answerOptions: true,
            },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quizzen blev ikke fundet');
      }

      return quiz;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af quiz med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af quizzen',
      );
    }
  }

  @ApiOperation({ summary: 'Opret en ny quiz' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Quizzen blev oprettet',
    type: QuizDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Lektionen eller emnet blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuiz(@Body() createQuizDto: CreateQuizDto): Promise<QuizDto> {
    const { title, description, lessonId, topicId } = createQuizDto;

    try {
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

      return await this.prisma.quiz.create({
        data: {
          title,
          description,
          lessonId: lessonId || null,
          topicId: topicId || null,
          timeLimit: createQuizDto.timeLimit || null,
          maxAttempts: createQuizDto.maxAttempts || null,
          randomizeQuestions: createQuizDto.randomizeQuestions || false,
          showAnswers:
            createQuizDto.showAnswers !== undefined
              ? createQuizDto.showAnswers
              : true,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Fejl ved oprettelse af quiz:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af quizzen',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater en eksisterende quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID', type: Number })
  @ApiBody({ type: UpdateQuizDto })
  @ApiResponse({
    status: 200,
    description: 'Quizzen blev opdateret',
    type: QuizDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Quizzen, lektionen eller emnet blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<QuizDto> {
    const { title, description, lessonId, topicId } = updateQuizDto;

    try {
      // Tjek om quizzen eksisterer
      const existingQuiz = await this.prisma.quiz.findUnique({
        where: { id },
      });

      if (!existingQuiz) {
        throw new NotFoundException('Quizzen blev ikke fundet');
      }

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

      return await this.prisma.quiz.update({
        where: { id },
        data: {
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
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af quiz med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af quizzen',
      );
    }
  }

  @ApiOperation({ summary: 'Slet en quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quizzen blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Quizzen kan ikke slettes, da der er quiz-forsøg tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Quizzen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteQuiz(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om quizzen eksisterer
      const existingQuiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
          attempts: true,
        },
      });

      if (!existingQuiz) {
        throw new NotFoundException('Quizzen blev ikke fundet');
      }

      // Tjek om der er quiz-forsøg tilknyttet quizzen
      if (existingQuiz.attempts.length > 0) {
        throw new BadRequestException(
          'Quizzen kan ikke slettes, da der er quiz-forsøg tilknyttet.',
        );
      }

      // Slet alle svarmuligheder for alle spørgsmål i quizzen
      for (const question of existingQuiz.questions) {
        if (question.answerOptions.length > 0) {
          await this.prisma.answerOption.deleteMany({
            where: { questionId: question.id },
          });
        }
      }

      // Slet alle spørgsmål i quizzen
      if (existingQuiz.questions.length > 0) {
        await this.prisma.question.deleteMany({
          where: { quizId: id },
        });
      }

      // Slet quizzen
      await this.prisma.quiz.delete({
        where: { id },
      });

      return { message: 'Quizzen blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af quiz med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af quizzen',
      );
    }
  }

  // Question endpoints
  @ApiOperation({ summary: 'Opret et nyt spørgsmål til en quiz' })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({
    status: 201,
    description: 'Spørgsmålet blev oprettet',
    type: QuestionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Quizzen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('questions')
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionDto> {
    const { text, type, quizId, answerOptions } = createQuestionDto;

    try {
      // Tjek om quizzen eksisterer
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new NotFoundException('Den angivne quiz findes ikke');
      }

      // Opret spørgsmålet
      const newQuestion = await this.prisma.question.create({
        data: {
          text,
          type,
          quizId,
        },
      });

      // Opret svarmuligheder, hvis de er angivet
      if (answerOptions && answerOptions.length > 0) {
        const answerOptionPromises = answerOptions.map((option) => {
          return this.prisma.answerOption.create({
            data: {
              text: option.text,
              isCorrect: option.isCorrect,
              questionId: newQuestion.id,
            },
          });
        });

        await Promise.all(answerOptionPromises);
      }

      // Hent det oprettede spørgsmål med svarmuligheder
      const questionWithOptions = await this.prisma.question.findUnique({
        where: { id: newQuestion.id },
        include: { answerOptions: true },
      });

      return questionWithOptions;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af spørgsmål:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af spørgsmålet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater et eksisterende spørgsmål' })
  @ApiParam({ name: 'id', description: 'Spørgsmål ID', type: Number })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({
    status: 200,
    description: 'Spørgsmålet blev opdateret',
    type: QuestionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Spørgsmålet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('questions/:id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionDto> {
    const { text, type } = updateQuestionDto;

    try {
      // Tjek om spørgsmålet eksisterer
      const existingQuestion = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!existingQuestion) {
        throw new NotFoundException('Spørgsmålet blev ikke fundet');
      }

      const updatedQuestion = await this.prisma.question.update({
        where: { id },
        data: {
          text: text || existingQuestion.text,
          type: type !== undefined ? type : existingQuestion.type,
        },
        include: { answerOptions: true },
      });

      return updatedQuestion;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af spørgsmål med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af spørgsmålet',
      );
    }
  }

  @ApiOperation({ summary: 'Slet et spørgsmål' })
  @ApiParam({ name: 'id', description: 'Spørgsmål ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Spørgsmålet blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Spørgsmålet kan ikke slettes, da der er brugerbesvarelser tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Spørgsmålet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('questions/:id')
  async deleteQuestion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om spørgsmålet eksisterer
      const existingQuestion = await this.prisma.question.findUnique({
        where: { id },
        include: { answerOptions: true, userAnswers: true },
      });

      if (!existingQuestion) {
        throw new NotFoundException('Spørgsmålet blev ikke fundet');
      }

      // Tjek om der er brugerbesvarelser tilknyttet spørgsmålet
      if (existingQuestion.userAnswers.length > 0) {
        throw new BadRequestException(
          'Spørgsmålet kan ikke slettes, da der er brugerbesvarelser tilknyttet.',
        );
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af spørgsmål med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af spørgsmålet',
      );
    }
  }

  // AnswerOption endpoints
  @ApiOperation({ summary: 'Opret en ny svarmulighed til et spørgsmål' })
  @ApiParam({ name: 'questionId', description: 'Spørgsmål ID', type: Number })
  @ApiBody({ type: CreateAnswerOptionDto })
  @ApiResponse({
    status: 201,
    description: 'Svarmuligheden blev oprettet',
    type: AnswerOptionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Spørgsmålet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('questions/:questionId/answer-options')
  @HttpCode(HttpStatus.CREATED)
  async createAnswerOption(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() createAnswerOptionDto: CreateAnswerOptionDto,
  ): Promise<AnswerOptionDto> {
    const { text, isCorrect } = createAnswerOptionDto;

    try {
      // Tjek om spørgsmålet eksisterer
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new NotFoundException('Det angivne spørgsmål findes ikke');
      }

      const newAnswerOption = await this.prisma.answerOption.create({
        data: {
          text,
          isCorrect,
          questionId,
        },
      });

      return newAnswerOption;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved oprettelse af svarmulighed for spørgsmål ${questionId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af svarmuligheden',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater en eksisterende svarmulighed' })
  @ApiParam({ name: 'id', description: 'Svarmulighed ID', type: Number })
  @ApiBody({ type: UpdateAnswerOptionDto })
  @ApiResponse({
    status: 200,
    description: 'Svarmuligheden blev opdateret',
    type: AnswerOptionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Svarmuligheden blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('answer-options/:id')
  async updateAnswerOption(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnswerOptionDto: UpdateAnswerOptionDto,
  ): Promise<AnswerOptionDto> {
    const { text, isCorrect } = updateAnswerOptionDto;

    try {
      // Tjek om svarmuligheden eksisterer
      const existingAnswerOption = await this.prisma.answerOption.findUnique({
        where: { id },
      });

      if (!existingAnswerOption) {
        throw new NotFoundException('Svarmuligheden blev ikke fundet');
      }

      const updatedAnswerOption = await this.prisma.answerOption.update({
        where: { id },
        data: {
          text: text || existingAnswerOption.text,
          isCorrect:
            isCorrect !== undefined
              ? isCorrect
              : existingAnswerOption.isCorrect,
        },
      });

      return updatedAnswerOption;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af svarmulighed med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af svarmuligheden',
      );
    }
  }

  @ApiOperation({ summary: 'Slet en svarmulighed' })
  @ApiParam({ name: 'id', description: 'Svarmulighed ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Svarmuligheden blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Svarmuligheden kan ikke slettes, da der er brugerbesvarelser tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Svarmuligheden blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('answer-options/:id')
  async deleteAnswerOption(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om svarmuligheden eksisterer
      const existingAnswerOption = await this.prisma.answerOption.findUnique({
        where: { id },
        include: { userAnswers: true },
      });

      if (!existingAnswerOption) {
        throw new NotFoundException('Svarmuligheden blev ikke fundet');
      }

      // Tjek om der er brugerbesvarelser tilknyttet svarmuligheden
      if (existingAnswerOption.userAnswers.length > 0) {
        throw new BadRequestException(
          'Svarmuligheden kan ikke slettes, da der er brugerbesvarelser tilknyttet.',
        );
      }

      await this.prisma.answerOption.delete({
        where: { id },
      });

      return { message: 'Svarmuligheden blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af svarmulighed med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af svarmuligheden',
      );
    }
  }
}
