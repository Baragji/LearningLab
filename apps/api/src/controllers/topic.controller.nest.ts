// apps/api/src/controllers/topic.controller.nest.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/core';
import {
  TopicDto,
  CreateTopicDto,
  UpdateTopicDto,
  UpdateTopicsOrderDto,
} from './dto/topic/topic.dto';
import { TopicService } from './services/topic.service';

// Udvid Express Request interface til at inkludere userId
interface RequestWithUser extends Request {
  userId?: number;
}

@ApiTags('Topics')
@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @ApiOperation({ summary: 'Hent alle topics for et specifikt kursus' })
  @ApiParam({ name: 'courseId', description: 'ID for kurset', type: Number })
  @ApiQuery({
    name: 'includeLessons',
    description: 'Inkluder lektioner i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiQuery({
    name: 'includeQuizzes',
    description: 'Inkluder quizzer i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af topics for det angivne kursus',
    type: [TopicDto],
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('course/:courseId')
  async getTopicsByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('includeLessons', new DefaultValuePipe(false), ParseBoolPipe)
    includeLessons?: boolean,
    @Query('includeQuizzes', new DefaultValuePipe(false), ParseBoolPipe)
    includeQuizzes?: boolean,
  ): Promise<TopicDto[]> {
    try {
      const include = {
        lessons: includeLessons,
        quizzes: includeQuizzes,
      };

      const result = await this.topicService.findTopicsByCourse(courseId, { include });
      return result.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Fejl ved hentning af topics for kursus ${courseId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af topics',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt topic ud fra ID' })
  @ApiParam({ name: 'id', description: 'Topic ID', type: Number })
  @ApiQuery({
    name: 'includeRelations',
    description: 'Inkluder relationer i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Det angivne topic',
    type: TopicDto,
  })
  @ApiResponse({ status: 404, description: 'Topicet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getTopicById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations', new DefaultValuePipe(false), ParseBoolPipe)
    includeRelations?: boolean,
  ): Promise<TopicDto> {
    try {
      return await this.topicService.findTopicById(id, includeRelations);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af topic med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af topicet',
      );
    }
  }

  @ApiOperation({ summary: 'Opret et nyt topic' })
  @ApiBody({ type: CreateTopicDto })
  @ApiResponse({
    status: 201,
    description: 'Topicet blev oprettet',
    type: TopicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 403, description: 'Forbudt - Manglende rettigheder' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @Request() req: RequestWithUser,
  ): Promise<TopicDto> {
    try {
      return await this.topicService.createTopic(createTopicDto, req.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af topic:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af topicet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater et eksisterende topic' })
  @ApiParam({ name: 'id', description: 'Topic ID', type: Number })
  @ApiBody({ type: UpdateTopicDto })
  @ApiResponse({
    status: 200,
    description: 'Topicet blev opdateret',
    type: TopicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Topicet eller kurset blev ikke fundet',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 403, description: 'Forbudt - Manglende rettigheder' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Put(':id')
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
    @Request() req: RequestWithUser,
  ): Promise<TopicDto> {
    try {
      return await this.topicService.updateTopic(id, updateTopicDto, req.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af topic med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af topicet',
      );
    }
  }

  @ApiOperation({ summary: 'Slet et topic' })
  @ApiParam({ name: 'id', description: 'Topic ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Topicet blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Topicet kan ikke slettes, da der er lektioner eller quizzer tilknyttet',
  })
  @ApiResponse({ status: 404, description: 'Topicet blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 403, description: 'Forbudt - Manglende rettigheder' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  async deleteTopic(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    try {
      await this.topicService.deleteTopic(id, req.userId);
      return { message: 'Topicet blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af topic med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af topicet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater rækkefølgen af topics i et kursus' })
  @ApiParam({ name: 'courseId', description: 'ID for kurset', type: Number })
  @ApiBody({ type: UpdateTopicsOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Rækkefølgen af topics blev opdateret',
    type: [TopicDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Kurset blev ikke fundet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({ status: 403, description: 'Forbudt - Manglende rettigheder' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Put('update-order/:courseId')
  async updateTopicsOrder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() updateTopicsOrderDto: UpdateTopicsOrderDto,
    @Request() req: RequestWithUser,
  ): Promise<TopicDto[]> {
    try {
      return await this.topicService.updateTopicsOrder(
        courseId,
        updateTopicsOrderDto.topicIds,
        req.userId,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved opdatering af topics i kursus ${courseId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af topics',
      );
    }
  }
}
