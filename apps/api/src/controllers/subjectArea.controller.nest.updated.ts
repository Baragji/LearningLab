// apps/api/src/controllers/subjectArea.controller.nest.ts
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  SubjectAreaDto,
  CreateSubjectAreaDto,
  UpdateSubjectAreaDto,
  SubjectAreaResponseDto,
} from './dto/subject-area/subject-area.dto';
import { SubjectAreaService } from './services/subject-area.service';

// Udvid Express Request interface til at inkludere userId
interface RequestWithUser extends Request {
  userId?: number;
}

@ApiTags('Subject Areas')
@Controller('subject-areas')
export class SubjectAreaController {
  constructor(private readonly subjectAreaService: SubjectAreaService) {}

  @ApiOperation({ summary: 'Hent alle fagområder' })
  @ApiResponse({
    status: 200,
    description: 'Liste af alle fagområder',
    type: [SubjectAreaDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get()
  async getAllSubjectAreas(): Promise<SubjectAreaDto[]> {
    try {
      return await this.subjectAreaService.findAll();
    } catch (error) {
      console.error('Fejl ved hentning af fagområder:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fagområder',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt fagområde ud fra ID' })
  @ApiParam({ name: 'id', description: 'Fagområde ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Det angivne fagområde',
    type: SubjectAreaDto,
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getSubjectAreaById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubjectAreaDto> {
    try {
      return await this.subjectAreaService.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af fagområde med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fagområdet',
      );
    }
  }

  @ApiOperation({ summary: 'Hent et specifikt fagområde ud fra slug' })
  @ApiParam({ name: 'slug', description: 'Fagområde slug', type: String })
  @ApiResponse({
    status: 200,
    description: 'Det angivne fagområde',
    type: SubjectAreaDto,
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('slug/:slug')
  async getSubjectAreaBySlug(
    @Param('slug') slug: string,
  ): Promise<SubjectAreaDto> {
    try {
      const subjectArea = await this.subjectAreaService.findBySlug(slug);

      if (!subjectArea) {
        throw new NotFoundException('Fagområdet blev ikke fundet');
      }

      return subjectArea;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af fagområde med slug ${slug}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af fagområdet',
      );
    }
  }

  @ApiOperation({ summary: 'Opret et nyt fagområde' })
  @ApiBody({ type: CreateSubjectAreaDto })
  @ApiResponse({
    status: 201,
    description: 'Fagområdet blev oprettet',
    type: SubjectAreaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Validering fejlede',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Et fagområde med dette slug eksisterer allerede',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan oprette fagområder',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSubjectArea(
    @Body() createSubjectAreaDto: CreateSubjectAreaDto,
    @Request() req: RequestWithUser,
  ): Promise<SubjectAreaDto> {
    try {
      return await this.subjectAreaService.createSubjectArea(
        createSubjectAreaDto,
        req.userId,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af fagområde:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af fagområdet',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater et eksisterende fagområde' })
  @ApiParam({ name: 'id', description: 'Fagområde ID', type: Number })
  @ApiBody({ type: UpdateSubjectAreaDto })
  @ApiResponse({
    status: 200,
    description: 'Fagområdet blev opdateret',
    type: SubjectAreaDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ugyldig anmodning - Validering fejlede eller slug er allerede i brug',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan opdatere fagområder',
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async updateSubjectArea(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectAreaDto: UpdateSubjectAreaDto,
    @Request() req: RequestWithUser,
  ): Promise<SubjectAreaDto> {
    try {
      return await this.subjectAreaService.updateSubjectArea(
        id,
        updateSubjectAreaDto,
        req.userId,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error(`Fejl ved opdatering af fagområde med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af fagområdet',
      );
    }
  }

  @ApiOperation({ summary: 'Slet et fagområde (soft delete)' })
  @ApiParam({ name: 'id', description: 'Fagområde ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Fagområdet blev slettet',
    type: SubjectAreaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Ugyldig anmodning - Fagområdet kan ikke slettes, da der er kurser tilknyttet',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan slette fagområder',
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteSubjectArea(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<SubjectAreaResponseDto> {
    try {
      await this.subjectAreaService.deleteSubjectArea(id, req.userId);
      return { message: 'Fagområdet blev slettet' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved sletning af fagområde med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af fagområdet',
      );
    }
  }

  @ApiOperation({ summary: 'Genopret et slettet fagområde' })
  @ApiParam({ name: 'id', description: 'Fagområde ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Fagområdet blev genoprettet',
    type: SubjectAreaDto,
  })
  @ApiResponse({ status: 400, description: 'Fagområdet er ikke slettet' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret' })
  @ApiResponse({
    status: 403,
    description: 'Forbudt - Kun admin kan genoprette fagområder',
  })
  @ApiResponse({ status: 404, description: 'Fagområdet blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/restore')
  async restoreSubjectArea(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<SubjectAreaDto> {
    try {
      return await this.subjectAreaService.restore(id, req.userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(`Fejl ved genopretning af fagområde med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved genopretning af fagområdet',
      );
    }
  }
}