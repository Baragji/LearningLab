// apps/api/src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SearchCacheService } from './search-cache.service';
import { Difficulty, CourseStatus, Prisma } from '@prisma/client';

interface SearchParams {
  query?: string;
  type?: 'course' | 'topic' | 'lesson' | 'material' | 'file' | 'all';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: SearchCacheService,
  ) {}

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

    // Check cache first if caching is appropriate
    if (this.cacheService.shouldCache(params)) {
      const cachedResult = this.cacheService.get(params);
      if (cachedResult) {
        this.logger.debug('Returning cached search results');
        return {
          ...cachedResult,
          meta: {
            ...cachedResult.meta,
            fromCache: true,
          },
        };
      }
    }

    // Beregn offset baseret på side og limit
    const offset = (page - 1) * limit;

    // Initialiser resultater
    let courses = [];
    let topics = [];
    let lessons = [];
    let materials = [];
    let files = [];
    let total = 0;
    let lessonWhere: Prisma.LessonWhereInput | undefined = undefined;

    // Performance optimization: Use database indexes efficiently
    const searchStartTime = Date.now();
    this.logger.debug(`Starting search with params: ${JSON.stringify(params)}`);

    // Opbyg base where-betingelser for kurser med optimeret indexing
    const courseWhereBase: Prisma.CourseWhereInput = {
      // Use indexed fields first for better performance
      deletedAt: null,
      ...(educationProgramId && { educationProgramId }), // Indexed field
      ...(difficulty && { difficulty }), // Indexed field
      ...(status && {
        status: Array.isArray(status) ? { in: status } : status, // Indexed field
      }),
      ...(tags &&
        tags.length > 0 && {
          tags: { hasSome: tags },
        }),
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } }, // Indexed field
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
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
        // Optimized ordering using indexed fields
        orderBy: query
          ? [
              { title: 'asc' }, // Use indexed title field
            ]
          : { createdAt: 'desc' }, // Use indexed createdAt field
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
      // Opbyg where-betingelser for topics med optimeret indexing
      const topicWhere: Prisma.TopicWhereInput = {
        deletedAt: null,
        course: {
          // Use indexed fields first
          deletedAt: null,
          ...(educationProgramId && { educationProgramId }),
          ...(difficulty && { difficulty }),
          ...(status && {
            status: Array.isArray(status) ? { in: status } : status,
          }),
          ...(tags &&
            tags.length > 0 && {
              tags: { hasSome: tags },
            }),
        },
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } }, // Indexed field
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
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
      // Opbyg where-betingelser for lektioner med optimeret indexing
      lessonWhere = {
        deletedAt: null,
        topic: {
          deletedAt: null,
          course: {
            // Use indexed fields first for better performance
            deletedAt: null,
            ...(educationProgramId && { educationProgramId }),
            ...(difficulty && { difficulty }),
            ...(status && {
              status: Array.isArray(status) ? { in: status } : status,
            }),
            ...(tags &&
              tags.length > 0 && {
                tags: { hasSome: tags },
              }),
          },
        },
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } }, // Indexed field
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

    // Søg efter materialer hvis type er 'material' eller 'all'
    if (type === 'material' || type === 'all') {
      const materialWhere: Prisma.ContentBlockWhereInput = {
        deletedAt: null,
        lesson: {
          deletedAt: null,
          topic: {
            deletedAt: null,
            course: {
              // Use indexed fields first for better performance
              deletedAt: null,
              ...(educationProgramId && { educationProgramId }),
              ...(difficulty && { difficulty }),
              ...(status && {
                status: Array.isArray(status) ? { in: status } : status,
              }),
              ...(tags &&
                tags.length > 0 && {
                  tags: { hasSome: tags },
                }),
            },
          },
        },
        ...(query && {
          content: { contains: query, mode: 'insensitive' },
        }),
      };

      materials = await this.prisma.contentBlock.findMany({
        where: materialWhere,
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              topic: {
                select: {
                  id: true,
                  title: true,
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
          },
          file: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              mimeType: true,
              size: true,
              url: true,
            },
          },
        },
        orderBy: query ? [{ order: 'asc' }] : { createdAt: 'desc' },
        skip: offset,
        take: type === 'all' ? Math.floor(limit / 5) : limit,
      });

      materials = materials.map((material) => ({
        ...material,
        relevanceScore: this.calculateMaterialRelevanceScore(material, query),
      }));

      if (type === 'material') {
        total = await this.prisma.contentBlock.count({ where: materialWhere });
      }
    }

    // Søg efter filer hvis type er 'file' eller 'all'
    if (type === 'file' || type === 'all') {
      const fileWhere: Prisma.FileWhereInput = {
        ...(query && {
          OR: [
            { filename: { contains: query, mode: 'insensitive' } }, // Indexed field
            { originalName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { mimeType: { contains: query, mode: 'insensitive' } }, // Indexed field
          ],
        }),
      };

      files = await this.prisma.file.findMany({
        where: fileWhere,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: query ? [{ filename: 'asc' }] : { createdAt: 'desc' },
        skip: offset,
        take: type === 'all' ? Math.floor(limit / 5) : limit,
      });

      files = files.map((file) => ({
        ...file,
        relevanceScore: this.calculateFileRelevanceScore(file, query),
      }));

      if (type === 'file') {
        total = await this.prisma.file.count({ where: fileWhere });
      }
    }

    // Hvis type er 'all', beregn det samlede antal resultater med optimeret queries
    if (type === 'all') {
      const courseCount = await this.prisma.course.count({
        where: courseWhereBase,
      });
      const topicWhereFull: Prisma.TopicWhereInput = {
        deletedAt: null,
        course: {
          // Use indexed fields first
          deletedAt: null,
          ...(educationProgramId && { educationProgramId }),
          ...(difficulty && { difficulty }),
          ...(status && {
            status: Array.isArray(status) ? { in: status } : status,
          }),
          ...(tags &&
            tags.length > 0 && {
              tags: { hasSome: tags },
            }),
        },
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
      };
      const topicCount = await this.prisma.topic.count({
        where: topicWhereFull,
      });
      const lessonCount = await this.prisma.lesson.count({
        where: lessonWhere,
      });

      const materialWhereFull: Prisma.ContentBlockWhereInput = {
        deletedAt: null,
        lesson: {
          deletedAt: null,
          topic: {
            deletedAt: null,
            course: {
              // Use indexed fields first
              deletedAt: null,
              ...(educationProgramId && { educationProgramId }),
              ...(difficulty && { difficulty }),
              ...(status && {
                status: Array.isArray(status) ? { in: status } : status,
              }),
              ...(tags &&
                tags.length > 0 && {
                  tags: { hasSome: tags },
                }),
            },
          },
        },
        ...(query && {
          content: { contains: query, mode: 'insensitive' },
        }),
      };
      const materialCount = await this.prisma.contentBlock.count({
        where: materialWhereFull,
      });

      const fileWhereFull: Prisma.FileWhereInput = {
        ...(query && {
          OR: [
            { filename: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { mimeType: { contains: query, mode: 'insensitive' } },
          ],
        }),
      };
      const fileCount = await this.prisma.file.count({ where: fileWhereFull });

      total =
        courseCount + topicCount + lessonCount + materialCount + fileCount;
    }

    // Performance logging
    const searchEndTime = Date.now();
    const searchDuration = searchEndTime - searchStartTime;
    this.logger.debug(
      `Search completed in ${searchDuration}ms. Results: courses=${courses.length}, topics=${topics.length}, lessons=${lessons.length}, materials=${materials.length}, files=${files.length}`,
    );

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
    if (materials.length > 0) {
      responseData.materials = materials;
    }
    if (files.length > 0) {
      responseData.files = files;
    }

    // Final performance log
    const totalProcessingTime = Date.now() - searchStartTime;
    this.logger.debug(`Total search processing time: ${totalProcessingTime}ms`);

    const result = {
      data: responseData,
      total,
      page,
      limit,
      totalPages,
      meta: {
        searchDuration: totalProcessingTime,
        indexesUsed: true, // Indicates optimized queries with indexes
        fromCache: false,
      },
    };

    // Cache the result if appropriate
    if (this.cacheService.shouldCache(params)) {
      // Use shorter TTL for searches with many results (more likely to change)
      const cacheTTL = total > 100 ? 2 * 60 * 1000 : undefined; // 2 minutes for large result sets
      this.cacheService.set(params, result, cacheTTL);
    }

    return result;
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

  /**
   * Beregner en relevance score for et materiale baseret på søgeteksten
   */
  private calculateMaterialRelevanceScore(
    material: any,
    query?: string,
  ): number {
    if (!query) return 1;

    const lowerQuery = query.toLowerCase();
    let score = 1;

    // Tjek indhold for match
    if (
      material.content &&
      material.content.toLowerCase().includes(lowerQuery)
    ) {
      score += 3;
    }

    // Tjek type for match
    if (material.type && material.type.toLowerCase() === lowerQuery) {
      score += 5;
    }

    // Tjek fil navn hvis der er en tilknyttet fil
    if (
      material.file &&
      material.file.filename &&
      material.file.filename.toLowerCase().includes(lowerQuery)
    ) {
      score += 2;
    }

    return score;
  }

  /**
   * Beregner en relevance score for en fil baseret på søgeteksten
   */
  private calculateFileRelevanceScore(file: any, query?: string): number {
    if (!query) return 1;

    const lowerQuery = query.toLowerCase();
    let score = 1;

    // Tjek filnavn for eksakt match
    if (file.filename && file.filename.toLowerCase() === lowerQuery) {
      score += 5;
    }
    // Tjek filnavn for delvist match
    else if (
      file.filename &&
      file.filename.toLowerCase().includes(lowerQuery)
    ) {
      score += 3;
    }

    // Tjek originalt navn
    if (
      file.originalName &&
      file.originalName.toLowerCase().includes(lowerQuery)
    ) {
      score += 2;
    }

    // Tjek beskrivelse
    if (
      file.description &&
      file.description.toLowerCase().includes(lowerQuery)
    ) {
      score += 1;
    }

    // Tjek MIME type
    if (file.mimeType && file.mimeType.toLowerCase().includes(lowerQuery)) {
      score += 1;
    }

    return score;
  }
}
