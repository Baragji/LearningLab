// apps/api/src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { Difficulty, CourseStatus, Prisma } from '@prisma/client';

interface SearchParams {
  query?: string;
  type?: 'course' | 'topic' | 'lesson' | 'all';
  tags?: string[];
  difficulty?: Difficulty;
  status?: CourseStatus | CourseStatus[];
  educationProgramId?: number;
  page: number;
  limit: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchParams) {
    const {
      query,
      type,
      tags,
      difficulty,
      status,
      educationProgramId,
      page,
      limit,
    } = params;

    // Beregn offset baseret på side og limit
    const offset = (page - 1) * limit;

    // Initialiser resultater
    let courses = [];
    let topics = [];
    let lessons = [];
    let total = 0;
    let lessonWhere: Prisma.LessonWhereInput | undefined = undefined;

    // Opbyg base where-betingelser for kurser
    const courseWhereBase: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(tags &&
        tags.length > 0 && {
          tags: { hasSome: tags },
        }),
      ...(difficulty && { difficulty }),
      ...(status && {
        status: Array.isArray(status) ? { in: status } : status,
      }),
      ...(educationProgramId && { educationProgramId }),
    };

    // Søg efter kurser hvis type er 'course' eller 'all'
    if (type === 'course' || type === 'all') {
      courses = await this.prisma.course.findMany({
        where: courseWhereBase,
        include: {
          educationProgram: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: query
          ? [
              { title: 'asc' }, // Primær sortering efter titel
            ]
          : { createdAt: 'desc' }, // Hvis ingen søgetekst, sorter efter nyeste først
        skip: offset,
        take: type === 'all' ? Math.floor(limit / 3) : limit,
      });

      // Tilføj relevance score til hvert kursus
      courses = courses.map((course) => ({
        ...course,
        relevanceScore: this.calculateRelevanceScore(course, query),
      }));

      // Tæl totale antal kurser der matcher søgningen
      if (type === 'course') {
        total = await this.prisma.course.count({
          where: courseWhereBase,
        });
      }
    }

    // Søg efter topics hvis type er 'topic' eller 'all'
    if (type === 'topic' || type === 'all') {
      // Opbyg where-betingelser for topics
      const topicWhere: Prisma.TopicWhereInput = {
        deletedAt: null,
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
        course: {
          ...(tags &&
            tags.length > 0 && {
              tags: { hasSome: tags },
            }),
          ...(difficulty && { difficulty }),
          ...(status && {
            status: Array.isArray(status) ? { in: status } : status,
          }),
          ...(educationProgramId && { educationProgramId }),
          deletedAt: null,
        },
      };

      topics = await this.prisma.topic.findMany({
        where: topicWhere,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              educationProgram: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: query
          ? [
              { title: 'asc' }, // Primær sortering efter titel
            ]
          : { createdAt: 'desc' }, // Hvis ingen søgetekst, sorter efter nyeste først
        skip: offset,
        take: type === 'all' ? Math.floor(limit / 3) : limit,
      });

      // Tilføj relevance score til hvert topic
      topics = topics.map((topic) => ({
        ...topic,
        relevanceScore: this.calculateRelevanceScore(topic, query),
      }));

      // Tæl totale antal topics der matcher søgningen
      if (type === 'topic') {
        total = await this.prisma.topic.count({
          where: topicWhere,
        });
      }
    }

    // Søg efter lektioner hvis type er 'lesson' eller 'all'
    if (type === 'lesson' || type === 'all') {
      // Opbyg where-betingelser for lektioner
      lessonWhere = {
        deletedAt: null,
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            {
              contentBlocks: {
                some: {
                  content: { contains: query, mode: 'insensitive' },
                  deletedAt: null,
                },
              },
            },
          ],
        }),
        topic: {
          course: {
            ...(tags &&
              tags.length > 0 && {
                tags: { hasSome: tags },
              }),
            ...(difficulty && { difficulty }),
            ...(status && {
              status: Array.isArray(status) ? { in: status } : status,
            }),
            ...(educationProgramId && { educationProgramId }),
            deletedAt: null,
          },
          deletedAt: null,
        },
      };

      lessons = await this.prisma.lesson.findMany({
        where: lessonWhere,
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              courseId: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  educationProgram: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: query
          ? [
              { title: 'asc' }, // Primær sortering efter titel
            ]
          : { createdAt: 'desc' }, // Hvis ingen søgetekst, sorter efter nyeste først
        skip: offset,
        take: type === 'all' ? Math.floor(limit / 3) : limit,
      });

      // Tilføj relevance score til hver lektion
      lessons = lessons.map((lesson) => ({
        ...lesson,
        relevanceScore: this.calculateRelevanceScore(lesson, query),
      }));

      // Tæl totale antal lektioner der matcher søgningen
      if (type === 'lesson') {
        total = await this.prisma.lesson.count({
          where: lessonWhere,
        });
      }
    }

    // Hvis type er 'all', beregn det samlede antal resultater
    if (type === 'all') {
      const courseCount = await this.prisma.course.count({ where: courseWhereBase });
      const topicWhereFull: Prisma.TopicWhereInput = {
        deletedAt: null,
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
        course: {
          ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
          ...(difficulty && { difficulty }),
          ...(status && { status: Array.isArray(status) ? { in: status } : status }),
          ...(educationProgramId && { educationProgramId }),
          deletedAt: null,
        },
      };
      const topicCount = await this.prisma.topic.count({ where: topicWhereFull });
      const lessonCount = await this.prisma.lesson.count({ where: lessonWhere });
      total = courseCount + topicCount + lessonCount;
    }

    // Beregn totale antal sider
    const totalPages = Math.ceil(total / limit);

    const responseData: any = {};
    if (courses.length > 0) {
      responseData.courses = courses;
    }
    if (topics.length > 0) {
      responseData.topics = topics;
    }
    if (lessons.length > 0) {
      responseData.lessons = lessons;
    }

    return {
      data: responseData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Beregner en relevance score for et søgeresultat baseret på hvor godt det matcher søgeteksten
   */
  private calculateRelevanceScore(item: any, query?: string): number {
    if (!query) return 1; // Hvis ingen søgetekst, returner standard score

    const lowerQuery = query.toLowerCase();
    let score = 1;

    // Tjek titel for eksakt match (højeste score)
    if (item.title && item.title.toLowerCase() === lowerQuery) {
      score += 5;
    }
    // Tjek titel for delvist match
    else if (item.title && item.title.toLowerCase().includes(lowerQuery)) {
      score += 3;
    }

    // Tjek beskrivelse for match
    if (
      item.description &&
      item.description.toLowerCase().includes(lowerQuery)
    ) {
      score += 1;
    }

    // Tjek tags for match (hvis det er et kursus)
    if (item.tags && Array.isArray(item.tags)) {
      const matchingTags = item.tags.filter((tag) =>
        tag.toLowerCase().includes(lowerQuery),
      );
      score += matchingTags.length * 2;
    }

    return score;
  }
}
