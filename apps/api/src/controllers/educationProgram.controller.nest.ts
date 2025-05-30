// apps/api/src/controllers/educationProgram.controller.nest.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
  EducationProgramDto,
  CreateEducationProgramDto,
  UpdateEducationProgramDto,
  EducationProgramResponseDto,
  PaginatedEducationProgramResponseDto,
} from './dto/education-program/education-program.dto';
import { EducationProgramService } from './services/education-program.service';
import { PaginatedResult } from '../common/services/base.service';

// Udvid Express Request interface til at inkludere userId
interface RequestWithUser extends Request {
  userId?: number;
}

@ApiTags('Education Programs')
@Controller('education-programs')
export class EducationProgramController {
  constructor(private readonly educationProgramService: EducationProgramService) {}

  @ApiOperation({
    summary: 'Hent alle uddannelsesprogrammer med paginering, sortering og filtrering',
  })
  @ApiQuery({
    name: 'page',
    description: 'Sidenummer',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Antal resultater per side',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Felt der skal sorteres efter',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'order',
    description: 'Sorteringsretning (asc/desc)',
    enum: ['asc', 'desc'],
    required: false,
  })
  @ApiQuery({
    name: 'filter',
    description: 'JSON-streng med filtreringsparametre',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'includeCourses',
    description: 'Inkluder kurser i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Pagineret liste af uddannelsesprogrammer',
    type: PaginatedEducationProgramResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Fejl i filtreringsparametre',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get()
  async getAllEducationPrograms(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sort', new DefaultValuePipe('createdAt')) sort: string,
    @Query('order', new DefaultValuePipe('desc')) order: 'asc' | 'desc',
    @Query('filter') filterString?: string,
    @Query('includeCourses', new DefaultValuePipe(false), ParseBoolPipe)
    includeCourses?: boolean,
  ): Promise<PaginatedResult<EducationProgramDto>> {
    try {
      // Parse filter hvis det er angivet
      const filter = filterString ? JSON.parse(filterString) : {};

      // Opret include-objekt baseret på includeCourses
      const include = { courses: includeCourses };

      return await this.educationProgramService.findAllEducationPrograms({
        page,
        limit,
        sort,
        order,
        filter,
        include,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException(
          'Ugyldigt filter-format. Skal være gyldig JSON.',
        );
      }
      console.error('Fejl ved hentning af uddannelsesprogrammer:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af uddannelsesprogrammer',
      );
    }
  }

  @ApiOperation({ summary: 'Søg efter uddannelsesprogrammer' })
  @ApiQuery({
    name: 'term',
    description: 'Søgeterm',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Sidenummer',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Antal resultater per side',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'includeCourses',
    description: 'Inkluder kurser i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiQuery({
    name: 'tags',
    description: 'Filtrér efter tags (kommasepareret liste)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'categories',
    description: 'Filtrér efter kategorier (kommasepareret liste)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'difficulty',
    description:
      'Filtrér efter sværhedsgrad (BEGINNER, INTERMEDIATE, ADVANCED)',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Pagineret liste af uddannelsesprogrammer der matcher søgningen',
    type: PaginatedEducationProgramResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ugyldig anmodning' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('search')
  async searchEducationPrograms(
    @Query('term') searchTerm: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('includeCourses', new DefaultValuePipe(false), ParseBoolPipe)
    includeCourses?: boolean,
    @Query('tags') tags?: string,
    @Query('categories') categories?: string,
    @Query('difficulty') difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  ): Promise<PaginatedResult<EducationProgramDto>> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        throw new BadRequestException('Søgeterm er påkrævet');
      }

      // Opret include-objekt baseret på includeCourses
      const include = { courses: includeCourses };

      // Opret filter-objekt baseret på tags, kategorier og sværhedsgrad
      const filters: Record<string, any> = {};

      if (tags) {
        filters.tags = tags.split(',').map((tag) => tag.trim());
      }

      if (categories) {
        filters.categories = categories
          .split(',')
          .map((category) => category.trim());
      }

      if (difficulty) {
        filters.difficulty = difficulty;
      }

      return await this.educationProgramService.searchEducationPrograms(searchTerm, {
        page,
        limit,
        include,
        filters,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Fejl ved søgning efter uddannelsesprogrammer:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved søgning efter uddannelsesprogrammer',
      );
    }
  }

  @ApiOperation({
    summary: 'Fuld-tekst søgning på tværs af kurser, emner og lektioner',
  })
  @ApiQuery({
    name: 'term',
    description: 'Søgeterm',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Sidenummer',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Antal resultater per side',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'tags',
    description: 'Filtrér efter tags (kommasepareret liste)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'categories',
    description: 'Filtrér efter kategorier (kommasepareret liste)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'difficulty',
    description:
      'Filtrér efter sværhedsgrad (BEGINNER, INTERMEDIATE, ADVANCED)',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    required: false,
  })
  @ApiQuery({
    name: 'contentTypes',
    description: 'Filtrér efter indholdstyper (kommasepareret liste: course, topic, lesson)',
    type: String,
    required: false,
    isArray: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Pagineret liste af søgeresultater på tværs af indholdstyper',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Ugyldig anmodning' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('full-text-search')
  async fullTextSearch(
    @Query('term') searchTerm: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tags') tags?: string,
    @Query('categories') categories?: string,
    @Query('difficulty') difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    @Query('contentTypes') contentTypes?: string,
  ): Promise<any> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        throw new BadRequestException('Søgeterm er påkrævet');
      }

      // Opret filter-objekt baseret på tags, kategorier og sværhedsgrad
      const filters: Record<string, any> = {};

      if (tags) {
        filters.tags = tags.split(',').map((tag) => tag.trim());
      }

      if (categories) {
        filters.categories = categories
          .split(',')
          .map((category) => category.trim());
      }

      if (difficulty) {
        filters.difficulty = difficulty;
      }

      // Bestem hvilke indholdstyper der skal søges i
      let searchContentTypes: string[] = ['course', 'topic', 'lesson'];
      if (contentTypes && contentTypes.length > 0) {
        searchContentTypes = Array.isArray(contentTypes) ? contentTypes : [contentTypes];
      }

      return await this.educationProgramService.fullTextSearch(searchTerm, {
        page,
        limit,
        filters,
        contentTypes: searchContentTypes,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Fejl ved fuld-tekst søgning:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved fuld-tekst søgning',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt uddannelsesprogram ud fra ID' })
  @ApiParam({ name: 'id', description: 'Uddannelsesprogram ID', type: Number })
  @ApiQuery({
    name: 'includeCourses',
    description: 'Inkluder kurser i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Det angivne uddannelsesprogram',
    type: EducationProgramDto,
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getEducationProgramById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeCourses', new DefaultValuePipe(false), ParseBoolPipe)
    includeCourses?: boolean,
  ): Promise<EducationProgramDto> {
    try {
      // Opret include-objekt baseret på includeCourses
      const include = { courses: includeCourses };

      return await this.educationProgramService.findById(id, include);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af uddannelsesprogram med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af uddannelsesprogrammet',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt uddannelsesprogram ud fra slug' })
  @ApiParam({ name: 'slug', description: 'Uddannelsesprogram slug', type: String })
  @ApiQuery({
    name: 'includeCourses',
    description: 'Inkluder kurser i resultatet',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Det angivne uddannelsesprogram',
    type: EducationProgramDto,
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('slug/:slug')
  async getEducationProgramBySlug(
    @Param('slug') slug: string,
    @Query('includeCourses', new DefaultValuePipe(false), ParseBoolPipe)
    includeCourses?: boolean,
  ): Promise<EducationProgramDto> {
    try {
      const educationProgram = await this.educationProgramService.findBySlug(
        slug,
        includeCourses,
      );

      if (!educationProgram) {
        throw new NotFoundException('Uddannelsesprogrammet blev ikke fundet');
      }

      return educationProgram;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af uddannelsesprogram med slug ${slug}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af uddannelsesprogrammet',
      );
    }
  }

  @ApiOperation({ summary: 'Opret et nyt uddannelsesprogram' })
  @ApiBody({ type: CreateEducationProgramDto })
  @ApiResponse({
    status: 201,
    description: 'Uddannelsesprogrammet blev oprettet',
    type: EducationProgramDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Validering fejlede',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Et uddannelsesprogram med dette slug eksisterer allerede',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan oprette uddannelsesprogrammer',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEducationProgram(
    @Body() createEducationProgramDto: CreateEducationProgramDto,
    @Request() req: RequestWithUser,
  ): Promise<EducationProgramDto> {
    try {
      return await this.educationProgramService.createEducationProgram(
        createEducationProgramDto,
        req.userId,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af uddannelsesprogram:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af uddannelsesprogrammet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater et eksisterende uddannelsesprogram' })
  @ApiParam({ name: 'id', description: 'Uddannelsesprogram ID', type: Number })
  @ApiBody({ type: UpdateEducationProgramDto })
  @ApiResponse({
    status: 200,
    description: 'Uddannelsesprogrammet blev opdateret',
    type: EducationProgramDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ugyldig anmodning - Validering fejlede eller slug er allerede i brug',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan opdatere uddannelsesprogrammer',
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async updateEducationProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEducationProgramDto: UpdateEducationProgramDto,
    @Request() req: RequestWithUser,
  ): Promise<EducationProgramDto> {
    try {
      return await this.educationProgramService.updateEducationProgram(
        id,
        updateEducationProgramDto,
        req.userId,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error(`Fejl ved opdatering af uddannelsesprogram med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af uddannelsesprogrammet',
      );
    }
  }

  @ApiOperation({ summary: 'Slet et uddannelsesprogram (soft delete)' })
  @ApiParam({ name: 'id', description: 'Uddannelsesprogram ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Uddannelsesprogrammet blev slettet',
    type: EducationProgramResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ugyldig anmodning - Uddannelsesprogrammet kan ikke slettes, da der er kurser tilknyttet',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan slette uddannelsesprogrammer',
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteEducationProgram(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<EducationProgramResponseDto> {
    try {
      await this.educationProgramService.deleteEducationProgram(id, req.userId);
      return { message: 'Uddannelsesprogrammet blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af uddannelsesprogram med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af uddannelsesprogrammet',
      );
    }
  }

  @ApiOperation({ summary: 'Genopret et slettet uddannelsesprogram' })
  @ApiParam({ name: 'id', description: 'Uddannelsesprogram ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Uddannelsesprogrammet blev genoprettet',
    type: EducationProgramDto,
  })
  @ApiResponse({ status: 400, description: 'Uddannelsesprogrammet er ikke slettet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan genoprette uddannelsesprogrammer',
  })
  @ApiResponse({ status: 404, description: 'Uddannelsesprogrammet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/restore')
  async restoreEducationProgram(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<EducationProgramDto> {
    try {
      return await this.educationProgramService.restore(id, req.userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved genopretning af uddannelsesprogram med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved genopretning af uddannelsesprogrammet',
      );
    }
  }
}
