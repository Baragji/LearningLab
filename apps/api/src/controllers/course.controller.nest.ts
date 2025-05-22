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

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle kurser' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle kurser',
    type: [CourseDto],
  })
  @Get()
  async getAllCourses(): Promise<CourseDto[]> {
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

    return this.prisma.course.create({
      data: {
        title,
        description,
        slug,
        subjectAreaId,
      },
    });
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

    return this.prisma.course.update({
      where: { id },
      data: {
        title: title || existingCourse.title,
        description: description || existingCourse.description,
        slug: slug || existingCourse.slug,
        subjectAreaId: subjectAreaId || existingCourse.subjectAreaId,
      },
    });
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

    return { message: 'Kurset blev slettet' };
  }
}
