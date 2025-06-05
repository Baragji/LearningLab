// apps/api/src/controllers/lesson.controller.nest.ts
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
import {
  LessonDto,
  CreateLessonDto,
  UpdateLessonDto,
  UpdateLessonsOrderDto,
} from './dto/lesson/lesson.dto';

@ApiTags('Lektioner')
@Controller('lessons')
export class LessonController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle lektioner for et specifikt emne' })
  @ApiParam({ name: 'topicId', description: 'ID for emnet', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af lektioner for det angivne emne',
    type: [LessonDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('topic/:topicId')
  async getLessonsByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<LessonDto[]> {
    try {
      return await this.prisma.lesson.findMany({
        where: { topicId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af lektioner for emne ${topicId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af lektioner',
      );
    }
  }

  @ApiOperation({ summary: 'Hent en specifik lektion ud fra ID' })
  @ApiParam({ name: 'id', description: 'Lektion ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Den angivne lektion',
    type: LessonDto,
  })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getLessonById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LessonDto> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id },
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
          contentBlocks: {
            orderBy: { order: 'asc' },
          },
          quizzes: true,
        },
      });

      if (!lesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      return lesson;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af lektion med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af lektionen',
      );
    }
  }

  @ApiOperation({ summary: 'Opret en ny lektion' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({
    status: 201,
    description: 'Lektionen blev oprettet',
    type: LessonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Emnet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<LessonDto> {
    const { title, description, order, topicId } = createLessonDto;

    try {
      // Tjek om emnet eksisterer
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic) {
        throw new NotFoundException('Det angivne emne findes ikke');
      }

      // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter den sidste lektion
      let lessonOrder = order;
      if (lessonOrder === undefined) {
        const lastLesson = await this.prisma.lesson.findFirst({
          where: { topicId },
          orderBy: { order: 'desc' },
        });

        lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
      }

      return await this.prisma.lesson.create({
        data: {
          title,
          description,
          order: lessonOrder,
          topicId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af lektion:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af lektionen',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater en eksisterende lektion' })
  @ApiParam({ name: 'id', description: 'Lektion ID', type: Number })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({
    status: 200,
    description: 'Lektionen blev opdateret',
    type: LessonDto,
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
  @Put(':id')
  async updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<LessonDto> {
    const { title, description, order, topicId } = updateLessonDto;

    try {
      // Tjek om lektionen eksisterer
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { id },
      });

      if (!existingLesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Hvis topicId ændres, tjek om det nye emne eksisterer
      if (topicId && topicId !== existingLesson.topicId) {
        const topic = await this.prisma.topic.findUnique({
          where: { id: topicId },
        });

        if (!topic) {
          throw new NotFoundException('Det angivne emne findes ikke');
        }
      }

      return await this.prisma.lesson.update({
        where: { id },
        data: {
          title: title || existingLesson.title,
          description: description || existingLesson.description,
          order: order !== undefined ? order : existingLesson.order,
          topicId: topicId || existingLesson.topicId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af lektion med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af lektionen',
      );
    }
  }

  @ApiOperation({ summary: 'Slet en lektion' })
  @ApiParam({ name: 'id', description: 'Lektion ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lektionen blev slettet',
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
      'Lektionen kan ikke slettes, da der er indholdsblokke eller quizzer tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteLesson(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om lektionen eksisterer
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { id },
        include: { contentBlocks: true }, // quizzes er ikke en direkte relation
      });

      if (!existingLesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Tjek om der er indholdsblokke tilknyttet lektionen
      // Tjek for quizzer skal ske ved at iterere over contentBlocks og se efter QUIZ_REF type
      const hasQuizReferences = existingLesson.contentBlocks.some(
        (cb) => cb.type === 'QUIZ_REF',
      );

      if (existingLesson.contentBlocks.length > 0 || hasQuizReferences) {
        throw new BadRequestException(
          'Lektionen kan ikke slettes, da der er indholdsblokke eller quiz-referencer tilknyttet. Slet venligst disse først eller fjern referencerne.',
        );
      }

      await this.prisma.lesson.delete({
        where: { id },
      });

      // Opdater rækkefølgen af de resterende lektioner
      const remainingLessons = await this.prisma.lesson.findMany({
        where: { topicId: existingLesson.topicId },
        orderBy: { order: 'asc' },
      });

      const updates = remainingLessons.map((lesson, index) => {
        return this.prisma.lesson.update({
          where: { id: lesson.id },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return { message: 'Lektionen blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af lektion med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af lektionen',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater rækkefølgen af lektioner i et emne' })
  @ApiParam({ name: 'topicId', description: 'ID for emnet', type: Number })
  @ApiBody({ type: UpdateLessonsOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Rækkefølgen af lektioner blev opdateret',
    type: [LessonDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Emnet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('update-order/:topicId')
  async updateLessonsOrder(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() updateLessonsOrderDto: UpdateLessonsOrderDto,
  ): Promise<LessonDto[]> {
    try {
      // Tjek om emnet eksisterer
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: { lessons: true }, // Inkluder lektioner for at tælle dem
      });

      if (!topic) {
        throw new NotFoundException('Det angivne emne findes ikke');
      }

      const { lessonIds } = updateLessonsOrderDto; // Ændret fra newOrder til lessonIds

      // Tjek om den nye rækkefølge er gyldig
      if (lessonIds.length !== topic.lessons.length) {
        // Sammenlign med antallet af faktiske lektioner
        throw new BadRequestException(
          'Den nye rækkefølge skal indeholde samme antal lektioner som emnet',
        );
      }

      // Tjek om alle lektion ID'er i lessonIds faktisk tilhører emnet
      const topicLessonIds = topic.lessons.map((lesson) => lesson.id);
      const allLessonIdsBelongToTopic = lessonIds.every((id) =>
        topicLessonIds.includes(id),
      );
      if (!allLessonIdsBelongToTopic) {
        throw new BadRequestException(
          "En eller flere af de angivne lektions-ID'er tilhører ikke det specificerede emne.",
        );
      }

      // Tjek for duplikerede ID'er i lessonIds
      const uniqueLessonIds = new Set(lessonIds);
      if (uniqueLessonIds.size !== lessonIds.length) {
        throw new BadRequestException(
          "Lektions-ID'er i den nye rækkefølge må ikke være duplikerede.",
        );
      }

      // Opdater rækkefølgen af lektioner
      const updates = lessonIds.map((lessonId, index) => {
        return this.prisma.lesson.update({
          where: { id: lessonId },
          data: { order: index + 1 }, // Sæt rækkefølgen baseret på array-indeks
        });
      });

      await this.prisma.$transaction(updates);

      return await this.prisma.lesson.findMany({
        where: { topicId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved opdatering af lektioner i emne ${topicId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af lektioner',
      );
    }
  }
}
