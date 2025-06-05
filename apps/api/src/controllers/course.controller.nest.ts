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
  UnauthorizedException,
  UseGuards,
  ParseIntPipe,
  Inject,
  Logger,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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

  @ApiOperation({ summary: 'Hent alle kurser med filtrering' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Søg i kursustitel og beskrivelse',
  })
  @ApiQuery({
    name: 'educationProgramId',
    required: false,
    description: 'Filtrer efter uddannelsesprogram ID',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Filtrer efter sværhedsgrad',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maksimalt antal resultater',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Antal resultater at springe over',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af kurser med filtrering',
    schema: {
      type: 'object',
      properties: {
        courses: {
          type: 'array',
          items: { $ref: '#/components/schemas/CourseDto' },
        },
        total: { type: 'number' },
        hasMore: { type: 'boolean' },
      },
    },
  })
  @Get()
  async getAllCourses(
    @Query('search') search?: string,
    @Query('educationProgramId') educationProgramId?: string,
    @Query('level') level?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{
    courses: CourseDto[];
    total: number;
    hasMore: boolean;
  }> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const educationProgramIdNum = educationProgramId
      ? parseInt(educationProgramId, 10)
      : undefined;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (educationProgramIdNum) {
      where.educationProgramId = educationProgramIdNum;
    }

    if (level) {
      where.level = level;
    }

    // Get total count for pagination
    const total = await this.prisma.course.count({ where });

    // Get courses with pagination
    const courses = await this.prisma.course.findMany({
      where,
      include: {
        educationProgram: true,
        topics: {
          include: {
            lessons: true,
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum,
    });

    const hasMore = offsetNum + limitNum < total;

    this.logger.log(
      `Retrieved ${courses.length} courses with filters: search=${search}, educationProgramId=${educationProgramId}, level=${level}`,
    );

    return {
      courses,
      total,
      hasMore,
    };
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
    description:
      'Returnerer en liste over kurser tilknyttet et givent uddannelsesprogram-ID.',
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
          },
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
          },
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
  @ApiResponse({
    status: 404,
    description: 'Uddannelsesprogrammet blev ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseDto> {
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
    await this.cacheManager.del(
      `GET_/api/courses/by-education-program/${educationProgramId}`,
    );

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
    if (
      educationProgramId &&
      educationProgramId !== existingCourse.educationProgramId
    ) {
      const educationProgram = await this.prisma.educationProgram.findUnique({
        where: { id: educationProgramId },
      });

      if (!educationProgram) {
        throw new NotFoundException(
          'Det angivne uddannelsesprogram findes ikke',
        );
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
        educationProgramId:
          educationProgramId || existingCourse.educationProgramId,
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
    if (
      educationProgramId &&
      educationProgramId !== existingCourse.educationProgramId
    ) {
      await this.cacheManager.del(
        `GET_/api/courses/by-education-program/${educationProgramId}`,
      );
    }

    return updatedCourse;
  }

  @ApiOperation({ summary: 'Tilmeld bruger til kursus' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Bruger tilmeldt kursus',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        courseId: { type: 'number' },
        enrolled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bruger allerede tilmeldt kursus' })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/enroll')
  async enrollInCourse(
    @Param('id', ParseIntPipe) courseId: number,
    @Req() req,
  ): Promise<{ message: string; courseId: number; enrolled: boolean }> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
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

    // Check if user is already enrolled (has any progress in this course)
    const existingProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        OR: [
          {
            lessonId: {
              in: course.topics.flatMap((topic) =>
                topic.lessons.map((lesson) => lesson.id),
              ),
            },
          },
          {
            quizId: {
              in: course.topics.flatMap((topic) =>
                topic.quizzes.map((quiz) => quiz.id),
              ),
            },
          },
        ],
      },
    });

    if (existingProgress) {
      throw new BadRequestException('Bruger er allerede tilmeldt dette kursus');
    }

    // Create initial progress record to mark enrollment
    // We'll create a progress record for the first lesson if available
    const firstLesson = course.topics[0]?.lessons[0];
    if (firstLesson) {
      await this.prisma.userProgress.create({
        data: {
          userId,
          lessonId: firstLesson.id,
          status: 'NOT_STARTED',
        },
      });
    }

    // Invalidate relevant caches
    await this.cacheManager.del(`user_courses_${userId}`);
    await this.cacheManager.del(`user_progress_${userId}`);

    this.logger.log(`User ${userId} enrolled in course ${courseId}`);
    return {
      message: 'Tilmeldt kursus',
      courseId,
      enrolled: true,
    };
  }

  @ApiOperation({ summary: 'Afmeld bruger fra kursus' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Bruger afmeldt kursus',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        courseId: { type: 'number' },
        enrolled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bruger ikke tilmeldt kursus' })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/enroll')
  async unenrollFromCourse(
    @Param('id', ParseIntPipe) courseId: number,
    @Req() req,
  ): Promise<{ message: string; courseId: number; enrolled: boolean }> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
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

    // Check if user is enrolled
    const existingProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        OR: [
          {
            lessonId: {
              in: course.topics.flatMap((topic) =>
                topic.lessons.map((lesson) => lesson.id),
              ),
            },
          },
          {
            quizId: {
              in: course.topics.flatMap((topic) =>
                topic.quizzes.map((quiz) => quiz.id),
              ),
            },
          },
        ],
      },
    });

    if (!existingProgress) {
      throw new BadRequestException('Bruger er ikke tilmeldt dette kursus');
    }

    // Delete all progress records for this course
    await this.prisma.userProgress.deleteMany({
      where: {
        userId,
        OR: [
          {
            lessonId: {
              in: course.topics.flatMap((topic) =>
                topic.lessons.map((lesson) => lesson.id),
              ),
            },
          },
          {
            quizId: {
              in: course.topics.flatMap((topic) =>
                topic.quizzes.map((quiz) => quiz.id),
              ),
            },
          },
        ],
      },
    });

    // Invalidate relevant caches
    await this.cacheManager.del(`user_courses_${userId}`);
    await this.cacheManager.del(`user_progress_${userId}`);

    this.logger.log(`User ${userId} unenrolled from course ${courseId}`);
    return {
      message: 'Afmeldt kursus',
      courseId,
      enrolled: false,
    };
  }

  @ApiOperation({ summary: 'Tjek brugers tilmeldingsstatus for kursus' })
  @ApiParam({ name: 'id', description: 'Kursus ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tilmeldingsstatus',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'number' },
        enrolled: { type: 'boolean' },
        progress: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/enrollment-status')
  async getCourseEnrollmentStatus(
    @Param('id', ParseIntPipe) courseId: number,
    @Req() req,
  ): Promise<{ courseId: number; enrolled: boolean; progress?: number }> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Ikke autoriseret');
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
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

    // Check enrollment status
    const userProgress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        OR: [
          {
            lessonId: {
              in: course.topics.flatMap((topic) =>
                topic.lessons.map((lesson) => lesson.id),
              ),
            },
          },
          {
            quizId: {
              in: course.topics.flatMap((topic) =>
                topic.quizzes.map((quiz) => quiz.id),
              ),
            },
          },
        ],
      },
    });

    const enrolled = userProgress.length > 0;
    let progress = 0;

    if (enrolled) {
      // Calculate progress percentage
      const totalItems = course.topics.reduce(
        (total, topic) => total + topic.lessons.length + topic.quizzes.length,
        0,
      );
      const completedItems = userProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    }

    return {
      courseId,
      enrolled,
      ...(enrolled && { progress }),
    };
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
        topics: {
          // Rettet fra modules til topics
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
    if (courseWithDetails.topics) {
      // Rettet fra modules til topics
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
