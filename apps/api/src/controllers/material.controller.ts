import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../middleware/auth.middleware';
import {
  MaterialService,
  CreateMaterialDto,
  UpdateMaterialDto,
  BulkUpdateOrderDto
} from '../services/material.service';
import { ContentBlockType } from '@prisma/client';

export interface CreateMaterialRequestDto {
  type: ContentBlockType;
  content?: string;
  order?: number;
  lessonId: number;
  fileId?: number;
}

export interface UpdateMaterialRequestDto {
  type?: ContentBlockType;
  content?: string;
  order?: number;
  fileId?: number;
}

export interface BulkUpdateOrderRequestDto {
  materials: Array<{
    id: number;
    order: number;
  }>;
}

@ApiTags('materials')
@Controller('materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new material' })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async createMaterial(
    @Body() createDto: CreateMaterialRequestDto,
    @Request() req: any
  ) {
    const material = await this.materialService.createMaterial({
      ...createDto,
      createdBy: req.user.id
    });

    return {
      message: 'Material created successfully',
      material: {
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        lesson: material.lesson ? {
          id: material.lesson.id,
          title: material.lesson.title,
          topic: material.lesson.topic ? {
            id: material.lesson.topic.id,
            title: material.lesson.topic.title,
            course: material.lesson.topic.course ? {
              id: material.lesson.topic.course.id,
              title: material.lesson.topic.course.title
            } : null
          } : null
        } : null,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiResponse({ status: 200, description: 'Material retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async getMaterial(@Param('id', ParseIntPipe) id: number) {
    const material = await this.materialService.getMaterialById(id);

    return {
      id: material.id,
      type: material.type,
      content: material.content,
      order: material.order,
      lessonId: material.lessonId,
      file: material.file ? {
        id: material.file.id,
        filename: material.file.filename,
        originalName: material.file.originalName,
        mimeType: material.file.mimeType,
        size: material.file.size,
        url: material.file.url
      } : null,
      lesson: material.lesson ? {
        id: material.lesson.id,
        title: material.lesson.title,
        topic: material.lesson.topic ? {
          id: material.lesson.topic.id,
          title: material.lesson.topic.title,
          course: material.lesson.topic.course ? {
            id: material.lesson.topic.course.id,
            title: material.lesson.topic.course.title
          } : null
        } : null
      } : null,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    };
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get materials by lesson ID' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getMaterialsByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    const materials = await this.materialService.getMaterialsByLesson(lessonId);

    return {
      materials: materials.map(material => ({
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }))
    };
  }

  @Get('topic/:topicId')
  @ApiOperation({ summary: 'Get materials by topic ID' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async getMaterialsByTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    const materials = await this.materialService.getMaterialsByTopic(topicId);

    return {
      materials: materials.map(material => ({
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        lesson: material.lesson ? {
          id: material.lesson.id,
          title: material.lesson.title,
          order: material.lesson.order
        } : null,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }))
    };
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get materials by course ID' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getMaterialsByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    const materials = await this.materialService.getMaterialsByCourse(courseId);

    return {
      materials: materials.map(material => ({
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        lesson: material.lesson ? {
          id: material.lesson.id,
          title: material.lesson.title,
          topic: material.lesson.topic ? {
            id: material.lesson.topic.id,
            title: material.lesson.topic.title,
            order: material.lesson.topic.order
          } : null
        } : null,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }))
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update material by ID' })
  @ApiResponse({ status: 200, description: 'Material updated successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMaterialRequestDto,
    @Request() req: any
  ) {
    const material = await this.materialService.updateMaterial(id, {
      ...updateDto,
      updatedBy: req.user.id
    });

    return {
      message: 'Material updated successfully',
      material: {
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        updatedAt: material.updatedAt
      }
    };
  }

  @Put('bulk/order')
  @ApiOperation({ summary: 'Bulk update material order' })
  @ApiResponse({ status: 200, description: 'Material order updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkUpdateOrder(
    @Body() bulkUpdateDto: BulkUpdateOrderRequestDto,
    @Request() req: any
  ) {
    if (!bulkUpdateDto.materials || bulkUpdateDto.materials.length === 0) {
      throw new BadRequestException('Materials array is required and cannot be empty');
    }

    await this.materialService.bulkUpdateOrder({
      materials: bulkUpdateDto.materials,
      updatedBy: req.user.id
    });

    return {
      message: 'Material order updated successfully'
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate material by ID' })
  @ApiResponse({ status: 201, description: 'Material duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async duplicateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    const material = await this.materialService.duplicateMaterial(id, req.user.id);

    return {
      message: 'Material duplicated successfully',
      material: {
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        createdAt: material.createdAt
      }
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete material by ID' })
  @ApiResponse({ status: 200, description: 'Material deleted successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.materialService.deleteMaterial(id);
    return {
      message: 'Material deleted successfully'
    };
  }

  @Get()
  @ApiOperation({ summary: 'Search materials' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully' })
  async searchMaterials(
    @Query('q') query: string,
    @Query('courseId') courseId?: string
  ) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const courseIdNum = courseId ? parseInt(courseId, 10) : undefined;
    if (courseId && isNaN(courseIdNum!)) {
      throw new BadRequestException('Invalid course ID');
    }

    const materials = await this.materialService.searchMaterials(query, courseIdNum);

    return {
      materials: materials.map(material => ({
        id: material.id,
        type: material.type,
        content: material.content,
        order: material.order,
        lessonId: material.lessonId,
        file: material.file ? {
          id: material.file.id,
          filename: material.file.filename,
          originalName: material.file.originalName,
          mimeType: material.file.mimeType,
          size: material.file.size,
          url: material.file.url
        } : null,
        lesson: material.lesson ? {
          id: material.lesson.id,
          title: material.lesson.title,
          topic: material.lesson.topic ? {
            id: material.lesson.topic.id,
            title: material.lesson.topic.title,
            course: material.lesson.topic.course ? {
              id: material.lesson.topic.course.id,
              title: material.lesson.topic.course.title
            } : null
          } : null
        } : null,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }))
    };
  }
}