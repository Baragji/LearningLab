// apps/api/src/search/search.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseEnumPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { Difficulty, CourseStatus, Role } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User as CoreUser } from '@repo/core';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({
    summary: 'Avanceret søgning på tværs af kurser, moduler og lektioner',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Søgetekst',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['course', 'module', 'lesson', 'all'],
    description: 'Type af indhold at søge i',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Tags at filtrere efter (kommasepareret)',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: Difficulty,
    description: 'Sværhedsgrad at filtrere efter',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CourseStatus,
    description: 'Status at filtrere efter',
  })
  @ApiQuery({
    name: 'subjectAreaId',
    required: false,
    type: Number,
    description: 'Fagområde ID at filtrere efter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Sidenummer (starter fra 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Antal resultater per side',
  })
  @ApiResponse({
    status: 200,
    description: 'Søgeresultater',
    schema: {
      type: 'object',
      properties: {
        courses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
              difficulty: {
                type: 'string',
                enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              },
              status: {
                type: 'string',
                enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
              },
              tags: { type: 'array', items: { type: 'string' } },
              image: { type: 'string', nullable: true },
              subjectArea: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              relevanceScore: { type: 'number' },
            },
          },
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              courseId: { type: 'number' },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              relevanceScore: { type: 'number' },
            },
          },
        },
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              moduleId: { type: 'number' },
              module: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  courseId: { type: 'number' },
                  course: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      title: { type: 'string' },
                      slug: { type: 'string' },
                    },
                  },
                },
              },
              relevanceScore: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async search(
    @Query('query') query?: string,
    @Query('type') type: 'course' | 'module' | 'lesson' | 'all' = 'all',
    @Query('tags') tags?: string,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('status') status?: CourseStatus,
    @Query('subjectAreaId', new DefaultValuePipe(0), ParseIntPipe)
    subjectAreaId?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @CurrentUser() currentUser?: Omit<CoreUser, 'passwordHash'>,
  ) {
    this.logger.log(
      `Udfører avanceret søgning: ${query}, type: ${type}, tags: ${tags}`,
    );

    // Konverter tags fra kommasepareret streng til array
    const tagArray = tags
      ? tags.split(',').map((tag) => tag.trim())
      : undefined;

    // Hvis brugeren ikke er admin eller lærer, vis kun publicerede kurser
    const allowedStatuses =
      currentUser &&
      (currentUser.role === Role.ADMIN || currentUser.role === Role.TEACHER)
        ? undefined
        : [CourseStatus.PUBLISHED];

    return this.searchService.search({
      query,
      type,
      tags: tagArray,
      difficulty,
      status: status || allowedStatuses,
      subjectAreaId: subjectAreaId || undefined,
      page,
      limit,
    });
  }
}
