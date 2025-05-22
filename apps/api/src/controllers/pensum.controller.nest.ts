// apps/api/src/controllers/pensum.controller.nest.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../persistence/prisma/prisma.service';
import {
  PensumStructureDto,
  CompletePensumStructureDto,
  SemesterDto,
  SubjectDto,
  TopicDto,
} from './dto/pensum/pensum.dto';

@ApiTags('Pensum')
@Controller('pensum')
export class PensumController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent den komplette pensum-struktur' })
  @ApiResponse({
    status: 200,
    description:
      'Den komplette pensum-struktur med fagområder, kurser, moduler og lektioner',
    type: PensumStructureDto,
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get()
  async getPensumStructure(): Promise<PensumStructureDto> {
    try {
      const subjectAreas = await this.prisma.subjectArea.findMany({
        include: {
          courses: {
            include: {
              modules: {
                orderBy: { order: 'asc' },
                include: {
                  lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                      contentBlocks: {
                        orderBy: { order: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return { subjectAreas };
    } catch (error) {
      console.error('Fejl ved hentning af pensum-struktur:', error);
      throw new NotFoundException(
        'Der opstod en fejl ved hentning af pensum-strukturen',
      );
    }
  }

  @ApiOperation({ summary: 'Hent pensum-struktur for et specifikt fagområde' })
  @ApiParam({
    name: 'subjectAreaId',
    description: 'Fagområde ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Pensum-struktur for det angivne fagområde',
    type: PensumStructureDto,
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('subject-area/:subjectAreaId')
  async getPensumBySubjectArea(
    @Param('subjectAreaId', ParseIntPipe) subjectAreaId: number,
  ): Promise<PensumStructureDto> {
    try {
      const subjectAreas = await this.prisma.subjectArea.findMany({
        where: { id: subjectAreaId },
        include: {
          courses: {
            include: {
              modules: {
                orderBy: { order: 'asc' },
                include: {
                  lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                      contentBlocks: {
                        orderBy: { order: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (subjectAreas.length === 0) {
        throw new NotFoundException('Fagområdet blev ikke fundet');
      }

      return { subjectAreas };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved hentning af pensum for fagområde ${subjectAreaId}:`,
        error,
      );
      throw new NotFoundException(
        'Der opstod en fejl ved hentning af pensum-strukturen',
      );
    }
  }

  @ApiOperation({ summary: 'Hent pensum-struktur for et specifikt kursus' })
  @ApiParam({ name: 'courseId', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pensum-struktur for det angivne kursus',
    type: PensumStructureDto,
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('course/:courseId')
  async getPensumByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<any> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          subjectArea: true,
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                include: {
                  contentBlocks: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException('Kurset blev ikke fundet');
      }

      return course;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved hentning af pensum for kursus ${courseId}:`,
        error,
      );
      throw new NotFoundException(
        'Der opstod en fejl ved hentning af pensum-strukturen',
      );
    }
  }

  @ApiOperation({ summary: 'Hent pensum-struktur for et specifikt modul' })
  @ApiParam({ name: 'moduleId', description: 'Modul ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pensum-struktur for det angivne modul',
    type: PensumStructureDto,
  })
  @ApiResponse({ status: 404, description: 'Modulet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('module/:moduleId')
  async getPensumByModule(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ): Promise<any> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          course: {
            include: {
              subjectArea: true,
            },
          },
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              contentBlocks: {
                orderBy: { order: 'asc' },
              },
            },
          },
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
      console.error(
        `Fejl ved hentning af pensum for modul ${moduleId}:`,
        error,
      );
      throw new NotFoundException(
        'Der opstod en fejl ved hentning af pensum-strukturen',
      );
    }
  }

  @ApiOperation({
    summary: 'Hent brugerens fremskridt i pensum',
    description:
      'Henter den komplette pensum-struktur med brugerens fremskridt for hvert element',
  })
  @ApiResponse({
    status: 200,
    description: 'Pensum-struktur med brugerens fremskridt',
    type: PensumStructureDto,
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async getUserPensumProgress(): Promise<PensumStructureDto> {
    try {
      // Denne endpoint ville normalt bruge bruger-ID fra JWT token
      // og hente brugerens fremskridt for hvert element i pensum-strukturen

      // For nu returnerer vi bare den komplette struktur
      return this.getPensumStructure();
    } catch (error) {
      console.error('Fejl ved hentning af brugerens pensum-fremskridt:', error);
      throw new NotFoundException(
        'Der opstod en fejl ved hentning af pensum-fremskridtet',
      );
    }
  }

  @ApiOperation({
    summary:
      'Simuleret endpoint for at hente den komplette uddannelsesstruktur med semestre',
    description:
      'Dette er en simuleret endpoint, der viser, hvordan den komplette uddannelsesstruktur kunne se ud',
  })
  @ApiResponse({
    status: 200,
    description:
      'Den komplette uddannelsesstruktur med semestre, kurser, fag, emner og lektioner',
    type: CompletePensumStructureDto,
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('complete-structure')
  async getCompleteEducationStructure(): Promise<CompletePensumStructureDto> {
    // Dette er en simuleret endpoint, der viser, hvordan den komplette uddannelsesstruktur kunne se ud
    // I en rigtig implementation ville dette hente data fra databasen

    const semesters: SemesterDto[] = [
      {
        id: 1,
        name: '1. semester',
        description: 'Introduktion til grundlæggende laboratorieteknikker',
        number: 1,
        courses: [
          {
            id: 1,
            title: 'Introduktion til analyseteknik',
            description:
              'Grundlæggende introduktion til analyseteknikker i laboratoriet',
            subjects: [
              {
                id: 1,
                name: 'Biologi',
                description: 'Grundlæggende biologiske principper og teknikker',
                courseId: 1,
                topics: [
                  {
                    id: 1,
                    title: 'Bakteriepodning',
                    description:
                      'Teknikker til podning og dyrkning af bakterier',
                    subjectId: 1,
                    lessons: [
                      {
                        id: 1,
                        title: 'Introduktion til bakteriepodning',
                        description:
                          'Grundlæggende principper for bakteriepodning',
                      },
                      {
                        id: 2,
                        title: 'Avancerede podningsteknikker',
                        description:
                          'Videregående teknikker til bakteriepodning',
                      },
                    ],
                  },
                ],
              },
              {
                id: 2,
                name: 'Kemi',
                description: 'Grundlæggende kemiske principper og teknikker',
                courseId: 1,
                topics: [],
              },
              {
                id: 3,
                name: 'Fysik',
                description: 'Grundlæggende fysiske principper og teknikker',
                courseId: 1,
                topics: [],
              },
            ],
          },
        ],
      },
    ];

    return { semesters };
  }
}
