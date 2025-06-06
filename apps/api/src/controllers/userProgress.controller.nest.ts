// apps/api/src/controllers/userProgress.controller.nest.ts
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ProgressStatus, Role } from '@prisma/client';
import {
  UserProgressDto,
  UpdateLessonProgressDto,
  UpdateQuizProgressDto,
  CourseProgressDto,
} from './dto/user-progress/user-progress.dto';

@ApiTags('User Progress')
@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent fremskridt for den aktuelle bruger' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle fremskridtsregistreringer for brugeren',
    type: [UserProgressDto],
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserProgress(@Request() req): Promise<UserProgressDto[]> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      return await this.prisma.userProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              topic: {
                include: {
                  course: {
                    include: {
                      educationProgram: true,
                    },
                  },
                },
              },
            },
          },
          quiz: true,
          quizAttempt: true,
        },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af fremskridt for bruger ${userId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fremskridt',
      );
    }
  }

  @ApiOperation({
    summary: 'Hent fremskridt for en specifik bruger (kun for admin)',
  })
  @ApiParam({ name: 'userId', description: 'Bruger ID', type: Number })
  @ApiResponse({
    status: 200,
    description:
      'Liste af alle fremskridtsregistreringer for den angivne bruger',
    type: [UserProgressDto],
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan se andre brugeres fremskridt',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId')
  async getUserProgressById(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ): Promise<UserProgressDto[]> {
    const currentUserId = req.user?.id;
    const isAdmin = req.user?.role === Role.ADMIN;

    if (!currentUserId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    // Kun admin kan se andre brugeres fremskridt
    if (userId !== currentUserId && !isAdmin) {
      throw new ForbiddenException(
        'Du har ikke tilladelse til at se denne brugers fremskridt',
      );
    }

    try {
      return await this.prisma.userProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              topic: {
                include: {
                  course: {
                    include: {
                      educationProgram: true,
                    },
                  },
                },
              },
            },
          },
          quiz: true,
          quizAttempt: true,
        },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af fremskridt for bruger ${userId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fremskridt',
      );
    }
  }

  @ApiOperation({ summary: 'Hent fremskridt for en specifik lektion' })
  @ApiParam({ name: 'lessonId', description: 'Lektion ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Fremskridtsregistrering for den angivne lektion',
    type: UserProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  async getLessonProgress(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Request() req,
  ): Promise<UserProgressDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Tjek om lektionen eksisterer
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Hent eller opret fremskridt for lektionen
      let progress = await this.prisma.userProgress.findFirst({
        where: {
          userId,
          lessonId,
        },
      });

      if (!progress) {
        // Hvis der ikke findes fremskridt, opret det med status NOT_STARTED
        progress = await this.prisma.userProgress.create({
          data: {
            userId,
            lessonId,
            status: ProgressStatus.NOT_STARTED,
          },
        });
      }

      return progress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved hentning af fremskridt for lektion ${lessonId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fremskridt',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater fremskridt for en specifik lektion' })
  @ApiParam({ name: 'lessonId', description: 'Lektion ID', type: Number })
  @ApiBody({ type: UpdateLessonProgressDto })
  @ApiResponse({
    status: 200,
    description: 'Fremskridtsregistrering blev opdateret',
    type: UserProgressDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Ugyldig status',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('lesson/:lessonId')
  async updateLessonProgress(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() updateLessonProgressDto: UpdateLessonProgressDto,
    @Request() req,
  ): Promise<UserProgressDto> {
    const { status } = updateLessonProgressDto;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    // Valider status
    if (!Object.values(ProgressStatus).includes(status)) {
      throw new BadRequestException('Ugyldig status');
    }

    try {
      // Tjek om lektionen eksisterer
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Opdater eller opret fremskridt for lektionen
      const existingProgress = await this.prisma.userProgress.findFirst({
        where: {
          userId,
          lessonId,
        },
      });

      if (existingProgress) {
        return await this.prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            status,
          },
        });
      } else {
        return await this.prisma.userProgress.create({
          data: {
            userId,
            lessonId,
            status,
          },
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved opdatering af fremskridt for lektion ${lessonId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af fremskridt',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater brugerens fremskridt for en quiz' })
  @ApiBody({ type: UpdateQuizProgressDto })
  @ApiResponse({
    status: 200,
    description: 'Fremskridtsregistrering blev opdateret',
    type: UserProgressDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Manglende påkrævede felter',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 404, description: 'Quizzen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('quiz')
  async updateQuizProgress(
    @Body() updateQuizProgressDto: UpdateQuizProgressDto,
    @Request() req,
  ): Promise<UserProgressDto> {
    const { quizId, score, answers, completedAt } = updateQuizProgressDto;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Tjek om quizzen eksisterer
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new NotFoundException('Quizzen blev ikke fundet');
      }

      // Find eksisterende fremskridt eller opret nyt
      const existingProgress = await this.prisma.userProgress.findFirst({
        where: {
          userId,
          quizId,
        },
      });

      let progress;
      if (existingProgress) {
        progress = await this.prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: ProgressStatus.COMPLETED,
            score,
            updatedAt: new Date(),
          },
        });
      } else {
        progress = await this.prisma.userProgress.create({
          data: {
            userId,
            quizId,
            status: ProgressStatus.COMPLETED,
            score,
          },
        });
      }

      // Hvis der er svar, gem dem også
      if (answers && answers.length > 0) {
        // Opret en quiz-attempt hvis der ikke allerede findes en
        const quizAttempt = await this.prisma.quizAttempt.create({
          data: {
            userId,
            quizId,
            score,
            startedAt: new Date(),
            completedAt: completedAt || new Date(),
          },
        });

        // Update the UserProgress to link to this QuizAttempt
        await this.prisma.userProgress.update({
          where: { id: progress.id },
          data: {
            quizAttemptId: quizAttempt.id,
          },
        });

        // Gem svarene
        for (const answer of answers) {
          await this.prisma.userAnswer.create({
            data: {
              quizAttemptId: quizAttempt.id,
              questionId: answer.questionId,
              selectedAnswerOptionId: answer.selectedOptionId,
            },
          });
        }
      }

      return progress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af quiz fremskridt:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af fremskridt',
      );
    }
  }

  @ApiOperation({ summary: 'Hent fremskridt for et specifikt kursus' })
  @ApiParam({ name: 'courseId', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Samlet fremskridt for det angivne kursus',
    type: CourseProgressDto,
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  async getCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Request() req,
  ): Promise<CourseProgressDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          educationProgram: true,
          topics: {
            orderBy: { order: 'asc' },
            include: {
              lessons: true,
              quizzes: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException('Kurset blev ikke fundet');
      }

      const progressPromises = course.topics.flatMap((topic) => [
        ...topic.lessons.map((lesson) =>
          this.prisma.userProgress.findFirst({
            where: { userId, lessonId: lesson.id },
          }),
        ),
        ...topic.quizzes.map((quiz) =>
          this.prisma.userProgress.findFirst({
            where: { userId, quizId: quiz.id },
          }),
        ),
      ]);

      const progressResults = await Promise.all(progressPromises);

      let totalLessons = 0;
      let completedLessons = 0;
      let inProgressLessons = 0;
      let totalQuizzes = 0;
      let completedQuizzes = 0;
      let inProgressQuizzes = 0;

      course.topics.forEach((topic) => {
        totalLessons += topic.lessons.length;
        totalQuizzes += topic.quizzes.length;

        topic.lessons.forEach((lesson) => {
          const lessonProgress = progressResults.find(
            (p) => p?.lessonId === lesson.id,
          );
          if (lessonProgress?.status === ProgressStatus.COMPLETED) {
            completedLessons++;
          } else if (lessonProgress?.status === ProgressStatus.IN_PROGRESS) {
            inProgressLessons++;
          }
        });

        topic.quizzes.forEach((quiz) => {
          const quizProgress = progressResults.find(
            (p) => p?.quizId === quiz.id,
          );
          if (quizProgress?.status === ProgressStatus.COMPLETED) {
            completedQuizzes++;
          } else if (quizProgress?.status === ProgressStatus.IN_PROGRESS) {
            inProgressQuizzes++;
          }
        });
      });

      const totalItems = totalLessons + totalQuizzes;
      const completedItems = completedLessons + completedQuizzes;
      const inProgressItems = inProgressLessons + inProgressQuizzes;

      const percentageComplete =
        totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

      let currentStatus: ProgressStatus = ProgressStatus.NOT_STARTED;
      if (percentageComplete === 100) {
        currentStatus = ProgressStatus.COMPLETED;
      } else if (percentageComplete > 0 || inProgressItems > 0) {
        currentStatus = ProgressStatus.IN_PROGRESS;
      }

      return {
        courseId: course.id,
        totalItems,
        completedItems,
        inProgressItems,
        percentageComplete,
        status: currentStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved hentning af fremskridt for kursus ${courseId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fremskridt',
      );
    }
  }

  @ApiOperation({
    summary: 'Hent fremskridt for alle kurser for den aktuelle bruger',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af fremskridt for alle kurser',
    type: [CourseProgressDto],
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('courses')
  async getAllCoursesProgress(@Request() req): Promise<CourseProgressDto[]> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      const courses = await this.prisma.course.findMany({
        include: {
          educationProgram: true,
          topics: {
            orderBy: { order: 'asc' },
            include: {
              lessons: true,
              quizzes: true,
            },
          },
        },
        orderBy: { title: 'asc' },
      });

      const courseProgressPromises = courses.map(async (course) => {
        let totalLessons = 0;
        let completedLessons = 0;
        let inProgressLessons = 0;
        let totalQuizzes = 0;
        let completedQuizzes = 0;
        let inProgressQuizzes = 0;

        const progressPromises = course.topics.flatMap((topic) => [
          ...topic.lessons.map((lesson) =>
            this.prisma.userProgress.findFirst({
              where: { userId, lessonId: lesson.id },
            }),
          ),
          ...topic.quizzes.map((quiz) =>
            this.prisma.userProgress.findFirst({
              where: { userId, quizId: quiz.id },
            }),
          ),
        ]);
        const progressResults = await Promise.all(progressPromises);

        course.topics.forEach((topic) => {
          totalLessons += topic.lessons.length;
          totalQuizzes += topic.quizzes.length;
          topic.lessons.forEach((lesson) => {
            const lessonProgress = progressResults.find(
              (p) => p?.lessonId === lesson.id,
            );
            if (lessonProgress?.status === ProgressStatus.COMPLETED) {
              completedLessons++;
            } else if (lessonProgress?.status === ProgressStatus.IN_PROGRESS) {
              inProgressLessons++;
            }
          });
          topic.quizzes.forEach((quiz) => {
            const quizProgress = progressResults.find(
              (p) => p?.quizId === quiz.id,
            );
            if (quizProgress?.status === ProgressStatus.COMPLETED) {
              completedQuizzes++;
            } else if (quizProgress?.status === ProgressStatus.IN_PROGRESS) {
              inProgressQuizzes++;
            }
          });
        });

        const totalItems = totalLessons + totalQuizzes;
        const completedItems = completedLessons + completedQuizzes;
        const inProgressItems = inProgressLessons + inProgressQuizzes;

        const percentageComplete =
          totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

        let currentStatus: ProgressStatus = ProgressStatus.NOT_STARTED;
        if (percentageComplete === 100) {
          currentStatus = ProgressStatus.COMPLETED;
        } else if (percentageComplete > 0 || inProgressItems > 0) {
          currentStatus = ProgressStatus.IN_PROGRESS;
        }

        return {
          courseId: course.id,
          totalItems,
          completedItems,
          inProgressItems,
          percentageComplete,
          status: currentStatus,
        };
      });

      return Promise.all(courseProgressPromises);
    } catch (error) {
      console.error(`Fejl ved hentning af fremskridt for alle kurser:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fremskridt',
      );
    }
  }

  @ApiOperation({ summary: 'Hent statistik for den aktuelle bruger' })
  @ApiResponse({
    status: 200,
    description: 'Brugerstatistik med XP og quiz-resultater',
    schema: {
      type: 'object',
      properties: {
        totalXp: { type: 'number' },
        quizResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quizId: { type: 'number' },
              quizTitle: { type: 'string' },
              score: { type: 'number' },
              completedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics')
  async getUserStatistics(
    @Request() req,
  ): Promise<{ totalXp: number; quizResults: any[] }> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    try {
      // Hent bruger
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      // Håndter tilfælde hvor xp-feltet ikke eksisterer endnu
      const userXp = user && 'xp' in user ? user.xp : 0;

      // Hent quiz-forsøg med score
      const quizAttempts = await this.prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Formatér quiz-resultater
      const quizResults = quizAttempts.map((attempt) => ({
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        score: attempt.score,
        completedAt: attempt.completedAt,
      }));

      return {
        totalXp: userXp,
        quizResults,
      };
    } catch (error) {
      console.error(`Fejl ved hentning af brugerstatistik:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af brugerstatistik',
      );
    }
  }
}
