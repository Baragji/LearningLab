// apps/api/src/controllers/contentBlock.controller.nest.ts
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
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ContentBlockType } from '@prisma/client';
import {
  ContentBlockDto,
  CreateContentBlockDto,
  UpdateContentBlockDto,
  UpdateContentBlocksOrderDto,
} from './dto/contentBlock/contentBlock.dto';

@ApiTags('Content')
@Controller('content-blocks')
export class ContentBlockController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Hent alle indholdsblokke for en specifik lektion' })
  @ApiParam({ name: 'lessonId', description: 'ID for lektionen', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste af indholdsblokke for den angivne lektion',
    type: [ContentBlockDto],
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get('lesson/:lessonId')
  async getContentBlocksByLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<ContentBlockDto[]> {
    try {
      return await this.prisma.contentBlock.findMany({
        where: { lessonId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error(
        `Fejl ved hentning af indholdsblokke for lektion ${lessonId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af indholdsblokke',
      );
    }
  }

  @ApiOperation({ summary: 'Hent en specifik indholdsblok ud fra ID' })
  @ApiParam({ name: 'id', description: 'Indholdsblok ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Den angivne indholdsblok',
    type: ContentBlockDto,
  })
  @ApiResponse({ status: 404, description: 'Indholdsblokken blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @Get(':id')
  async getContentBlockById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ContentBlockDto> {
    try {
      const contentBlock = await this.prisma.contentBlock.findUnique({
        where: { id },
        include: {
          lesson: true,
        },
      });

      if (!contentBlock) {
        throw new NotFoundException('Indholdsblokken blev ikke fundet');
      }

      return contentBlock;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved hentning af indholdsblok med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved hentning af indholdsblokken',
      );
    }
  }

  @ApiOperation({ summary: 'Opret en ny indholdsblok' })
  @ApiBody({ type: CreateContentBlockDto })
  @ApiResponse({
    status: 201,
    description: 'Indholdsblokken blev oprettet',
    type: ContentBlockDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContentBlock(
    @Body() createContentBlockDto: CreateContentBlockDto,
  ): Promise<ContentBlockDto> {
    const { type, content, order, lessonId } = createContentBlockDto;

    try {
      // Tjek om lektionen eksisterer
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException('Den angivne lektion findes ikke');
      }

      // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter den sidste indholdsblok
      let blockOrder = order;
      if (blockOrder === undefined) {
        const lastBlock = await this.prisma.contentBlock.findFirst({
          where: { lessonId },
          orderBy: { order: 'desc' },
        });

        blockOrder = lastBlock ? lastBlock.order + 1 : 1;
      }

      return await this.prisma.contentBlock.create({
        data: {
          type,
          content,
          order: blockOrder,
          lessonId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Fejl ved oprettelse af indholdsblok:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved oprettelse af indholdsblokken',
      );
    }
  }

  @ApiOperation({ summary: 'Opdater en eksisterende indholdsblok' })
  @ApiParam({ name: 'id', description: 'Indholdsblok ID', type: Number })
  @ApiBody({ type: UpdateContentBlockDto })
  @ApiResponse({
    status: 200,
    description: 'Indholdsblokken blev opdateret',
    type: ContentBlockDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Indholdsblokken eller lektionen blev ikke fundet',
  })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateContentBlock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentBlockDto: UpdateContentBlockDto,
  ): Promise<ContentBlockDto> {
    const { type, content, order, lessonId } = updateContentBlockDto;

    try {
      // Tjek om indholdsblokken eksisterer
      const existingContentBlock = await this.prisma.contentBlock.findUnique({
        where: { id },
      });

      if (!existingContentBlock) {
        throw new NotFoundException('Indholdsblokken blev ikke fundet');
      }

      // Hvis lessonId ændres, tjek om den nye lektion eksisterer
      if (lessonId && lessonId !== existingContentBlock.lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: lessonId },
        });

        if (!lesson) {
          throw new NotFoundException('Den angivne lektion findes ikke');
        }
      }

      return await this.prisma.contentBlock.update({
        where: { id },
        data: {
          type: type !== undefined ? type : existingContentBlock.type,
          content: content || existingContentBlock.content,
          order: order !== undefined ? order : existingContentBlock.order,
          lessonId: lessonId || existingContentBlock.lessonId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved opdatering af indholdsblok med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af indholdsblokken',
      );
    }
  }

  @ApiOperation({
    summary: 'Opdater rækkefølgen af indholdsblokke i en lektion',
  })
  @ApiParam({ name: 'lessonId', description: 'ID for lektionen', type: Number })
  @ApiBody({ type: UpdateContentBlocksOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Indholdsblokrækkefølgen blev opdateret',
    type: [ContentBlockDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({ status: 404, description: 'Lektionen blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('lesson/:lessonId/order')
  async updateContentBlocksOrder(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() updateContentBlocksOrderDto: UpdateContentBlocksOrderDto,
  ): Promise<ContentBlockDto[]> {
    const { contentBlockIds } = updateContentBlocksOrderDto;

    if (!Array.isArray(contentBlockIds)) {
      throw new BadRequestException(
        "contentBlockIds skal være et array af indholdsblok-ID'er",
      );
    }

    try {
      // Tjek om lektionen eksisterer
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { contentBlocks: true },
      });

      if (!lesson) {
        throw new NotFoundException('Lektionen blev ikke fundet');
      }

      // Tjek om alle indholdsblokke tilhører lektionen
      const lessonContentBlockIds = lesson.contentBlocks.map(
        (block) => block.id,
      );
      const allBlocksExist = contentBlockIds.every((id) =>
        lessonContentBlockIds.includes(Number(id)),
      );

      if (!allBlocksExist) {
        throw new BadRequestException(
          'En eller flere indholdsblokke tilhører ikke den angivne lektion',
        );
      }

      // Opdater rækkefølgen af indholdsblokke
      const updates = contentBlockIds.map((blockId, index) => {
        return this.prisma.contentBlock.update({
          where: { id: Number(blockId) },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return await this.prisma.contentBlock.findMany({
        where: { lessonId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error(
        `Fejl ved opdatering af indholdsblokrækkefølge for lektion ${lessonId}:`,
        error,
      );
      throw new BadRequestException(
        'Der opstod en fejl ved opdatering af indholdsblokrækkefølgen',
      );
    }
  }

  @ApiOperation({ summary: 'Slet en indholdsblok' })
  @ApiParam({ name: 'id', description: 'Indholdsblok ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Indholdsblokken blev slettet',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Indholdsblokken blev ikke fundet' })
  @ApiResponse({ status: 500, description: 'Serverfejl' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteContentBlock(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      // Tjek om indholdsblokken eksisterer
      const existingContentBlock = await this.prisma.contentBlock.findUnique({
        where: { id },
      });

      if (!existingContentBlock) {
        throw new NotFoundException('Indholdsblokken blev ikke fundet');
      }

      await this.prisma.contentBlock.delete({
        where: { id },
      });

      // Opdater rækkefølgen af de resterende indholdsblokke
      const remainingBlocks = await this.prisma.contentBlock.findMany({
        where: { lessonId: existingContentBlock.lessonId },
        orderBy: { order: 'asc' },
      });

      const updates = remainingBlocks.map((block, index) => {
        return this.prisma.contentBlock.update({
          where: { id: block.id },
          data: { order: index + 1 },
        });
      });

      await this.prisma.$transaction(updates);

      return { message: 'Indholdsblokken blev slettet' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Fejl ved sletning af indholdsblok med id ${id}:`, error);
      throw new BadRequestException(
        'Der opstod en fejl ved sletning af indholdsblokken',
      );
    }
  }
}
