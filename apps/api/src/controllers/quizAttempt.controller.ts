// apps/api/src/controllers/quizAttempt.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import {
  StartQuizAttemptInput,
  SubmitAnswerInput,
  CompleteQuizAttemptInput,
} from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle quiz-forsøg for en bruger
 */
export const getUserQuizAttempts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: true,
        _count: {
          select: { userAnswers: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.status(200).json(quizAttempts);
  } catch (error) {
    console.error(
      `Fejl ved hentning af quiz-forsøg for bruger ${userId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quiz-forsøg' });
  }
};

/**
 * Henter et specifikt quiz-forsøg ud fra ID
 */
export const getQuizAttemptById = async (
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
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: Number(id) },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answerOptions: true,
              },
            },
          },
        },
        userAnswers: {
          include: {
            question: true,
            selectedAnswerOption: true,
          },
        },
      },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    // Tjek om quiz-forsøget tilhører den aktuelle bruger
    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    res.status(200).json(quizAttempt);
  } catch (error) {
    console.error(`Fejl ved hentning af quiz-forsøg med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quiz-forsøget' });
  }
};

/**
 * Starter et nyt quiz-forsøg
 */
export const startQuizAttempt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizId }: StartQuizAttemptInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quizzen eksisterer
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Den angivne quiz findes ikke' });
      return;
    }

    // Tjek om quizzen har spørgsmål
    if (quiz.questions.length === 0) {
      res.status(400).json({ message: 'Quizzen har ingen spørgsmål' });
      return;
    }

    // Opret et nyt quiz-forsøg
    const newQuizAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score: 0,
        startedAt: new Date(),
      },
    });

    // Opdater eller opret brugerens fremskridt for denne quiz
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        quizId,
      },
    });

    if (existingProgress) {
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: ProgressStatus.IN_PROGRESS,
          quizAttemptId: newQuizAttempt.id,
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId,
          quizId,
          status: ProgressStatus.IN_PROGRESS,
          quizAttemptId: newQuizAttempt.id,
        },
      });
    }

    res.status(201).json(newQuizAttempt);
  } catch (error) {
    console.error(`Fejl ved start af quiz-forsøg for quiz ${quizId}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved start af quiz-forsøget' });
  }
};

/**
 * Indsender et svar på et spørgsmål i et quiz-forsøg
 */
export const submitAnswer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    quizAttemptId,
    questionId,
    selectedAnswerOptionId,
    inputText,
  }: SubmitAnswerInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quiz-forsøget eksisterer og tilhører brugeren
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: quizAttemptId },
      include: { quiz: true },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    // Tjek om quiz-forsøget er afsluttet
    if (quizAttempt.completedAt) {
      res.status(400).json({ message: 'Quiz-forsøget er allerede afsluttet' });
      return;
    }

    // Tjek om spørgsmålet eksisterer og tilhører quizzen
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { answerOptions: true },
    });

    if (!question) {
      res.status(404).json({ message: 'Spørgsmålet blev ikke fundet' });
      return;
    }

    if (question.quizId !== quizAttempt.quizId) {
      res.status(400).json({ message: 'Spørgsmålet tilhører ikke denne quiz' });
      return;
    }

    // Tjek om der allerede er et svar på dette spørgsmål i dette forsøg
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        quizAttemptId,
        questionId,
      },
    });

    // Hvis der er et eksisterende svar, opdater det
    if (existingAnswer) {
      const updatedAnswer = await prisma.userAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedAnswerOptionId: selectedAnswerOptionId || null,
          inputText: inputText || null,
        },
      });

      res.status(200).json(updatedAnswer);
      return;
    }

    // Ellers opret et nyt svar
    const newAnswer = await prisma.userAnswer.create({
      data: {
        quizAttemptId,
        questionId,
        selectedAnswerOptionId: selectedAnswerOptionId || null,
        inputText: inputText || null,
      },
    });

    res.status(201).json(newAnswer);
  } catch (error) {
    console.error(
      `Fejl ved indsendelse af svar for quiz-forsøg ${quizAttemptId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved indsendelse af svaret' });
  }
};

/**
 * Afslutter et quiz-forsøg og beregner scoren
 */
export const completeQuizAttempt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizAttemptId }: CompleteQuizAttemptInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quiz-forsøget eksisterer og tilhører brugeren
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: quizAttemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answerOptions: true,
              },
            },
          },
        },
        userAnswers: {
          include: {
            selectedAnswerOption: true,
          },
        },
      },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    // Tjek om quiz-forsøget allerede er afsluttet
    if (quizAttempt.completedAt) {
      res.status(400).json({ message: 'Quiz-forsøget er allerede afsluttet' });
      return;
    }

    // Beregn scoren
    let score = 0;
    const totalQuestions = quizAttempt.quiz.questions.length;

    // For hvert spørgsmål, tjek om svaret er korrekt
    for (const question of quizAttempt.quiz.questions) {
      const userAnswer = quizAttempt.userAnswers.find(
        (answer) => answer.questionId === question.id,
      );

      if (
        userAnswer &&
        userAnswer.selectedAnswerOption &&
        userAnswer.selectedAnswerOption.isCorrect
      ) {
        score += 1;
      }
    }

    // Beregn procentvis score (0-100)
    const percentageScore =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Opdater quiz-forsøget med score og afslutningsdato
    const updatedQuizAttempt = await prisma.quizAttempt.update({
      where: { id: quizAttemptId },
      data: {
        score: percentageScore,
        completedAt: new Date(),
      },
    });

    // Opdater brugerens fremskridt for denne quiz
    await prisma.userProgress.updateMany({
      where: {
        userId,
        quizId: quizAttempt.quizId,
      },
      data: {
        status: ProgressStatus.COMPLETED,
        score: percentageScore,
      },
    });

    res.status(200).json({
      ...updatedQuizAttempt,
      totalQuestions,
      correctAnswers: score,
      percentageScore,
    });
  } catch (error) {
    console.error(
      `Fejl ved afslutning af quiz-forsøg ${quizAttemptId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved afslutning af quiz-forsøget' });
  }
};
