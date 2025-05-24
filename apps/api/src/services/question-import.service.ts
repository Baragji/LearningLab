// apps/api/src/services/question-import.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { QuestionType, Difficulty } from '@prisma/client';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

interface ImportedQuestion {
  text: string;
  type: string;
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  dragDropItems?: any;
  points?: number;
  difficulty?: string;
  answerOptions?: any;
}

@Injectable()
export class QuestionImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Import questions from a CSV file
   * @param filePath Path to the CSV file
   * @param questionBankId ID of the question bank to import to
   * @param userId ID of the user performing the import
   * @returns Array of created question IDs
   */
  async importQuestionsFromCsv(
    filePath: string,
    questionBankId: number,
    userId: number,
  ): Promise<number[]> {
    const questions: ImportedQuestion[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          try {
            const question = this.parseQuestionFromCsvRow(data);
            questions.push(question);
          } catch (error) {
            console.error('Error parsing CSV row:', error);
          }
        })
        .on('end', async () => {
          try {
            const createdQuestionIds = await this.createQuestionsInBank(
              questions,
              questionBankId,
              userId,
            );
            resolve(createdQuestionIds);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Import questions from an Excel file
   * @param filePath Path to the Excel file
   * @param questionBankId ID of the question bank to import to
   * @param userId ID of the user performing the import
   * @returns Array of created question IDs
   */
  async importQuestionsFromExcel(
    filePath: string,
    questionBankId: number,
    userId: number,
  ): Promise<number[]> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const questions: ImportedQuestion[] = data.map((row: any) => {
      return this.parseQuestionFromExcelRow(row);
    });

    return this.createQuestionsInBank(questions, questionBankId, userId);
  }

  /**
   * Import questions from a buffer (for handling file uploads)
   * @param buffer File buffer
   * @param fileType File type ('csv' or 'excel')
   * @param questionBankId ID of the question bank to import to
   * @param userId ID of the user performing the import
   * @returns Array of created question IDs
   */
  async importQuestionsFromBuffer(
    buffer: Buffer,
    fileType: 'csv' | 'excel',
    questionBankId: number,
    userId: number,
  ): Promise<number[]> {
    if (fileType === 'csv') {
      const questions: ImportedQuestion[] = [];

      return new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        stream
          .pipe(csv())
          .on('data', (data) => {
            try {
              const question = this.parseQuestionFromCsvRow(data);
              questions.push(question);
            } catch (error) {
              console.error('Error parsing CSV row:', error);
            }
          })
          .on('end', async () => {
            try {
              const createdQuestionIds = await this.createQuestionsInBank(
                questions,
                questionBankId,
                userId,
              );
              resolve(createdQuestionIds);
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } else if (fileType === 'excel') {
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const questions: ImportedQuestion[] = data.map((row: any) => {
        return this.parseQuestionFromExcelRow(row);
      });

      return this.createQuestionsInBank(questions, questionBankId, userId);
    } else {
      throw new Error('Unsupported file type');
    }
  }

  /**
   * Parse a question from a CSV row
   * @param row CSV row data
   * @returns Parsed question object
   */
  private parseQuestionFromCsvRow(row: any): ImportedQuestion {
    const question: ImportedQuestion = {
      text: row.text,
      type: this.validateQuestionType(row.type),
    };

    // Add optional fields based on question type
    if (row.codeTemplate && question.type === 'CODE') {
      question.codeTemplate = row.codeTemplate;
      question.codeLanguage = row.codeLanguage;
      question.expectedOutput = row.expectedOutput;
    }

    if (row.essayMinWords && question.type === 'ESSAY') {
      question.essayMinWords = parseInt(row.essayMinWords, 10);
      question.essayMaxWords = parseInt(row.essayMaxWords, 10);
    }

    if (row.dragDropItems && question.type === 'DRAG_AND_DROP') {
      try {
        question.dragDropItems = JSON.parse(row.dragDropItems);
      } catch (error) {
        console.error('Error parsing dragDropItems JSON:', error);
      }
    }

    if (row.points) {
      question.points = parseInt(row.points, 10);
    }

    if (row.difficulty) {
      question.difficulty = this.validateDifficulty(row.difficulty);
    }

    if (row.answerOptions) {
      try {
        question.answerOptions = JSON.parse(row.answerOptions);
      } catch (error) {
        console.error('Error parsing answerOptions JSON:', error);
      }
    }

    return question;
  }

  /**
   * Parse a question from an Excel row
   * @param row Excel row data
   * @returns Parsed question object
   */
  private parseQuestionFromExcelRow(row: any): ImportedQuestion {
    const question: ImportedQuestion = {
      text: row.text,
      type: this.validateQuestionType(row.type),
    };

    // Add optional fields based on question type
    if (row.codeTemplate && question.type === 'CODE') {
      question.codeTemplate = row.codeTemplate;
      question.codeLanguage = row.codeLanguage;
      question.expectedOutput = row.expectedOutput;
    }

    if (row.essayMinWords && question.type === 'ESSAY') {
      question.essayMinWords = parseInt(row.essayMinWords, 10);
      question.essayMaxWords = parseInt(row.essayMaxWords, 10);
    }

    if (row.dragDropItems && question.type === 'DRAG_AND_DROP') {
      if (typeof row.dragDropItems === 'string') {
        try {
          question.dragDropItems = JSON.parse(row.dragDropItems);
        } catch (error) {
          console.error('Error parsing dragDropItems JSON:', error);
        }
      } else {
        question.dragDropItems = row.dragDropItems;
      }
    }

    if (row.points) {
      question.points = parseInt(row.points, 10);
    }

    if (row.difficulty) {
      question.difficulty = this.validateDifficulty(row.difficulty);
    }

    if (row.answerOptions) {
      if (typeof row.answerOptions === 'string') {
        try {
          question.answerOptions = JSON.parse(row.answerOptions);
        } catch (error) {
          console.error('Error parsing answerOptions JSON:', error);
        }
      } else {
        question.answerOptions = row.answerOptions;
      }
    }

    return question;
  }

  /**
   * Validate and normalize question type
   * @param type Question type string
   * @returns Validated question type
   */
  private validateQuestionType(type: string): string {
    const validTypes = Object.values(QuestionType);
    const normalizedType = type.toUpperCase();

    if (validTypes.includes(normalizedType as QuestionType)) {
      return normalizedType;
    }

    // Default to MULTIPLE_CHOICE if invalid
    console.warn(
      `Invalid question type: ${type}. Defaulting to MULTIPLE_CHOICE.`,
    );
    return 'MULTIPLE_CHOICE';
  }

  /**
   * Validate and normalize difficulty
   * @param difficulty Difficulty string
   * @returns Validated difficulty
   */
  private validateDifficulty(difficulty: string): string {
    const validDifficulties = Object.values(Difficulty);
    const normalizedDifficulty = difficulty.toUpperCase();

    if (validDifficulties.includes(normalizedDifficulty as Difficulty)) {
      return normalizedDifficulty;
    }

    // Default to BEGINNER if invalid
    console.warn(`Invalid difficulty: ${difficulty}. Defaulting to BEGINNER.`);
    return 'BEGINNER';
  }

  /**
   * Create questions in the question bank
   * @param questions Array of questions to create
   * @param questionBankId ID of the question bank
   * @param userId ID of the user creating the questions
   * @returns Array of created question IDs
   */
  private async createQuestionsInBank(
    questions: ImportedQuestion[],
    questionBankId: number,
    userId: number,
  ): Promise<number[]> {
    const createdQuestionIds: number[] = [];

    // Check if question bank exists
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id: questionBankId },
    });

    if (!questionBank) {
      throw new Error(`Question bank with ID ${questionBankId} not found`);
    }

    // Create questions one by one
    for (const question of questions) {
      try {
        const createdQuestion = await this.prisma.questionBankItem.create({
          data: {
            questionBankId,
            text: question.text,
            type: question.type as QuestionType,
            codeTemplate: question.codeTemplate,
            codeLanguage: question.codeLanguage,
            expectedOutput: question.expectedOutput,
            essayMinWords: question.essayMinWords,
            essayMaxWords: question.essayMaxWords,
            dragDropItems: question.dragDropItems,
            points: question.points || 1,
            difficulty: (question.difficulty as Difficulty) || 'BEGINNER',
            answerOptions: question.answerOptions,
            createdBy: userId,
          },
        });

        createdQuestionIds.push(createdQuestion.id);
      } catch (error) {
        console.error('Error creating question:', error);
      }
    }

    return createdQuestionIds;
  }
}
