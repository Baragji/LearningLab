// apps/api/src/controllers/services/education-program.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  BaseService,
  PaginationOptions,
  PaginatedResult,
} from '../../common/services/base.service';
import { EducationProgram } from '@prisma/client';
import {
  CreateEducationProgramDto,
  UpdateEducationProgramDto,
} from '../dto/education-program/education-program.dto';

@Injectable()
export class EducationProgramService extends BaseService<EducationProgram> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Finder alle uddannelsesprogrammer med paginering, sortering og filtrering
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med uddannelsesprogrammer
   */
  async findAllEducationPrograms(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<EducationProgram>> {
    // Tilføj standard include for uddannelsesprogrammer
    const include = {
      ...options.include,
      courses: options.include?.courses ?? false,
    };

    return this.findAll({ ...options, include });
  }

  /**
   * Finder et uddannelsesprogram ud fra slug
   * @param slug Uddannelsesprogram slug
   * @param includeRelations Om relationer skal inkluderes
   * @returns Uddannelsesprogram eller null hvis ikke fundet
   */
  async findBySlug(
    slug: string,
    includeRelations: boolean = false,
  ): Promise<EducationProgram | null> {
    return this.prisma.educationProgram.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: includeRelations ? { courses: true } : undefined,
    });
  }

  /**
   * Opretter et nyt uddannelsesprogram
   * @param createEducationProgramDto DTO med uddannelsesprogram data
   * @param userId ID på brugeren der opretter uddannelsesprogrammet
   * @returns Det oprettede uddannelsesprogram
   */
  async createEducationProgram(
    createEducationProgramDto: CreateEducationProgramDto,
    userId?: number,
  ): Promise<EducationProgram> {
    const { name, slug, description, tags, categories, image, banner } =
      createEducationProgramDto;

    // Tjek om slug allerede eksisterer
    const existingEducationProgram =
      await this.prisma.educationProgram.findFirst({
        where: {
          slug,
          deletedAt: null,
        },
      });

    if (existingEducationProgram) {
      throw new ConflictException(
        'Et uddannelsesprogram med dette slug eksisterer allerede',
      );
    }

    return this.create(
      {
        name,
        slug,
        description,
        tags,
        categories,
        image,
        banner,
      },
      userId,
    );
  }

  /**
   * Opdaterer et eksisterende uddannelsesprogram
   * @param id Uddannelsesprogram ID
   * @param updateEducationProgramDto DTO med opdateret uddannelsesprogram data
   * @param userId ID på brugeren der opdaterer uddannelsesprogrammet
   * @returns Det opdaterede uddannelsesprogram
   */
  async updateEducationProgram(
    id: number,
    updateEducationProgramDto: UpdateEducationProgramDto,
    userId?: number,
  ): Promise<EducationProgram> {
    const { name, slug, description, tags, categories, image, banner } =
      updateEducationProgramDto;

    // Tjek om uddannelsesprogrammet eksisterer
    const existingEducationProgram = await this.findById(id);

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingEducationProgram.slug) {
      const slugExists = await this.prisma.educationProgram.findFirst({
        where: {
          slug,
          deletedAt: null,
          id: { not: id }, // Ekskluder det nuværende uddannelsesprogram
        },
      });

      if (slugExists) {
        throw new ConflictException(
          'Et uddannelsesprogram med dette slug eksisterer allerede',
        );
      }
    }

    return this.update(
      id,
      {
        name: name !== undefined ? name : existingEducationProgram.name,
        slug: slug !== undefined ? slug : existingEducationProgram.slug,
        description: description, // Prisma handles undefined: if description is undefined, it won't be updated
        tags: tags !== undefined ? tags : existingEducationProgram.tags,
        categories:
          categories !== undefined
            ? categories
            : existingEducationProgram.categories,
        image: image !== undefined ? image : existingEducationProgram.image,
        banner: banner !== undefined ? banner : existingEducationProgram.banner,
      },
      userId,
    );
  }

  /**
   * Sletter et uddannelsesprogram (soft delete)
   * @param id Uddannelsesprogram ID
   * @param userId ID på brugeren der sletter uddannelsesprogrammet
   * @returns Det slettede uddannelsesprogram
   */
  async deleteEducationProgram(
    id: number,
    userId?: number,
  ): Promise<EducationProgram> {
    // Tjek om uddannelsesprogrammet eksisterer
    const existingEducationProgram = await this.findById(id);

    // Tjek om der er kurser tilknyttet uddannelsesprogrammet
    const coursesCount = await this.prisma.course.count({
      where: {
        educationProgramId: id,
        deletedAt: null,
      },
    });

    if (coursesCount > 0) {
      throw new BadRequestException(
        'Uddannelsesprogrammet kan ikke slettes, da der er kurser tilknyttet. Slet venligst kurserne først.',
      );
    }

    return this.softDelete(id, userId);
  }

  /**
   * Søger efter uddannelsesprogrammer baseret på navn eller slug med avanceret filtrering
   * @param searchTerm Søgeterm
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med uddannelsesprogrammer
   */
  async searchEducationPrograms(
    searchTerm: string,
    options: PaginationOptions & { filters?: Record<string, any> } = {},
  ): Promise<PaginatedResult<EducationProgram>> {
    const { filters = {} } = options;

    // Opbyg søgefilter
    const searchFilter = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // Opbyg filter baseret på tags, kategorier og sværhedsgrad
    const advancedFilters: any = {};

    if (filters.tags && filters.tags.length > 0) {
      advancedFilters.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.categories && filters.categories.length > 0) {
      advancedFilters.categories = {
        hasSome: filters.categories,
      };
    }

    if (filters.difficulty) {
      advancedFilters.difficulty = filters.difficulty;
    }

    // Kombiner søgefilter med avancerede filtre
    const combinedFilter = {
      ...searchFilter,
      ...advancedFilters,
      deletedAt: null,
    };

    return this.findAll({
      ...options,
      filter: combinedFilter,
    });
  }

  /**
   * Udfører fuld-tekst søgning på tværs af kurser, emner og lektioner
   * @param searchTerm Søgeterm
   * @param options Indstillinger for paginering, filtrering og indholdstyper
   * @returns Pagineret resultat med søgeresultater grupperet efter type
   */
  async fullTextSearch(
    searchTerm: string,
    options: {
      page?: number;
      limit?: number;
      filters?: Record<string, any>;
      contentTypes?: string[];
    } = {},
  ): Promise<{
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    results: {
      courses?: any[];
      topics?: any[];
      lessons?: any[];
    };
  }> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      contentTypes = ['course', 'topic', 'lesson'],
    } = options;

    // Opbyg filter baseret på tags, kategorier og sværhedsgrad
    const advancedFilters: any = {
      deletedAt: null,
    };

    if (filters.tags && filters.tags.length > 0) {
      advancedFilters.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.categories && filters.categories.length > 0) {
      advancedFilters.categories = {
        hasSome: filters.categories,
      };
    }

    if (filters.difficulty) {
      advancedFilters.difficulty = filters.difficulty;
    }

    // Beregn offset baseret på side og limit
    const skip = (page - 1) * limit;

    // Opret søgefiltre for hver indholdstype
    const searchFilters = {
      course: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
        ],
        ...advancedFilters,
      },
      topic: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
        ...advancedFilters,
      },
      lesson: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          {
            contentBlocks: {
              some: {
                content: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        ],
        ...advancedFilters,
      },
    };

    // Udfør søgninger for hver valgt indholdstype
    const results: { courses?: any[]; topics?: any[]; lessons?: any[] } = {};
    let totalCount = 0;

    // Parallelle søgninger for bedre performance
    const searchPromises = [];

    if (contentTypes.includes('course')) {
      searchPromises.push(
        this.prisma.course
          .findMany({
            where: searchFilters.course,
            include: {
              educationProgram: true,
              topics: {
                take: 3,
                where: { deletedAt: null },
                orderBy: { order: 'asc' },
              },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((courses) => {
            results.courses = courses;
            return this.prisma.course.count({ where: searchFilters.course });
          })
          .then((count) => {
            totalCount += count;
          }),
      );
    }

    if (contentTypes.includes('topic')) {
      searchPromises.push(
        this.prisma.topic
          .findMany({
            where: searchFilters.topic,
            include: {
              course: {
                include: {
                  educationProgram: true,
                },
              },
              lessons: {
                take: 3,
                where: { deletedAt: null },
                orderBy: { order: 'asc' },
              },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((topics) => {
            results.topics = topics;
            return this.prisma.topic.count({ where: searchFilters.topic });
          })
          .then((count) => {
            totalCount += count;
          }),
      );
    }

    if (contentTypes.includes('lesson')) {
      searchPromises.push(
        this.prisma.lesson
          .findMany({
            where: searchFilters.lesson,
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
                take: 1,
                where: {
                  content: { contains: searchTerm, mode: 'insensitive' },
                },
                orderBy: { order: 'asc' },
              },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          .then((lessons) => {
            results.lessons = lessons;
            return this.prisma.lesson.count({ where: searchFilters.lesson });
          })
          .then((count) => {
            totalCount += count;
          }),
      );
    }

    // Vent på alle søgninger er færdige
    await Promise.all(searchPromises);

    // Beregn total antal sider
    const totalPages = Math.ceil(totalCount / limit);

    return {
      totalCount,
      page,
      limit,
      totalPages,
      results,
    };
  }

  /**
   * Returnerer modelnavnet for Prisma-klienten
   */
  protected getModelName(): string {
    return 'educationProgram';
  }

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   */
  protected getModelDisplayName(): string {
    return 'Uddannelsesprogram';
  }
}
