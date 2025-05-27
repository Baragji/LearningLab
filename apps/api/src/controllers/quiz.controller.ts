// apps/api/src/controllers/quiz.controller.ts

import { PrismaClient, QuestionType } from '@prisma/client';
import {
  CreateQuizInput,
  CreateQuestionInput,
  CreateAnswerOptionInput,
} from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle quizzer
 */
export const getAllQuizzes = async (_req: any, res: any): Promise<void> => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        lesson: true,
        module: true,
        questions: {
          include: {
            _count: {
              select: { answerOptions: true },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Fejl ved hentning af quizzer:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quizzer' });
  }
};

/**
 * Henter quizzer for en specifik lektion
 */
export const getQuizzesByLesson = async (req: any, res: any): Promise<void> => {
  const { lessonId } = req.params;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { lessonId: Number(lessonId) },
      include: {
        questions: {
          include: {
            _count: {
              select: { answerOptions: true },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    res.status(200).json(quizzes);
  } catch (error) {
    console.error(
      `Fejl ved hentning af quizzer for lektion ${lessonId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quizzer' });
  }
};

/**
 * Henter quizzer for et specifikt modul
 */
export const getQuizzesByModule = async (req: any, res: any): Promise<void> => {
  const { moduleId } = req.params;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { moduleId: Number(moduleId) },
      include: {
        questions: {
          include: {
            _count: {
              select: { answerOptions: true },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    res.status(200).json(quizzes);
  } catch (error) {
    console.error(`Fejl ved hentning af quizzer for modul ${moduleId}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quizzer' });
  }
};

/**
 * Henter en specifik quiz ud fra ID
 */
export const getQuizById = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(id) },
      include: {
        lesson: true,
        module: true,
        questions: {
          include: {
            answerOptions: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Quizzen blev ikke fundet' });
      return;
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error(`Fejl ved hentning af quiz med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quizzen' });
  }
};

/**
 * Opretter en ny quiz
 */
export const createQuiz = async (req: any, res: any): Promise<void> => {
  const { title, description, lessonId, moduleId }: CreateQuizInput = req.body;

  try {
    // Tjek om enten lektion eller modul er angivet
    if (!lessonId && !moduleId) {
      res
        .status(400)
        .json({ message: 'Enten lessonId eller moduleId skal angives' });
      return;
    }

    // Tjek om lektionen eksisterer, hvis angivet
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        res.status(404).json({ message: 'Den angivne lektion findes ikke' });
        return;
      }
    }

    // Tjek om modulet eksisterer, hvis angivet
    if (moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        res.status(404).json({ message: 'Det angivne modul findes ikke' });
        return;
      }
    }

    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        description,
        lessonId: lessonId || null,
        moduleId: moduleId || null,
      },
    });

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Fejl ved oprettelse af quiz:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af quizzen' });
  }
};

/**
 * Opdaterer en eksisterende quiz
 */
export const updateQuiz = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { title, description, lessonId, moduleId } = req.body;

  try {
    // Tjek om quizzen eksisterer
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: Number(id) },
    });

    if (!existingQuiz) {
      res.status(404).json({ message: 'Quizzen blev ikke fundet' });
      return;
    }

    // Tjek om lektionen eksisterer, hvis angivet
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        res.status(404).json({ message: 'Den angivne lektion findes ikke' });
        return;
      }
    }

    // Tjek om modulet eksisterer, hvis angivet
    if (moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        res.status(404).json({ message: 'Det angivne modul findes ikke' });
        return;
      }
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: Number(id) },
      data: {
        title: title || existingQuiz.title,
        description: description || existingQuiz.description,
        lessonId: lessonId !== undefined ? lessonId : existingQuiz.lessonId,
        moduleId: moduleId !== undefined ? moduleId : existingQuiz.moduleId,
      },
    });

    res.status(200).json(updatedQuiz);
  } catch (error) {
    console.error(`Fejl ved opdatering af quiz med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af quizzen' });
  }
};

/**
 * Sletter en quiz
 */
export const deleteQuiz = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om quizzen eksisterer
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          include: {
            answerOptions: true,
          },
        },
        attempts: true,
      },
    });

    if (!existingQuiz) {
      res.status(404).json({ message: 'Quizzen blev ikke fundet' });
      return;
    }

    // Tjek om der er quiz-forsøg tilknyttet quizzen
    if (existingQuiz.attempts.length > 0) {
      res.status(400).json({
        message: 'Quizzen kan ikke slettes, da der er quiz-forsøg tilknyttet.',
      });
      return;
    }

    // Slet alle svarmuligheder for alle spørgsmål i quizzen
    for (const question of existingQuiz.questions) {
      if (question.answerOptions.length > 0) {
        await prisma.answerOption.deleteMany({
          where: { questionId: question.id },
        });
      }
    }

    // Slet alle spørgsmål i quizzen
    if (existingQuiz.questions.length > 0) {
      await prisma.question.deleteMany({
        where: { quizId: Number(id) },
      });
    }

    // Slet quizzen
    await prisma.quiz.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Quizzen blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af quiz med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af quizzen' });
  }
};

/**
 * Opretter et nyt spørgsmål til en quiz
 */
export const createQuestion = async (req: any, res: any): Promise<void> => {
  const { text, type, quizId, answerOptions }: CreateQuestionInput = req.body;

  try {
    // Tjek om quizzen eksisterer
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Den angivne quiz findes ikke' });
      return;
    }

    // Valider spørgsmålstypen
    if (!Object.values(QuestionType).includes(type as QuestionType)) {
      res.status(400).json({ message: 'Ugyldig spørgsmålstype' });
      return;
    }

    // Opret spørgsmålet
    const newQuestion = await prisma.question.create({
      data: {
        text,
        type: type as QuestionType,
        quizId,
      },
    });

    // Opret svarmuligheder, hvis de er angivet
    if (answerOptions && answerOptions.length > 0) {
      const answerOptionPromises = answerOptions.map((option) => {
        return prisma.answerOption.create({
          data: {
            text: option.text,
            isCorrect: option.isCorrect,
            questionId: newQuestion.id,
          },
        });
      });

      await Promise.all(answerOptionPromises);
    }

    // Hent det oprettede spørgsmål med svarmuligheder
    const questionWithOptions = await prisma.question.findUnique({
      where: { id: newQuestion.id },
      include: { answerOptions: true },
    });

    res.status(201).json(questionWithOptions);
  } catch (error) {
    console.error('Fejl ved oprettelse af spørgsmål:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af spørgsmålet' });
  }
};

/**
 * Opdaterer et eksisterende spørgsmål
 */
export const updateQuestion = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { text, type } = req.body;

  try {
    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await prisma.question.findUnique({
      where: { id: Number(id) },
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

    const updatedQuestion = await prisma.question.update({
      where: { id: Number(id) },
      data: {
        text: text || existingQuestion.text,
        type: type ? (type as QuestionType) : existingQuestion.type,
      },
      include: { answerOptions: true },
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
 * Sletter et spørgsmål
 */
export const deleteQuestion = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om spørgsmålet eksisterer
    const existingQuestion = await prisma.question.findUnique({
      where: { id: Number(id) },
      include: { answerOptions: true, userAnswers: true },
    });

    if (!existingQuestion) {
      res.status(404).json({ message: 'Spørgsmålet blev ikke fundet' });
      return;
    }

    // Tjek om der er brugerbesvarelser tilknyttet spørgsmålet
    if (existingQuestion.userAnswers.length > 0) {
      res.status(400).json({
        message:
          'Spørgsmålet kan ikke slettes, da der er brugerbesvarelser tilknyttet.',
      });
      return;
    }

    // Slet alle svarmuligheder for spørgsmålet
    if (existingQuestion.answerOptions.length > 0) {
      await prisma.answerOption.deleteMany({
        where: { questionId: Number(id) },
      });
    }

    // Slet spørgsmålet
    await prisma.question.delete({
      where: { id: Number(id) },
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
 * Opretter en ny svarmulighed til et spørgsmål
 */
export const createAnswerOption = async (req: any, res: any): Promise<void> => {
  const { questionId } = req.params;
  const { text, isCorrect }: CreateAnswerOptionInput = req.body;

  try {
    // Tjek om spørgsmålet eksisterer
    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) },
    });

    if (!question) {
      res.status(404).json({ message: 'Det angivne spørgsmål findes ikke' });
      return;
    }

    const newAnswerOption = await prisma.answerOption.create({
      data: {
        text,
        isCorrect,
        questionId: Number(questionId),
      },
    });

    res.status(201).json(newAnswerOption);
  } catch (error) {
    console.error(
      `Fejl ved oprettelse af svarmulighed for spørgsmål ${questionId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af svarmuligheden' });
  }
};

/**
 * Opdaterer en eksisterende svarmulighed
 */
export const updateAnswerOption = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { text, isCorrect } = req.body;

  try {
    // Tjek om svarmuligheden eksisterer
    const existingAnswerOption = await prisma.answerOption.findUnique({
      where: { id: Number(id) },
    });

    if (!existingAnswerOption) {
      res.status(404).json({ message: 'Svarmuligheden blev ikke fundet' });
      return;
    }

    const updatedAnswerOption = await prisma.answerOption.update({
      where: { id: Number(id) },
      data: {
        text: text || existingAnswerOption.text,
        isCorrect:
          isCorrect !== undefined ? isCorrect : existingAnswerOption.isCorrect,
      },
    });

    res.status(200).json(updatedAnswerOption);
  } catch (error) {
    console.error(`Fejl ved opdatering af svarmulighed med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af svarmuligheden' });
  }
};

/**
 * Sletter en svarmulighed
 */
export const deleteAnswerOption = async (req: any, res: any): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om svarmuligheden eksisterer
    const existingAnswerOption = await prisma.answerOption.findUnique({
      where: { id: Number(id) },
      include: { userAnswers: true },
    });

    if (!existingAnswerOption) {
      res.status(404).json({ message: 'Svarmuligheden blev ikke fundet' });
      return;
    }

    // Tjek om der er brugerbesvarelser tilknyttet svarmuligheden
    if (existingAnswerOption.userAnswers.length > 0) {
      res.status(400).json({
        message:
          'Svarmuligheden kan ikke slettes, da der er brugerbesvarelser tilknyttet.',
      });
      return;
    }

    await prisma.answerOption.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Svarmuligheden blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af svarmulighed med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af svarmuligheden' });
  }
};
