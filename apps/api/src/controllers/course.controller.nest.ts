// apps/api/src/controllers/course.controller.nest.ts
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
  Inject,
  Logger,
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
import { CourseDto, CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  private readonly logger = new Logger(CourseController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @ApiOperation({ summary: 'Hent alle kurser' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle kurser',
    type: [CourseDto],
  })
  @Get()
  async getAllCourses(): Promise<CourseDto[]> {
    this.logger.log('Cache miss for all_courses - henter data fra databasen');
    return this.prisma.course.findMany({
      include: {
        subjectArea: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  @ApiOperation({ summary: 'Hent kurser for et specifikt fagområde' })
  @ApiParam({
    name: 'subjectAreaId',
    description: 'ID for fagområdet',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af kurser for det angivne fagområde',
    type: [CourseDto],
  })
  @Get('by-subject/:subjectAreaId')
  async getCoursesBySubjectArea(
    @Param('subjectAreaId', ParseIntPipe) subjectAreaId: number,
  ): Promise<CourseDto[]> {
    this.logger.log(
      `Cache miss for courses_by_subject_${subjectAreaId} - henter data fra databasen`,
    );
    return this.prisma.course.findMany({
      where: { subjectAreaId },
      orderBy: { title: 'asc' },
    });
  }

  @ApiOperation({ summary: 'Hent et specifikt kursus ud fra ID' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Det angivne kursus',
    type: CourseDto,
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @Get(':id')
  async getCourseById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CourseDto> {
    this.logger.log(`Cache miss for course_${id} - henter data fra databasen`);
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        subjectArea: true,
        modules: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kurset blev ikke fundet');
    }

    return course;
  }

  @ApiOperation({ summary: 'Hent et specifikt kursus ud fra slug' })
  @ApiParam({ name: 'slug', description: 'Kursus slug', type: String })
  @ApiResponse({
    status: 200,
    description: 'Det angivne kursus',
    type: CourseDto,
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @Get('by-slug/:slug')
  async getCourseBySlug(@Param('slug') slug: string): Promise<CourseDto> {
    this.logger.log(
      `Cache miss for course_slug_${slug} - henter data fra databasen`,
    );
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        subjectArea: true,
        modules: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kurset blev ikke fundet');
    }

    return course;
  }

  @ApiOperation({ summary: 'Opret et nyt kursus' })
  @ApiResponse({
    status: 201,
    description: 'Kurset blev oprettet',
    type: CourseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseDto> {
    const { title, description, slug, subjectAreaId } = createCourseDto;

    // Tjek om fagområdet eksisterer
    const subjectArea = await this.prisma.subjectArea.findUnique({
      where: { id: subjectAreaId },
    });

    if (!subjectArea) {
      throw new NotFoundException('Det angivne fagområde findes ikke');
    }

    // Tjek om slug allerede eksisterer
    const existingCourse = await this.prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      throw new BadRequestException(
        'Et kursus med dette slug eksisterer allerede',
      );
    }

    const newCourse = await this.prisma.course.create({
      data: {
        title,
        description,
        slug,
        subjectAreaId,
      },
    });

    // Invalider cachen for alle kurser og kurser efter fagområde
    await this.cacheManager.del('GET_/api/courses');
    await this.cacheManager.del(`GET_/api/courses/by-subject/${subjectAreaId}`);

    return newCourse;
  }

  @ApiOperation({ summary: 'Opdater et eksisterende kursus' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Kurset blev opdateret',
    type: CourseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Kurset eller fagområdet blev ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseDto> {
    const { title, description, slug, subjectAreaId } = updateCourseDto;

    // Tjek om kurset eksisterer
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException('Kurset blev ikke fundet');
    }

    // Hvis subjectAreaId ændres, tjek om det nye fagområde eksisterer
    if (subjectAreaId && subjectAreaId !== existingCourse.subjectAreaId) {
      const subjectArea = await this.prisma.subjectArea.findUnique({
        where: { id: subjectAreaId },
      });

      if (!subjectArea) {
        throw new NotFoundException('Det angivne fagområde findes ikke');
      }
    }

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingCourse.slug) {
      const slugExists = await this.prisma.course.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new BadRequestException(
          'Et kursus med dette slug eksisterer allerede',
        );
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        title: title || existingCourse.title,
        description: description || existingCourse.description,
        slug: slug || existingCourse.slug,
        subjectAreaId: subjectAreaId || existingCourse.subjectAreaId,
      },
    });

    // Invalider cachen for det opdaterede kursus og relaterede cacher
    await this.cacheManager.del(`GET_/api/courses/${id}`);
    await this.cacheManager.del(
      `GET_/api/courses/by-slug/${existingCourse.slug}`,
    );
    if (slug && slug !== existingCourse.slug) {
      await this.cacheManager.del(`GET_/api/courses/by-slug/${slug}`);
    }
    await this.cacheManager.del('GET_/api/courses');
    await this.cacheManager.del(
      `GET_/api/courses/by-subject/${existingCourse.subjectAreaId}`,
    );
    if (subjectAreaId && subjectAreaId !== existingCourse.subjectAreaId) {
      await this.cacheManager.del(
        `GET_/api/courses/by-subject/${subjectAreaId}`,
      );
    }

    return updatedCourse;
  }

  @ApiOperation({ summary: 'Slet et kursus' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Kurset blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Kurset kan ikke slettes, da der er moduler tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    // Tjek om kurset eksisterer
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
      include: { modules: true },
    });

    if (!existingCourse) {
      throw new NotFoundException('Kurset blev ikke fundet');
    }

    // Tjek om der er moduler tilknyttet kurset
    if (existingCourse.modules.length > 0) {
      throw new BadRequestException(
        'Kurset kan ikke slettes, da der er moduler tilknyttet. Slet venligst modulerne først.',
      );
    }

    await this.prisma.course.delete({
      where: { id },
    });

    // Invalider cachen for det slettede kursus og relaterede cacher
    await this.cacheManager.del(`GET_/api/courses/${id}`);
    await this.cacheManager.del(
      `GET_/api/courses/by-slug/${existingCourse.slug}`,
    );
    await this.cacheManager.del('GET_/api/courses');
    await this.cacheManager.del(
      `GET_/api/courses/by-subject/${existingCourse.subjectAreaId}`,
    );

    return { message: 'Kurset blev slettet' };
  }
}
