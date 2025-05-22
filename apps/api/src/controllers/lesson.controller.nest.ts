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

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle lektioner for et specifikt modul' })
  @ApiParam({ name: 'moduleId', description: 'ID for modulet', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af lektioner for det angivne modul',
    type: [LessonDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('module/:moduleId')
  async getLessonsByModule(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ): Promise<LessonDto[]> {
    try {
      return await this.prisma.lesson.findMany({
        where: { moduleId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af lektioner for modul ${moduleId}:`,
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
          module: {
            include: {
              course: {
                include: {
                  subjectArea: true,
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
  @ApiResponse({ status: 404, description: 'Modulet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<LessonDto> {
    const { title, description, order, moduleId } = createLessonDto;

    try {
      // Tjek om modulet eksisterer
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException('Det angivne modul findes ikke');
      }

      // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter den sidste lektion
      let lessonOrder = order;
      if (lessonOrder === undefined) {
        const lastLesson = await this.prisma.lesson.findFirst({
          where: { moduleId },
          orderBy: { order: 'desc' },
        });

        lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
      }

      return await this.prisma.lesson.create({
        data: {
          title,
          description,
          order: lessonOrder,
          moduleId,
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
    description: 'Lektionen eller modulet blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<LessonDto> {
    const { title, description, order, moduleId } = updateLessonDto;

    try {
      // Tjek om lektionen eksisterer
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { id },
      });

      if (!existingLesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Hvis moduleId ændres, tjek om det nye modul eksisterer
      if (moduleId && moduleId !== existingLesson.moduleId) {
        const module = await this.prisma.module.findUnique({
          where: { id: moduleId },
        });

        if (!module) {
          throw new NotFoundException('Det angivne modul findes ikke');
        }
      }

      return await this.prisma.lesson.update({
        where: { id },
        data: {
          title: title || existingLesson.title,
          description: description || existingLesson.description,
          order: order !== undefined ? order : existingLesson.order,
          moduleId: moduleId || existingLesson.moduleId,
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

  @ApiOperation({ summary: 'Opdater rækkefølgen af lektioner i et modul' })
  @ApiParam({ name: 'moduleId', description: 'ID for modulet', type: Number })
  @ApiBody({ type: UpdateLessonsOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Lektionsrækkefølgen blev opdateret',
    type: [LessonDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Modulet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('module/:moduleId/order')
  async updateLessonsOrder(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() updateLessonsOrderDto: UpdateLessonsOrderDto,
  ): Promise<LessonDto[]> {
    const { lessonIds } = updateLessonsOrderDto;

    if (!Array.isArray(lessonIds)) {
      throw new BadRequestException(
        "lessonIds skal være et array af lektion-ID'er",
      );
    }

    try {
      // Tjek om modulet eksisterer
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: { lessons: true },
      });

      if (!module) {
        throw new NotFoundException('Modulet blev ikke fundet');
      }

      // Tjek om alle lektioner tilhører modulet
      const moduleLessonIds = module.lessons.map((lesson) => lesson.id);
      const allLessonsExist = lessonIds.every((id) =>
        moduleLessonIds.includes(Number(id)),
      );

      if (!allLessonsExist) {
        throw new BadRequestException(
          'En eller flere lektioner tilhører ikke det angivne modul',
        );
      }

      // Opdater rækkefølgen af lektioner
      const updates = lessonIds.map((lessonId, index) => {
        return this.prisma.lesson.update({
          where: { id: Number(lessonId) },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return await this.prisma.lesson.findMany({
        where: { moduleId },
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
        `Fejl ved opdatering af lektionsrækkefølge for modul ${moduleId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af lektionsrækkefølgen',
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
        include: { contentBlocks: true, quizzes: true },
      });

      if (!existingLesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Tjek om der er indholdsblokke eller quizzer tilknyttet lektionen
      if (
        existingLesson.contentBlocks.length > 0 ||
        existingLesson.quizzes.length > 0
      ) {
        throw new BadRequestException(
          'Lektionen kan ikke slettes, da der er indholdsblokke eller quizzer tilknyttet. Slet venligst disse først.',
        );
      }

      await this.prisma.lesson.delete({
        where: { id },
      });

      // Opdater rækkefølgen af de resterende lektioner
      const remainingLessons = await this.prisma.lesson.findMany({
        where: { moduleId: existingLesson.moduleId },
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
}
