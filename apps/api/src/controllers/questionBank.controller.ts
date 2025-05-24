// apps/api/src/controllers/questionBank.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';
import {
  CreateQuestionBankInput,
  CreateQuestionBankItemInput,
  ImportQuestionsInput,
  AddQuestionsFromBankInput,
} from '@repo/core';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

/**
 * Henter alle spørgsmålsbanker
 */
export const getAllQuestionBanks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questionBanks = await prisma.questionBank.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: 'asc' },
      where: { deletedAt: null },
    });

    res.status(200).json(questionBanks);
  } catch (error) {
    console.error('Fejl ved hentning af spørgsmålsbanker:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af spørgsmålsbanker' });
  }
};

/**
 * Henter en specifik spørgsmålsbank ud fra ID
 */
export const getQuestionBankById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!questionBank) {
      res.status(404).json({ message: 'Spørgsmålsbanken blev ikke fundet' });
      return;
    }

    res.status(200).json(questionBank);
  } catch (error) {
    console.error(`Fejl ved hentning af spørgsmålsbank med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af spørgsmålsbanken' });
  }
};

/**
 * Opretter en ny spørgsmålsbank
 */
export const createQuestionBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, description, category, tags }: CreateQuestionBankInput =
    req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    const newQuestionBank = await prisma.questionBank.create({
      data: {
        name,
        description,
        category,
        tags: tags || [],
        createdBy: userId,
        updatedBy: userId,
      },
    });

    res.status(201).json(newQuestionBank);
  } catch (error) {
    console.error('Fejl ved oprettelse af spørgsmålsbank:', error);
    res.status(500).json({
      message: 'Der opstod en fejl ved oprettelse af spørgsmålsbanken',
    });
  }
};

/**
 * Opdaterer en eksisterende spørgsmålsbank
 */
export const updateQuestionBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { name, description, category, tags } = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålsbanken eksisterer
    const existingQuestionBank = await prisma.questionBank.findUnique({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingQuestionBank) {
      res.status(404).json({ message: 'Spørgsmålsbanken blev ikke fundet' });
      return;
    }

    const updatedQuestionBank = await prisma.questionBank.update({
      where: { id: Number(id) },
      data: {
        name: name || existingQuestionBank.name,
        description:
          description !== undefined
            ? description
            : existingQuestionBank.description,
        category: category || existingQuestionBank.category,
        tags: tags || existingQuestionBank.tags,
        updatedBy: userId,
      },
    });

    res.status(200).json(updatedQuestionBank);
  } catch (error) {
    console.error(`Fejl ved opdatering af spørgsmålsbank med id ${id}:`, error);
    res.status(500).json({
      message: 'Der opstod en fejl ved opdatering af spørgsmålsbanken',
    });
  }
};

/**
 * Sletter en spørgsmålsbank (soft delete)
 */
export const deleteQuestionBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålsbanken eksisterer
    const existingQuestionBank = await prisma.questionBank.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        questions: true,
      },
    });

    if (!existingQuestionBank) {
      res.status(404).json({ message: 'Spørgsmålsbanken blev ikke fundet' });
      return;
    }

    // Soft delete alle spørgsmål i banken
    await prisma.questionBankItem.updateMany({
      where: { questionBankId: Number(id), deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Soft delete spørgsmålsbanken
    await prisma.questionBank.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    res.status(200).json({ message: 'Spørgsmålsbanken blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af spørgsmålsbank med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af spørgsmålsbanken' });
  }
};

/**
 * Opretter et nyt spørgsmål i en spørgsmålsbank
 */
export const createQuestionBankItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    questionBankId,
    text,
    type,
    codeTemplate,
    codeLanguage,
    expectedOutput,
    essayMinWords,
    essayMaxWords,
    dragDropItems,
    points,
    difficulty,
    answerOptions,
  }: CreateQuestionBankItemInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålsbanken eksisterer
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: questionBankId, deletedAt: null },
    });

    if (!questionBank) {
      res
        .status(404)
        .json({ message: 'Den angivne spørgsmålsbank findes ikke' });
      return;
    }

    // Valider spørgsmålstypen
    if (!Object.values(QuestionType).includes(type as QuestionType)) {
      res.status(400).json({ message: 'Ugyldig spørgsmålstype' });
      return;
    }

    // Opret spørgsmålet
    const newQuestionBankItem = await prisma.questionBankItem.create({
      data: {
        questionBankId,
        text,
        type: type as QuestionType,
        codeTemplate,
        codeLanguage,
        expectedOutput,
        essayMinWords,
        essayMaxWords,
        dragDropItems: dragDropItems ? JSON.stringify(dragDropItems) : null,
        points: points || 1,
        difficulty: (difficulty as Difficulty) || Difficulty.BEGINNER,
        answerOptions: answerOptions ? JSON.stringify(answerOptions) : null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    res.status(201).json(newQuestionBankItem);
  } catch (error) {
    console.error('Fejl ved oprettelse af spørgsmål i spørgsmålsbank:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af spørgsmålet' });
  }
};

/**
 * Opdaterer et eksisterende spørgsmål i en spørgsmålsbank
 */
export const updateQuestionBankItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const {
    text,
    type,
    codeTemplate,
    codeLanguage,
    expectedOutput,
    essayMinWords,
    essayMaxWords,
    dragDropItems,
    points,
    difficulty,
    answerOptions,
  } = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await prisma.questionBankItem.findUnique({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingQuestion) {
      res.status(404).json({ message: 'Spørgsmålet blev ikke fundet' });
      return;
    }

    // Valider spørgsmålstypen hvis den ændres
    if (type && type !== existingQuestion.type) {
      if (!Object.values(QuestionType).includes(type as QuestionType)) {
        res.status(400).json({ message: 'Ugyldig spørgsmålstype' });
        return;
      }
    }

    // Valider sværhedsgraden hvis den ændres
    if (difficulty && difficulty !== existingQuestion.difficulty) {
      if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
        res.status(400).json({ message: 'Ugyldig sværhedsgrad' });
        return;
      }
    }

    const updatedQuestion = await prisma.questionBankItem.update({
      where: { id: Number(id) },
      data: {
        text: text || existingQuestion.text,
        type: type ? (type as QuestionType) : existingQuestion.type,
        codeTemplate:
          codeTemplate !== undefined
            ? codeTemplate
            : existingQuestion.codeTemplate,
        codeLanguage:
          codeLanguage !== undefined
            ? codeLanguage
            : existingQuestion.codeLanguage,
        expectedOutput:
          expectedOutput !== undefined
            ? expectedOutput
            : existingQuestion.expectedOutput,
        essayMinWords:
          essayMinWords !== undefined
            ? essayMinWords
            : existingQuestion.essayMinWords,
        essayMaxWords:
          essayMaxWords !== undefined
            ? essayMaxWords
            : existingQuestion.essayMaxWords,
        dragDropItems:
          dragDropItems !== undefined
            ? dragDropItems
            : existingQuestion.dragDropItems,
        points: points || existingQuestion.points,
        difficulty: difficulty
          ? (difficulty as Difficulty)
          : existingQuestion.difficulty,
        answerOptions:
          answerOptions !== undefined
            ? answerOptions
            : existingQuestion.answerOptions,
        updatedBy: userId,
      },
    });

    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error(`Fejl ved opdatering af spørgsmål med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af spørgsmålet' });
  }
};

/**
 * Sletter et spørgsmål fra en spørgsmålsbank (soft delete)
 */
export const deleteQuestionBankItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await prisma.questionBankItem.findUnique({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingQuestion) {
      res.status(404).json({ message: 'Spørgsmålet blev ikke fundet' });
      return;
    }

    // Soft delete spørgsmålet
    await prisma.questionBankItem.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    res.status(200).json({ message: 'Spørgsmålet blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af spørgsmål med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af spørgsmålet' });
  }
};

/**
 * Importerer spørgsmål fra CSV eller Excel fil
 */
export const importQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { questionBankId, fileContent, fileType }: ImportQuestionsInput =
    req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om spørgsmålsbanken eksisterer
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: questionBankId, deletedAt: null },
    });

    if (!questionBank) {
      res
        .status(404)
        .json({ message: 'Den angivne spørgsmålsbank findes ikke' });
      return;
    }

    let questions: any[] = [];

    if (fileType === 'csv') {
      // Parse CSV data
      const results: any[] = [];
      const stream = Readable.from(fileContent);

      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });

      questions = results;
    } else if (fileType === 'excel') {
      // Parse Excel data
      const workbook = XLSX.read(fileContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      questions = XLSX.utils.sheet_to_json(worksheet);
    } else {
      res.status(400).json({
        message: 'Ugyldigt filformat. Understøtter kun CSV og Excel.',
      });
      return;
    }

    // Validate and transform the imported questions
    const validQuestions = questions.filter((q) => {
      return q.text && q.type && Object.values(QuestionType).includes(q.type);
    });

    if (validQuestions.length === 0) {
      res
        .status(400)
        .json({ message: 'Ingen gyldige spørgsmål fundet i filen' });
      return;
    }

    // Create the questions in the database
    const createdQuestions = await Promise.all(
      validQuestions.map((q) => {
        return prisma.questionBankItem.create({
          data: {
            questionBankId,
            text: q.text,
            type: q.type as QuestionType,
            codeTemplate: q.codeTemplate,
            codeLanguage: q.codeLanguage,
            expectedOutput: q.expectedOutput,
            essayMinWords: q.essayMinWords ? parseInt(q.essayMinWords) : null,
            essayMaxWords: q.essayMaxWords ? parseInt(q.essayMaxWords) : null,
            dragDropItems: q.dragDropItems ? JSON.parse(q.dragDropItems) : null,
            points: q.points ? parseInt(q.points) : 1,
            difficulty: (q.difficulty as Difficulty) || Difficulty.BEGINNER,
            answerOptions: q.answerOptions ? JSON.parse(q.answerOptions) : null,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }),
    );

    res.status(201).json({
      message: `${createdQuestions.length} spørgsmål blev importeret`,
      importedQuestions: createdQuestions,
    });
  } catch (error) {
    console.error(
      `Fejl ved import af spørgsmål til spørgsmålsbank ${questionBankId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved import af spørgsmål' });
  }
};

/**
 * Tilføjer spørgsmål fra spørgsmålsbank til en quiz
 */
export const addQuestionsFromBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizId, questionBankItemIds }: AddQuestionsFromBankInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quizzen eksisterer
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, deletedAt: null },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Den angivne quiz findes ikke' });
      return;
    }

    // Hent de valgte spørgsmål fra spørgsmålsbanken
    const questionBankItems = await prisma.questionBankItem.findMany({
      where: {
        id: { in: questionBankItemIds },
        deletedAt: null,
      },
    });

    if (questionBankItems.length === 0) {
      res
        .status(404)
        .json({ message: 'Ingen af de angivne spørgsmål blev fundet' });
      return;
    }

    // Opret spørgsmål i quizzen baseret på spørgsmålene fra banken
    const createdQuestions = await Promise.all(
      questionBankItems.map(async (item) => {
        // Opret spørgsmålet
        const question = await prisma.question.create({
          data: {
            text: item.text,
            type: item.type,
            quizId,
            codeTemplate: item.codeTemplate,
            codeLanguage: item.codeLanguage,
            expectedOutput: item.expectedOutput,
            essayMinWords: item.essayMinWords,
            essayMaxWords: item.essayMaxWords,
            dragDropItems: item.dragDropItems,
            points: item.points,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Hvis der er svarmuligheder og spørgsmålet er multiple choice
        if (item.answerOptions && item.type === QuestionType.MULTIPLE_CHOICE) {
          const options = JSON.parse(JSON.stringify(item.answerOptions));

          // Opret svarmuligheder
          await Promise.all(
            options.map((option: any) => {
              return prisma.answerOption.create({
                data: {
                  text: option.text,
                  isCorrect: option.isCorrect,
                  questionId: question.id,
                  createdBy: userId,
                  updatedBy: userId,
                },
              });
            }),
          );
        }

        return question;
      }),
    );

    res.status(201).json({
      message: `${createdQuestions.length} spørgsmål blev tilføjet til quizzen`,
      addedQuestions: createdQuestions,
    });
  } catch (error) {
    console.error(
      `Fejl ved tilføjelse af spørgsmål til quiz ${quizId}:`,
      error,
    );
    res.status(500).json({
      message: 'Der opstod en fejl ved tilføjelse af spørgsmål til quizzen',
    });
  }
};
