// apps/api/src/controllers/module.controller.nest.ts
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
  ModuleDto,
  CreateModuleDto,
  UpdateModuleDto,
  UpdateModulesOrderDto,
} from './dto/module/module.dto';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle moduler for et specifikt kursus' })
  @ApiParam({ name: 'courseId', description: 'ID for kurset', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af moduler for det angivne kursus',
    type: [ModuleDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('course/:courseId')
  async getModulesByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ModuleDto[]> {
    try {
      return await this.prisma.module.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af moduler for kursus ${courseId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af moduler',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt modul ud fra ID' })
  @ApiParam({ name: 'id', description: 'Modul ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Det angivne modul',
    type: ModuleDto,
  })
  @ApiResponse({ status: 404, description: 'Modulet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getModuleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ModuleDto> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { id },
        include: {
          course: true,
          lessons: {
            orderBy: { order: 'asc' },
          },
          quizzes: true,
        },
      });

      if (!module) {
        throw new NotFoundException('Modulet blev ikke fundet');
      }

      return module;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af modul med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af modulet',
      );
    }
  }

  @ApiOperation({ summary: 'Opret et nyt modul' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Modulet blev oprettet',
    type: ModuleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createModule(
    @Body() createModuleDto: CreateModuleDto,
  ): Promise<ModuleDto> {
    const { title, description, order, courseId } = createModuleDto;

    try {
      // Tjek om kurset eksisterer
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Det angivne kursus findes ikke');
      }

      // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter det sidste modul
      let moduleOrder = order;
      if (moduleOrder === undefined) {
        const lastModule = await this.prisma.module.findFirst({
          where: { courseId },
          orderBy: { order: 'desc' },
        });

        moduleOrder = lastModule ? lastModule.order + 1 : 1;
      }

      return await this.prisma.module.create({
        data: {
          title,
          description,
          order: moduleOrder,
          courseId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af modul:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af modulet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater et eksisterende modul' })
  @ApiParam({ name: 'id', description: 'Modul ID', type: Number })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Modulet blev opdateret',
    type: ModuleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Modulet eller kurset blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleDto> {
    const { title, description, order, courseId } = updateModuleDto;

    try {
      // Tjek om modulet eksisterer
      const existingModule = await this.prisma.module.findUnique({
        where: { id },
      });

      if (!existingModule) {
        throw new NotFoundException('Modulet blev ikke fundet');
      }

      // Hvis courseId ændres, tjek om det nye kursus eksisterer
      if (courseId && courseId !== existingModule.courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
        });

        if (!course) {
          throw new NotFoundException('Det angivne kursus findes ikke');
        }
      }

      return await this.prisma.module.update({
        where: { id },
        data: {
          title: title || existingModule.title,
          description: description || existingModule.description,
          order: order !== undefined ? order : existingModule.order,
          courseId: courseId || existingModule.courseId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af modul med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af modulet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater rækkefølgen af moduler i et kursus' })
  @ApiParam({ name: 'courseId', description: 'ID for kurset', type: Number })
  @ApiBody({ type: UpdateModulesOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Modulrækkefølgen blev opdateret',
    type: [ModuleDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('course/:courseId/order')
  async updateModulesOrder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() updateModulesOrderDto: UpdateModulesOrderDto,
  ): Promise<ModuleDto[]> {
    const { moduleIds } = updateModulesOrderDto;

    if (!Array.isArray(moduleIds)) {
      throw new BadRequestException(
        "moduleIds skal være et array af modul-ID'er",
      );
    }

    try {
      // Tjek om kurset eksisterer
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: true },
      });

      if (!course) {
        throw new NotFoundException('Kurset blev ikke fundet');
      }

      // Tjek om alle moduler tilhører kurset
      const courseModuleIds = course.modules.map((module) => module.id);
      const allModulesExist = moduleIds.every((id) =>
        courseModuleIds.includes(Number(id)),
      );

      if (!allModulesExist) {
        throw new BadRequestException(
          'Et eller flere moduler tilhører ikke det angivne kursus',
        );
      }

      // Opdater rækkefølgen af moduler
      const updates = moduleIds.map((moduleId, index) => {
        return this.prisma.module.update({
          where: { id: Number(moduleId) },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return await this.prisma.module.findMany({
        where: { courseId },
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
        `Fejl ved opdatering af modulrækkefølge for kursus ${courseId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af modulrækkefølgen',
      );
    }
  }

  @ApiOperation({ summary: 'Slet et modul' })
  @ApiParam({ name: 'id', description: 'Modul ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Modulet blev slettet',
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
      'Modulet kan ikke slettes, da der er lektioner eller quizzer tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Modulet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteModule(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om modulet eksisterer
      const existingModule = await this.prisma.module.findUnique({
        where: { id },
        include: { lessons: true, quizzes: true },
      });

      if (!existingModule) {
        throw new NotFoundException('Modulet blev ikke fundet');
      }

      // Tjek om der er lektioner eller quizzer tilknyttet modulet
      if (
        existingModule.lessons.length > 0 ||
        existingModule.quizzes.length > 0
      ) {
        throw new BadRequestException(
          'Modulet kan ikke slettes, da der er lektioner eller quizzer tilknyttet. Slet venligst disse først.',
        );
      }

      await this.prisma.module.delete({
        where: { id },
      });

      // Opdater rækkefølgen af de resterende moduler
      const remainingModules = await this.prisma.module.findMany({
        where: { courseId: existingModule.courseId },
        orderBy: { order: 'asc' },
      });

      const updates = remainingModules.map((module, index) => {
        return this.prisma.module.update({
          where: { id: module.id },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return { message: 'Modulet blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af modul med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af modulet',
      );
    }
  }
}
