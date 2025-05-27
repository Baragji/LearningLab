// apps/api/src/controllers/question-bank.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { QuestionImportService } from '../services/question-import.service';
import {
  QuestionBankDto,
  QuestionBankItemDto,
  CreateQuestionBankDto,
  CreateQuestionBankItemDto,
  UpdateQuestionBankDto,
  UpdateQuestionBankItemDto,
} from './dto/question-bank/question-bank.dto';

@ApiTags('Question Bank')
@Controller('question-bank')
export class QuestionBankController {
  constructor(
    private prisma: PrismaService,
    private questionImportService: QuestionImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all question banks' })
  @ApiResponse({
    status: 200,
    description: 'List of question banks',
    type: [QuestionBankDto],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
    type: String,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
    type: String,
  })
  async getAllQuestionBanks(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.questionBank.findMany({
      where,
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
          },
        },
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question bank by ID' })
  @ApiResponse({
    status: 200,
    description: 'The question bank',
    type: QuestionBankDto,
  })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  async getQuestionBank(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new question bank' })
  @ApiResponse({
    status: 201,
    description: 'The created question bank',
    type: QuestionBankDto,
  })
  async createQuestionBank(
    @Body() data: CreateQuestionBankDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    return this.prisma.questionBank.create({
      data: {
        ...data,
        createdBy: userId,
      },
      include: {
        questions: true,
      },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question bank' })
  @ApiResponse({
    status: 200,
    description: 'The updated question bank',
    type: QuestionBankDto,
  })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  async updateQuestionBank(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateQuestionBankDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    return this.prisma.questionBank.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        questions: true,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question bank' })
  @ApiResponse({ status: 204, description: 'Question bank deleted' })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  async deleteQuestionBank(@Param('id', ParseIntPipe) id: number) {
    // First delete all questions in the bank
    await this.prisma.questionBankItem.deleteMany({
      where: { questionBankId: id },
    });

    // Then delete the bank
    await this.prisma.questionBank.delete({
      where: { id },
    });

    return { success: true };
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions in a question bank' })
  @ApiResponse({
    status: 200,
    description: 'List of questions in the bank',
    type: [QuestionBankItemDto],
  })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by question type',
    type: String,
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: 'Filter by difficulty',
    type: String,
  })
  async getQuestionsInBank(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    const where: any = { questionBankId: id };

    if (type) {
      where.type = type;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    return this.prisma.questionBankItem.findMany({
      where,
    });
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a question to a question bank' })
  @ApiResponse({
    status: 201,
    description: 'The added question',
    type: QuestionBankItemDto,
  })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  async addQuestionToBank(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateQuestionBankItemDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    return this.prisma.questionBankItem.create({
      data: {
        ...data,
        questionBankId: id,
        createdBy: userId,
      },
    });
  }

  @Put(':bankId/questions/:questionId')
  @ApiOperation({ summary: 'Update a question in a question bank' })
  @ApiResponse({
    status: 200,
    description: 'The updated question',
    type: QuestionBankItemDto,
  })
  @ApiParam({ name: 'bankId', description: 'Question bank ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  async updateQuestionInBank(
    @Param('bankId', ParseIntPipe) bankId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() data: UpdateQuestionBankItemDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    return this.prisma.questionBankItem.update({
      where: {
        id: questionId,
        questionBankId: bankId,
      },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  @Delete(':bankId/questions/:questionId')
  @ApiOperation({ summary: 'Delete a question from a question bank' })
  @ApiResponse({ status: 204, description: 'Question deleted' })
  @ApiParam({ name: 'bankId', description: 'Question bank ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  async deleteQuestionFromBank(
    @Param('bankId', ParseIntPipe) bankId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    await this.prisma.questionBankItem.delete({
      where: {
        id: questionId,
        questionBankId: bankId,
      },
    });

    return { success: true };
  }

  @Post(':id/import')
  @ApiOperation({ summary: 'Import questions from a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV or Excel file containing questions',
    type: 'file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Questions imported successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  async importQuestions(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const fileType = this.getFileType(file.originalname);

    const questionIds =
      await this.questionImportService.importQuestionsFromBuffer(
        file.buffer,
        fileType,
        id,
        userId,
      );

    return {
      success: true,
      importedCount: questionIds.length,
      questionIds,
    };
  }

  @Post(':id/copy-to-quiz/:quizId')
  @ApiOperation({
    summary: 'Copy questions from a question bank to a quiz',
  })
  @ApiResponse({
    status: 201,
    description: 'Questions copied successfully',
  })
  @ApiParam({ name: 'id', description: 'Question bank ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  async copyQuestionsToQuiz(
    @Param('id', ParseIntPipe) bankId: number,
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body()
    data: {
      questionIds?: number[];
      count?: number;
      difficulty?: string;
      type?: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const createdQuestionIds: number[] = [];

    // Check if quiz exists
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    let bankQuestions;

    if (data.questionIds && data.questionIds.length > 0) {
      // Get specific questions from the bank
      bankQuestions = await this.prisma.questionBankItem.findMany({
        where: {
          questionBankId: bankId,
          id: { in: data.questionIds },
        },
      });
    } else {
      // Get random questions from the bank
      const where: any = { questionBankId: bankId };

      if (data.difficulty) {
        where.difficulty = data.difficulty;
      }

      if (data.type) {
        where.type = data.type;
      }

      bankQuestions = await this.prisma.questionBankItem.findMany({
        where,
        take: data.count || 10,
        orderBy: { id: 'asc' },
      });
    }

    // Copy questions to the quiz
    for (const bankQuestion of bankQuestions) {
      try {
        // Create the question
        const question = await this.prisma.question.create({
          data: {
            quizId,
            text: bankQuestion.text,
            type: bankQuestion.type,
            codeTemplate: bankQuestion.codeTemplate,
            codeLanguage: bankQuestion.codeLanguage,
            expectedOutput: bankQuestion.expectedOutput,
            essayMinWords: bankQuestion.essayMinWords,
            essayMaxWords: bankQuestion.essayMaxWords,
            dragDropItems: bankQuestion.dragDropItems,
            points: bankQuestion.points,
            createdBy: userId,
          },
        });

        createdQuestionIds.push(question.id);

        // If the question has answer options, create them too
        if (bankQuestion.answerOptions) {
          const answerOptions = bankQuestion.answerOptions;

          for (const option of answerOptions) {
            await this.prisma.answerOption.create({
              data: {
                questionId: question.id,
                text: option.text,
                isCorrect: option.isCorrect,
                createdBy: userId,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error copying question:', error);
      }
    }

    return {
      success: true,
      copiedCount: createdQuestionIds.length,
      questionIds: createdQuestionIds,
    };
  }

  /**
   * Determine file type from filename
   * @param filename Original filename
   * @returns File type ('csv' or 'excel')
   */
  private getFileType(filename: string): 'csv' | 'excel' {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return 'csv';
    } else if (['xlsx', 'xls'].includes(extension)) {
      return 'excel';
    }

    throw new Error(`Unsupported file type: ${extension}`);
  }
}
