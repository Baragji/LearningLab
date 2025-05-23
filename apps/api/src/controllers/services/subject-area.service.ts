// apps/api/src/controllers/services/subject-area.service.ts
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
import { SubjectArea } from '@prisma/client';
import {
  CreateSubjectAreaDto,
  UpdateSubjectAreaDto,
} from '../dto/subject-area/subject-area.dto';

@Injectable()
export class SubjectAreaService extends BaseService<SubjectArea> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Finder alle fagområder med paginering, sortering og filtrering
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med fagområder
   */
  async findAllSubjectAreas(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<SubjectArea>> {
    // Tilføj standard include for fagområder
    const include = {
      ...options.include,
      courses: options.include?.courses ?? false,
    };

    return this.findAll({ ...options, include });
  }

  /**
   * Finder et fagområde ud fra slug
   * @param slug Fagområde slug
   * @param includeRelations Om relationer skal inkluderes
   * @returns Fagområde eller null hvis ikke fundet
   */
  async findBySlug(
    slug: string,
    includeRelations: boolean = false,
  ): Promise<SubjectArea | null> {
    return this.prisma.subjectArea.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: includeRelations ? { courses: true } : undefined,
    });
  }

  /**
   * Opretter et nyt fagområde
   * @param createSubjectAreaDto DTO med fagområde data
   * @param userId ID på brugeren der opretter fagområdet
   * @returns Det oprettede fagområde
   */
  async createSubjectArea(
    createSubjectAreaDto: CreateSubjectAreaDto,
    userId?: number,
  ): Promise<SubjectArea> {
    const { name, slug, description, tags, categories, image, banner } =
      createSubjectAreaDto;

    // Tjek om slug allerede eksisterer
    const existingSubjectArea = await this.prisma.subjectArea.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (existingSubjectArea) {
      throw new ConflictException(
        'Et fagområde med dette slug eksisterer allerede',
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
   * Opdaterer et eksisterende fagområde
   * @param id Fagområde ID
   * @param updateSubjectAreaDto DTO med opdateret fagområde data
   * @param userId ID på brugeren der opdaterer fagområdet
   * @returns Det opdaterede fagområde
   */
  async updateSubjectArea(
    id: number,
    updateSubjectAreaDto: UpdateSubjectAreaDto,
    userId?: number,
  ): Promise<SubjectArea> {
    const { name, slug, description, tags, categories, image, banner } =
      updateSubjectAreaDto;

    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await this.findById(id);

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingSubjectArea.slug) {
      const slugExists = await this.prisma.subjectArea.findFirst({
        where: {
          slug,
          deletedAt: null,
          id: { not: id }, // Ekskluder det nuværende fagområde
        },
      });

      if (slugExists) {
        throw new ConflictException(
          'Et fagområde med dette slug eksisterer allerede',
        );
      }
    }

    return this.update(
      id,
      {
        name: name !== undefined ? name : existingSubjectArea.name,
        slug: slug !== undefined ? slug : existingSubjectArea.slug,
        description:
          description !== undefined
            ? description
            : existingSubjectArea.description,
        tags: tags !== undefined ? tags : existingSubjectArea.tags,
        categories:
          categories !== undefined
            ? categories
            : existingSubjectArea.categories,
        image: image !== undefined ? image : existingSubjectArea.image,
        banner: banner !== undefined ? banner : existingSubjectArea.banner,
      },
      userId,
    );
  }

  /**
   * Sletter et fagområde (soft delete)
   * @param id Fagområde ID
   * @param userId ID på brugeren der sletter fagområdet
   * @returns Det slettede fagområde
   */
  async deleteSubjectArea(id: number, userId?: number): Promise<SubjectArea> {
    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await this.findById(id);

    // Tjek om der er kurser tilknyttet fagområdet
    const coursesCount = await this.prisma.course.count({
      where: {
        subjectAreaId: id,
        deletedAt: null,
      },
    });

    if (coursesCount > 0) {
      throw new BadRequestException(
        'Fagområdet kan ikke slettes, da der er kurser tilknyttet. Slet venligst kurserne først.',
      );
    }

    return this.softDelete(id, userId);
  }

  /**
   * Søger efter fagområder baseret på navn eller slug med avanceret filtrering
   * @param searchTerm Søgeterm
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med fagområder
   */
  async searchSubjectAreas(
    searchTerm: string,
    options: PaginationOptions & { filters?: Record<string, any> } = {},
  ): Promise<PaginatedResult<SubjectArea>> {
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
   * Udfører fuld-tekst søgning på tværs af kurser, moduler og lektioner
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
      modules?: any[];
      lessons?: any[];
    };
  }> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      contentTypes = ['course', 'module', 'lesson'],
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
      module: {
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
    const results: { courses?: any[]; modules?: any[]; lessons?: any[] } = {};
    let totalCount = 0;

    // Parallelle søgninger for bedre performance
    const searchPromises = [];

    if (contentTypes.includes('course')) {
      searchPromises.push(
        this.prisma.course
          .findMany({
            where: searchFilters.course,
            include: {
              subjectArea: true,
              modules: {
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

    if (contentTypes.includes('module')) {
      searchPromises.push(
        this.prisma.module
          .findMany({
            where: searchFilters.module,
            include: {
              course: {
                include: {
                  subjectArea: true,
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
          .then((modules) => {
            results.modules = modules;
            return this.prisma.module.count({ where: searchFilters.module });
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
    return 'subjectArea';
  }

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   */
  protected getModelDisplayName(): string {
    return 'Fagområde';
  }
}
