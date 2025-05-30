// apps/api/src/controllers/services/topic.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  BaseService,
  PaginationOptions,
  PaginatedResult,
} from '../../common/services/base.service';
import { Topic, Lesson, Quiz } from '@prisma/client';
import {
  CreateTopicDto,
  UpdateTopicDto,
} from '../dto/topic/topic.dto';

@Injectable()
export class TopicService extends BaseService<Topic> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Finder alle topics for et specifikt kursus
   * @param courseId Kursus ID
   * @param options Indstillinger for paginering, sortering og filtrering
   * @returns Pagineret resultat med topics
   */
  async findTopicsByCourse(
    courseId: number,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Topic>> {
    // Tilføj standard include for topics
    const include = {
      ...options.include,
      lessons: options.include?.lessons ?? false,
      quizzes: options.include?.quizzes ?? false,
    };

    // Tilføj courseId til filteret
    const filter = {
      ...options.filter,
      courseId,
      deletedAt: null,
    };

    return this.findAll({ ...options, include, filter, sort: 'order', order: 'asc' });
  }

  /**
   * Finder et topic ud fra ID
   * @param id Topic ID
   * @param includeRelations Om relationer skal inkluderes
   * @returns Topic eller null hvis ikke fundet
   */
  async findTopicById(
    id: number,
    includeRelations: boolean = false,
  ): Promise<Topic | null> {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: includeRelations
        ? {
            course: {
              include: {
                educationProgram: true,
              },
            },
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                contentBlocks: true,
                quizzes: true,
              },
            },
            quizzes: true,
          }
        : undefined,
    });

    if (!topic) {
      throw new NotFoundException('Topicet blev ikke fundet');
    }

    return topic;
  }

  /**
   * Opretter et nyt topic
   * @param createTopicDto DTO med topic data
   * @param userId ID på brugeren der opretter topicet
   * @returns Det oprettede topic
   */
  async createTopic(
    createTopicDto: CreateTopicDto,
    userId?: number,
  ): Promise<Topic> {
    const { title, description, order, courseId } = createTopicDto;

    // Tjek om kurset eksisterer
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Det angivne kursus findes ikke');
    }

    // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter det sidste topic
    let determinedOrder = order;
    if (determinedOrder === undefined) {
      const lastTopic = await this.prisma.topic.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
      });

      determinedOrder = lastTopic ? lastTopic.order + 1 : 1;
    }

    return this.create(
      {
        title,
        description,
        order: determinedOrder,
        courseId,
      },
      userId,
    );
  }

  /**
   * Opdaterer et eksisterende topic
   * @param id Topic ID
   * @param updateTopicDto DTO med opdateret topic data
   * @param userId ID på brugeren der opdaterer topicet
   * @returns Det opdaterede topic
   */
  async updateTopic(
    id: number,
    updateTopicDto: UpdateTopicDto,
    userId?: number,
  ): Promise<Topic> {
    const { title, description, order, courseId } = updateTopicDto;

    // Tjek om topicet eksisterer
    const existingTopic = await this.findById(id);

    // Hvis courseId ændres, tjek om det nye kursus eksisterer
    if (courseId && courseId !== existingTopic.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException('Det angivne kursus findes ikke');
      }
    }

    return this.update(
      id,
      {
        title: title !== undefined ? title : existingTopic.title,
        description: description !== undefined ? description : existingTopic.description,
        order: order !== undefined ? order : existingTopic.order,
        courseId: courseId !== undefined ? courseId : existingTopic.courseId,
      },
      userId,
    );
  }

  /**
   * Sletter et topic (soft delete)
   * @param id Topic ID
   * @param userId ID på brugeren der sletter topicet
   * @returns Det slettede topic
   */
  async deleteTopic(id: number, userId?: number): Promise<Topic> {
    // Tjek om topicet eksisterer
    const existingTopic: Topic & { lessons?: Lesson[]; quizzes?: Quiz[] } = await this.findTopicById(id, true);

    // Tjek om der er lektioner eller quizzer tilknyttet topicet
    if ((existingTopic.lessons && existingTopic.lessons.length > 0) || 
        (existingTopic.quizzes && existingTopic.quizzes.length > 0)) {
      throw new BadRequestException(
        'Topicet kan ikke slettes, da der er lektioner eller quizzer tilknyttet. Slet venligst disse først.',
      );
    }

    const deletedTopic = await this.softDelete(id, userId);

    // Opdater rækkefølgen af de resterende topics
    const remainingTopics = await this.prisma.topic.findMany({
      where: { 
        courseId: existingTopic.courseId,
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
    });

    const updates = remainingTopics.map((topic, index) => {
      return this.prisma.topic.update({
        where: { id: topic.id },
        data: { order: index + 1 },
      });
    });

    await this.prisma.$transaction(updates);

    return deletedTopic;
  }

  /**
   * Opdaterer rækkefølgen af topics i et kursus
   * @param courseId Kursus ID
   * @param topicIds Array af topic IDs i den ønskede rækkefølge
   * @param userId ID på brugeren der opdaterer rækkefølgen
   * @returns Array af opdaterede topics
   */
  async updateTopicsOrder(
    courseId: number,
    topicIds: number[],
    userId?: number,
  ): Promise<Topic[]> {
    // Tjek om kurset eksisterer
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { topics: true },
    });

    if (!course) {
      throw new NotFoundException('Det angivne kursus findes ikke');
    }

    // Tjek om den nye rækkefølge er gyldig
    if (topicIds.length !== course.topics.length) {
      throw new BadRequestException(
        'Den nye rækkefølge skal indeholde samme antal topics som kurset',
      );
    }

    // Tjek om alle topic ID'er i topicIds faktisk tilhører kurset
    const courseTopicIds = course.topics.map(topic => topic.id);
    const allTopicIdsBelongToCourse = topicIds.every(id => courseTopicIds.includes(id));
    if (!allTopicIdsBelongToCourse) {
      throw new BadRequestException(
        'En eller flere af de angivne topic-ID\'er tilhører ikke det specificerede kursus.',
      );
    }
    
    // Tjek for duplikerede ID'er i topicIds
    const uniqueTopicIds = new Set(topicIds);
    if (uniqueTopicIds.size !== topicIds.length) {
      throw new BadRequestException('Topic-ID\'er i den nye rækkefølge må ikke være duplikerede.');
    }

    // Opdater rækkefølgen af topics
    const updates = topicIds.map((topicId, index) => {
      return this.prisma.topic.update({
        where: { id: topicId },
        data: { 
          order: index + 1,
          updatedBy: userId || null,
          updatedAt: new Date(),
        },
      });
    });

    await this.prisma.$transaction(updates);

    return this.prisma.topic.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Returnerer modelnavnet for Prisma-klienten
   */
  protected getModelName(): string {
    return 'topic';
  }

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   */
  protected getModelDisplayName(): string {
    return 'Topic';
  }
}