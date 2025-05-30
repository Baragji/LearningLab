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
        educationProgram: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  @ApiOperation({ summary: 'Hent kurser for et specifikt uddannelsesprogram' })
  @ApiParam({
    name: 'educationProgramId',
    description: 'ID for uddannelsesprogrammet',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af kurser for det angivne uddannelsesprogram',
    type: [CourseDto],
  })
  @Get('by-education-program/:educationProgramId')
  @ApiOperation({
    summary: 'Hent alle kurser for et specifikt uddannelsesprogram',
    description: 'Returnerer en liste over kurser tilknyttet et givent uddannelsesprogram-ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'En liste over kurser for det angivne uddannelsesprogram.',
    type: [CourseDto],
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogram ikke fundet.' })
  async getCoursesByEducationProgram(
    @Param('educationProgramId', ParseIntPipe) educationProgramId: number,
  ): Promise<CourseDto[]> {
    this.logger.log(
      `Cache miss for GET_/api/courses/by-education-program/${educationProgramId} - henter data fra databasen`,
    );
    const educationProgram = await this.prisma.educationProgram.findUnique({
      where: { id: educationProgramId },
    });

    if (!educationProgram) {
      throw new NotFoundException('Uddannelsesprogram ikke fundet');
    }

    return this.prisma.course.findMany({
      where: { educationProgramId },
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
        educationProgram: true,
        topics: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            // quizzes: true, // Fjernet da det ikke er en direkte relation her, quizzes er på Lesson eller Topic niveau
          }
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
        educationProgram: true,
        topics: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            // quizzes: true, // Fjernet da det ikke er en direkte relation her, quizzes er på Lesson eller Topic niveau
          }
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
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCourse(@Body() createCourseDto: CreateCourseDto): Promise<CourseDto> {
    const { title, description, slug, educationProgramId } = createCourseDto;

    // Tjek om uddannelsesprogrammet eksisterer
    const educationProgram = await this.prisma.educationProgram.findUnique({
      where: { id: educationProgramId },
    });

    if (!educationProgram) {
      throw new NotFoundException('Det angivne uddannelsesprogram findes ikke');
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
        educationProgramId,
      },
    });

    // Invalider cachen for alle kurser og kurser for det pågældende uddannelsesprogram
    await this.cacheManager.del('GET_/api/courses');
    await this.cacheManager.del(`GET_/api/courses/by-education-program/${educationProgramId}`);

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
    const { title, description, slug, educationProgramId } = updateCourseDto;

    // Tjek om kurset eksisterer
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException('Kurset blev ikke fundet');
    }

    // Hvis educationProgramId ændres, tjek om det nye uddannelsesprogram eksisterer
    if (educationProgramId && educationProgramId !== existingCourse.educationProgramId) {
      const educationProgram = await this.prisma.educationProgram.findUnique({
        where: { id: educationProgramId },
      });

      if (!educationProgram) {
        throw new NotFoundException('Det angivne uddannelsesprogram findes ikke');
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
        educationProgramId: educationProgramId || existingCourse.educationProgramId,
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
      `GET_/api/courses/by-education-program/${existingCourse.educationProgramId}`,
    );
    if (educationProgramId && educationProgramId !== existingCourse.educationProgramId) {
      await this.cacheManager.del(
        `GET_/api/courses/by-education-program/${educationProgramId}`,
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
    description: 'Kurset kan ikke slettes, da der er emner tilknyttet',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Kurset kan ikke slettes, da der er emner tilknyttet',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const courseWithDetails = await this.prisma.course.findUnique({
      where: { id },
      include: {
        educationProgram: true,
        topics: { // Rettet fra modules til topics
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

    if (!courseWithDetails) {
      this.logger.warn(`Course with id ${id} not found for deletion`);
      throw new NotFoundException(`Kursus med id ${id} blev ikke fundet`);
    }

    // Slet tilknyttede quizzer, lektioner, emner osv. (afhængig af kaskadesletningsregler)
    // Dette er et eksempel og skal muligvis justeres baseret på din datamodel og forretningslogik

    // Slet selve kurset
    await this.prisma.course.delete({ where: { id } });

    // Invalider cachen for det slettede kursus og listen over alle kurser
    await this.cacheManager.del(`course_${id}`);
    await this.cacheManager.del(`course_slug_${courseWithDetails.slug}`);
    await this.cacheManager.del('all_courses');
    if (courseWithDetails.educationProgramId) {
      await this.cacheManager.del(
        `GET_/api/courses/by-education-program/${courseWithDetails.educationProgramId}`,
      );
    }
    if (courseWithDetails.topics) { // Rettet fra modules til topics
      // Yderligere cache-invalidering for relaterede data, hvis nødvendigt
    }

    this.logger.log(`Course with id ${id} deleted successfully`);
    return { message: `Kursus med id ${id} blev slettet` };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-') // Erstat mellemrum med bindestreger
      .replace(/[^\w-]+/g, ''); // Fjern specialtegn
  }

  // Helper til at mappe Prisma Course model til CourseDto
  // private toCourseDto(course: Course & { educationProgram?: EducationProgram, topics?: (Topic & { lessons?: Lesson[] })[] }): CourseDto {
  //   return {
  //     ...course,
  //     educationProgramName: course.educationProgram?.name,
  //     // Sørg for at subjectAreaId er inkluderet hvis det er en del af din DTO og model
  //     // subjectAreaId: course.subjectAreaId, // Denne linje vil give fejl hvis subjectAreaId ikke findes på Course. Fjernet da det ikke er en del af Course modellen.
  //   };
  // }
}
