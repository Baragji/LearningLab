// apps/api/src/controllers/userProgress.controller.ts
import { Controller, Patch, Body, Request, UseGuards, Get, Param, Put, Logger, BadRequestException, InternalServerErrorException, Inject, NotFoundException } from '@nestjs/common';
import { Prisma, ProgressStatus, UserProgress as PrismaUserProgress } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types'; // Importerer fra types/index.ts
import { UpdateQuizProgressDto } from '../quiz/dto/update-quiz-progress.dto';
import { UpdateLessonProgressDto } from '../dto/update-lesson-progress.dto';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Controller('user-progress')
@UseGuards(JwtAuthGuard)
export class UserProgressController {
  private readonly logger = new Logger(UserProgressController.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Patch('/')
  async handleUpdateUserQuizProgress(
    @Request() req: AuthenticatedRequest,
    @Body() body: UpdateQuizProgressDto,
  ): Promise<PrismaUserProgress> {
    const userId = req.user.id;
    const { quizId, score, answers, completedAt } = body;

    this.logger.log(`Handling PATCH /user-progress for user: ${userId}, quiz: ${quizId}`);

    try {
      let attempt = await this.prisma.quizAttempt.findFirst({
        where: { userId, quizId, completedAt: null },
        orderBy: { startedAt: 'desc' },
      });

      if (!attempt) {
        this.logger.warn(`No incomplete quiz attempt for user ${userId}, quiz ${quizId}. Creating new.`);
        attempt = await this.prisma.quizAttempt.create({
          data: {
            userId,
            quizId,
            score: 0,
            startedAt: new Date(),
          },
        });
      }

      if (answers && answers.length > 0) {
        const answerUpserts = answers.map(answer => {
          return this.prisma.userAnswer.upsert({
            where: {
              // VIGTIGT: Sørg for at dette navn ("userAnswer_quizAttemptId_questionId_unique")
              // matcher præcist det 'name', du har givet til @@unique constrainten
              // i din UserAnswer model i apps/api/prisma/schema.prisma
              userAnswer_quizAttemptId_questionId_unique: {
                quizAttemptId: attempt.id,
                questionId: answer.questionId,
              }
            },
            update: {
              selectedAnswerOptionId: answer.selectedOptionId,
            },
            create: {
              quizAttemptId: attempt.id,
              questionId: answer.questionId,
              selectedAnswerOptionId: answer.selectedOptionId,
            },
          });
        });
        await this.prisma.$transaction(answerUpserts);
      }

      const finalCompletedAt = completedAt ? new Date(completedAt) : new Date();
      await this.prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score: score,
          completedAt: finalCompletedAt,
        },
      });
      this.logger.log(`QuizAttempt ${attempt.id} updated. Score: ${score}, Completed: ${finalCompletedAt}`);

      const userProgress = await this.prisma.userProgress.upsert({
        where: {
           // VIGTIGT: Sørg for at dette navn ("userId_lessonId_quizId_unique_constraint")
           // matcher præcist det 'name', du har givet til @@unique constrainten
           // i din UserProgress model i apps/api/prisma/schema.prisma
           userId_lessonId_quizId_unique_constraint: {
             userId,
             quizId,
             lessonId: null,
           }
        },
        update: {
          status: ProgressStatus.COMPLETED,
          score: score,
          quizAttemptId: attempt.id,
        },
        create: {
          userId,
          quizId,
          lessonId: null,
          status: ProgressStatus.COMPLETED,
          score: score,
          quizAttemptId: attempt.id,
        },
      });
      this.logger.log(`UserProgress for quiz ${quizId} updated/created for user ${userId}.`);

      return userProgress;
    } catch (error) {
      this.logger.error(`Error in handleUpdateUserQuizProgress for user ${userId}, quiz ${quizId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Prisma Error Code: ${error.code}`);
        if (error.code === 'P2002') { // Unique constraint violation
             this.logger.error('Unique constraint failed. Details:', error.meta);
        }
        throw new InternalServerErrorException(`Database error: ${error.code} - ${error.message}`);
      }
      throw new InternalServerErrorException('En intern serverfejl opstod under opdatering af quiz fremskridt.');
    }
  }

  @Get('lessons/:lessonId')
  async getLessonProgress(
     @Request() req: AuthenticatedRequest,
     @Param('lessonId') lessonIdParam: string
  ): Promise<PrismaUserProgress | null> {
     const userId = req.user.id;
     const lessonId = parseInt(lessonIdParam, 10);
     if (isNaN(lessonId)) {
       throw new BadRequestException('Invalid lesson ID.');
     }
     this.logger.log(`Fetching lesson progress for user: ${userId}, lesson: ${lessonId}`);
     
     let progress = await this.prisma.userProgress.findFirst({
        where: { userId, lessonId, quizId: null },
     });

     if (!progress) {
        this.logger.warn(`No progress found for user ${userId}, lesson ${lessonId}. Creating a new 'NOT_STARTED' record.`);
        try {
            progress = await this.prisma.userProgress.create({
                data: {
                    userId,
                    lessonId,
                    status: ProgressStatus.NOT_STARTED,
                    quizId: null
                }
            });
        } catch (error) {
            this.logger.error(`Failed to create initial progress for lesson ${lessonId}, user ${userId}`, error);
            throw new InternalServerErrorException('Kunne ikke hente eller oprette lektionsfremskridt.');
        }
     }
     return progress;
  }

  @Put('lessons/:lessonId')
  async updateLessonProgress(
     @Request() req: AuthenticatedRequest,
     @Param('lessonId') lessonIdParam: string,
     @Body() body: UpdateLessonProgressDto
  ): Promise<PrismaUserProgress> {
     const userId = req.user.id;
     const lessonId = parseInt(lessonIdParam, 10);
     if (isNaN(lessonId)) {
        throw new BadRequestException('Invalid lesson ID.');
     }
     const { status } = body;
     this.logger.log(`Updating lesson progress for user: ${userId}, lesson: ${lessonId} to status: ${status}`);
     
     const lessonExists = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
     if (!lessonExists) {
       throw new NotFoundException(`Lesson with ID ${lessonId} not found.`);
     }

     return this.prisma.userProgress.upsert({
        where: { 
            userId_lessonId_quizId_unique_constraint: { // Sørg for at constraint-navnet matcher dit schema
                userId, 
                lessonId, 
                quizId: null 
            } 
        },
        update: { status },
        create: { userId, lessonId, status, quizId: null },
     });
  }

  @Get('/')
  async getAllUserProgress(@Request() req: AuthenticatedRequest): Promise<PrismaUserProgress[]> {
    const userId = req.user.id;
    this.logger.log(`Fetching all progress for user: ${userId}`);
    return this.prisma.userProgress.findMany({
      where: { userId },
      include: { 
        lesson: { select: { id: true, title: true } },
        quiz: { select: { id: true, title: true } },
        quizAttempt: { select: { id: true, score: true, completedAt: true } }
      }
    });
  }

  @Get('courses/:courseId')
  async getCourseProgress(
    @Request() req: AuthenticatedRequest,
    @Param('courseId') courseIdParam: string
  ): Promise<any> {
    const userId = req.user.id;
    const courseId = parseInt(courseIdParam, 10);
    if (isNaN(courseId)) {
      throw new BadRequestException('Invalid course ID.');
    }
    this.logger.log(`Fetching course progress for user: ${userId}, course: ${courseId}`);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
            quizzes: { select: { id: true } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    const lessonIds: number[] = [];
    const quizIds: number[] = [];

    course.modules.forEach(module => {
      module.lessons.forEach(lesson => lessonIds.push(lesson.id));
      module.quizzes.forEach(quiz => quizIds.push(quiz.id));
    });

    const progressRecords = await this.prisma.userProgress.findMany({
      where: {
        userId,
        OR: [
          { lessonId: { in: lessonIds.length > 0 ? lessonIds : undefined } }, // Håndter tomme arrays
          { quizId: { in: quizIds.length > 0 ? quizIds : undefined } },     // Håndter tomme arrays
        ],
      },
    });

    const totalItems = lessonIds.length + quizIds.length;
    const completedItems = progressRecords.filter(p => p.status === ProgressStatus.COMPLETED).length;
    
    const percentageComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      courseId: courseId,
      totalItems,
      completedItems,
      percentageComplete,
      status:
        percentageComplete === 100
          ? ProgressStatus.COMPLETED
          : completedItems > 0 || progressRecords.some(p => p.status === ProgressStatus.IN_PROGRESS)
            ? ProgressStatus.IN_PROGRESS
            : ProgressStatus.NOT_STARTED,
      detailedProgress: progressRecords,
    };
  }
}
