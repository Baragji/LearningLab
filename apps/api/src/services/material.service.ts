import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ContentBlock, ContentBlockType, File } from '@prisma/client';

export interface CreateMaterialDto {
  type: ContentBlockType;
  content?: string;
  order?: number;
  lessonId: number;
  fileId?: number;
  createdBy: number;
}

export interface UpdateMaterialDto {
  type?: ContentBlockType;
  content?: string;
  order?: number;
  fileId?: number;
  updatedBy: number;
}

export interface BulkUpdateOrderDto {
  materials: Array<{
    id: number;
    order: number;
  }>;
  updatedBy: number;
}

export interface MaterialWithFile extends ContentBlock {
  file?: File;
  lesson?: {
    id: number;
    title: string;
    order: number;
    topic: {
      id: number;
      title: string;
      order: number;
      course: {
        id: number;
        title: string;
      };
    };
  };
}

@Injectable()
export class MaterialService {
  constructor(private prisma: PrismaService) {}

  async createMaterial(
    createDto: CreateMaterialDto,
  ): Promise<MaterialWithFile> {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createDto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${createDto.lessonId} not found`,
      );
    }

    // If fileId is provided, verify file exists
    if (createDto.fileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: createDto.fileId },
      });

      if (!file) {
        throw new NotFoundException(
          `File with ID ${createDto.fileId} not found`,
        );
      }
    }

    // Get next order if not provided
    let order = createDto.order;
    if (order === undefined) {
      const lastMaterial = await this.prisma.contentBlock.findFirst({
        where: { lessonId: createDto.lessonId },
        orderBy: { order: 'desc' },
      });
      order = lastMaterial ? lastMaterial.order + 1 : 0;
    }

    const material = await this.prisma.contentBlock.create({
      data: {
        type: createDto.type,
        content: createDto.content || '',
        order,
        lessonId: createDto.lessonId,
        fileId: createDto.fileId,
        createdBy: createDto.createdBy,
      },
      include: {
        file: true,
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return material;
  }

  async getMaterialById(id: number): Promise<MaterialWithFile> {
    const material = await this.prisma.contentBlock.findUnique({
      where: { id },
      include: {
        file: true,
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async getMaterialsByLesson(lessonId: number): Promise<MaterialWithFile[]> {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.contentBlock.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: {
        file: true,
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            topic: {
              select: {
                id: true,
                title: true,
                order: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getMaterialsByTopic(topicId: number): Promise<MaterialWithFile[]> {
    // Verify topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    return this.prisma.contentBlock.findMany({
      where: {
        lesson: {
          topicId,
        },
      },
      orderBy: [{ lesson: { order: 'asc' } }, { order: 'asc' }],
      include: {
        file: true,
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            topic: {
              select: {
                id: true,
                title: true,
                order: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getMaterialsByCourse(courseId: number): Promise<MaterialWithFile[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.contentBlock.findMany({
      where: {
        lesson: {
          topic: {
            courseId,
          },
        },
      },
      orderBy: [
        { lesson: { topic: { order: 'asc' } } },
        { lesson: { order: 'asc' } },
        { order: 'asc' },
      ],
      include: {
        file: true,
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            topic: {
              select: {
                id: true,
                title: true,
                order: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateMaterial(
    id: number,
    updateDto: UpdateMaterialDto,
  ): Promise<MaterialWithFile> {
    // Verify material exists
    const existingMaterial = await this.prisma.contentBlock.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    // If fileId is provided, verify file exists
    if (updateDto.fileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: updateDto.fileId },
      });

      if (!file) {
        throw new NotFoundException(
          `File with ID ${updateDto.fileId} not found`,
        );
      }
    }

    const material = await this.prisma.contentBlock.update({
      where: { id },
      data: {
        ...(updateDto.type && { type: updateDto.type }),
        ...(updateDto.content !== undefined && { content: updateDto.content }),
        ...(updateDto.order !== undefined && { order: updateDto.order }),
        ...(updateDto.fileId !== undefined && { fileId: updateDto.fileId }),
        updatedBy: updateDto.updatedBy,
      },
      include: {
        file: true,
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return material;
  }

  async bulkUpdateOrder(bulkUpdateDto: BulkUpdateOrderDto): Promise<void> {
    const { materials, updatedBy } = bulkUpdateDto;

    // Verify all materials exist
    const materialIds = materials.map((m) => m.id);
    const existingMaterials = await this.prisma.contentBlock.findMany({
      where: { id: { in: materialIds } },
      select: { id: true },
    });

    if (existingMaterials.length !== materialIds.length) {
      throw new BadRequestException('One or more materials not found');
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      materials.map((material) =>
        this.prisma.contentBlock.update({
          where: { id: material.id },
          data: {
            order: material.order,
            updatedBy,
          },
        }),
      ),
    );
  }

  async deleteMaterial(id: number): Promise<void> {
    // Verify material exists
    const material = await this.prisma.contentBlock.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    await this.prisma.contentBlock.delete({
      where: { id },
    });
  }

  async duplicateMaterial(
    id: number,
    createdBy: number,
  ): Promise<MaterialWithFile> {
    const originalMaterial = await this.getMaterialById(id);

    // Get next order for the same lesson
    const lastMaterial = await this.prisma.contentBlock.findFirst({
      where: { lessonId: originalMaterial.lessonId },
      orderBy: { order: 'desc' },
    });
    const newOrder = lastMaterial ? lastMaterial.order + 1 : 0;

    const duplicatedMaterial = await this.prisma.contentBlock.create({
      data: {
        type: originalMaterial.type,
        content: originalMaterial.content,
        order: newOrder,
        lessonId: originalMaterial.lessonId,
        fileId: originalMaterial.fileId,
        createdBy,
      },
      include: {
        file: true,
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return duplicatedMaterial;
  }

  async searchMaterials(
    query: string,
    courseId?: number,
  ): Promise<MaterialWithFile[]> {
    const whereClause: any = {
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (courseId) {
      whereClause.lesson = {
        topic: {
          courseId,
        },
      };
    }

    return this.prisma.contentBlock.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        file: true,
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
