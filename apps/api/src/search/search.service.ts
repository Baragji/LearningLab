// apps/api/src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
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
    let materials = [];
    let files = [];
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

    // Søg efter materialer hvis type er 'material' eller 'all'
    if (type === 'material' || type === 'all') {
      const materialWhere: Prisma.ContentBlockWhereInput = {
        deletedAt: null,
        ...(query && {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { type: { equals: query.toUpperCase() as any } },
          ],
        }),
        lesson: {
          topic: {
            course: {
              ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
              ...(difficulty && { difficulty }),
              ...(status && { status: Array.isArray(status) ? { in: status } : status }),
              ...(educationProgramId && { educationProgramId }),
              deletedAt: null,
            },
            deletedAt: null,
          },
          deletedAt: null,
        },
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
        orderBy: query
          ? [{ order: 'asc' }]
          : { createdAt: 'desc' },
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
            { filename: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { mimeType: { contains: query, mode: 'insensitive' } },
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
        orderBy: query
          ? [{ filename: 'asc' }]
          : { createdAt: 'desc' },
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
      
      const materialWhereFull: Prisma.ContentBlockWhereInput = {
        deletedAt: null,
        ...(query && {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { type: { equals: query.toUpperCase() as any } },
          ],
        }),
        lesson: {
          topic: {
            course: {
              ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
              ...(difficulty && { difficulty }),
              ...(status && { status: Array.isArray(status) ? { in: status } : status }),
              ...(educationProgramId && { educationProgramId }),
              deletedAt: null,
            },
            deletedAt: null,
          },
          deletedAt: null,
        },
      };
      const materialCount = await this.prisma.contentBlock.count({ where: materialWhereFull });
      
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
      
      total = courseCount + topicCount + lessonCount + materialCount + fileCount;
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
    if (materials.length > 0) {
      responseData.materials = materials;
    }
    if (files.length > 0) {
      responseData.files = files;
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

  /**
   * Beregner en relevance score for et materiale baseret på søgeteksten
   */
  private calculateMaterialRelevanceScore(material: any, query?: string): number {
    if (!query) return 1;

    const lowerQuery = query.toLowerCase();
    let score = 1;

    // Tjek indhold for match
    if (material.content && material.content.toLowerCase().includes(lowerQuery)) {
      score += 3;
    }

    // Tjek type for match
    if (material.type && material.type.toLowerCase() === lowerQuery) {
      score += 5;
    }

    // Tjek fil navn hvis der er en tilknyttet fil
    if (material.file && material.file.filename && 
        material.file.filename.toLowerCase().includes(lowerQuery)) {
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
    else if (file.filename && file.filename.toLowerCase().includes(lowerQuery)) {
      score += 3;
    }

    // Tjek originalt navn
    if (file.originalName && file.originalName.toLowerCase().includes(lowerQuery)) {
      score += 2;
    }

    // Tjek beskrivelse
    if (file.description && file.description.toLowerCase().includes(lowerQuery)) {
      score += 1;
    }

    // Tjek MIME type
    if (file.mimeType && file.mimeType.toLowerCase().includes(lowerQuery)) {
      score += 1;
    }

    return score;
  }
}
