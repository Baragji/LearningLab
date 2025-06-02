import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma/prisma.service';

/**
 * Service til at hente indhold fra lessons og topics
 */
@Injectable()
export class ContentFetcher {
  private readonly logger = new Logger(ContentFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hent indhold fra en lesson
   */
  async fetchLessonContent(lessonId: number): Promise<string> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        contentBlocks: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new Error(`Lesson med ID ${lessonId} ikke fundet`);
    }

    const combinedContent = lesson.contentBlocks
      .map(block => block.content)
      .join('\n\n');

    if (!combinedContent.trim()) {
      throw new Error('Ingen indhold fundet i lesson til spørgsmålsgenerering');
    }

    return combinedContent;
  }

  /**
   * Hent indhold fra et topic (alle lessons)
   */
  async fetchTopicContent(topicId: number): Promise<string> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        lessons: {
          where: { deletedAt: null },
          include: {
            contentBlocks: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new Error(`Topic med ID ${topicId} ikke fundet`);
    }

    const combinedContent = topic.lessons
      .flatMap(lesson => lesson.contentBlocks)
      .map(block => block.content)
      .join('\n\n');

    if (!combinedContent.trim()) {
      throw new Error('Ingen indhold fundet i topic til spørgsmålsgenerering');
    }

    return combinedContent;
  }

  /**
   * Hent indhold fra et course (alle topics og lessons)
   */
  async fetchCourseContent(courseId: number): Promise<string> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          where: { deletedAt: null },
          include: {
            lessons: {
              where: { deletedAt: null },
              include: {
                contentBlocks: {
                  where: { deletedAt: null },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new Error(`Course med ID ${courseId} ikke fundet`);
    }

    const combinedContent = course.topics
      .flatMap(topic => topic.lessons)
      .flatMap(lesson => lesson.contentBlocks)
      .map(block => block.content)
      .join('\n\n');

    if (!combinedContent.trim()) {
      throw new Error('Ingen indhold fundet i course til spørgsmålsgenerering');
    }

    return combinedContent;
  }

  /**
   * Hent metadata om indhold
   */
  async fetchContentMetadata(contentType: string, contentId: number) {
    switch (contentType) {
      case 'lesson':
        return this.prisma.lesson.findUnique({
          where: { id: contentId },
          select: { title: true, description: true },
        });
      
      case 'topic':
        return this.prisma.topic.findUnique({
          where: { id: contentId },
          select: { title: true, description: true },
        });
      
      case 'course':
        return this.prisma.course.findUnique({
          where: { id: contentId },
          select: { title: true, description: true },
        });
      
      default:
        return null;
    }
  }
}