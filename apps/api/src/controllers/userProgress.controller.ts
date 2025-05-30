// apps/api/src/controllers/userProgress.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import { Role } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter fremskridt for den aktuelle bruger
 */
export const getUserProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  include: {
                    educationProgram: true,
                  },
                },
              },
            },
          },
        },
        quiz: true,
        quizAttempt: true,
      },
    });

    res.status(200).json(progress);
  } catch (error) {
    console.error(
      `Fejl ved hentning af fremskridt for bruger ${userId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fremskridt' });
  }
};

/**
 * Henter fremskridt for en specifik bruger (kun for admin)
 */
export const getUserProgressById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = (req.user as any)?.id as number;
  const isAdmin = (req.user as any)?.role === Role.ADMIN;

  if (!currentUserId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  // Kun admin kan se andre brugeres fremskridt
  if (Number(userId) !== currentUserId && !isAdmin) {
    res.status(403).json({
      message: 'Du har ikke tilladelse til at se denne brugers fremskridt',
    });
    return;
  }

  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: Number(userId) },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                course: {
                  include: {
                    educationProgram: true,
                  },
                },
              },
            },
          },
        },
        quiz: true,
        quizAttempt: true,
      },
    });

    res.status(200).json(progress);
  } catch (error) {
    console.error(
      `Fejl ved hentning af fremskridt for bruger ${userId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fremskridt' });
  }
};

/**
 * Henter fremskridt for en specifik lektion
 */
export const getLessonProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { lessonId } = req.params;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om lektionen eksisterer
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(lessonId) },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    // Hent eller opret fremskridt for lektionen
    let progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        lessonId: Number(lessonId),
      },
    });

    if (!progress) {
      // Hvis der ikke findes fremskridt, opret det med status NOT_STARTED
      progress = await prisma.userProgress.create({
        data: {
          userId,
          lessonId: Number(lessonId),
          status: ProgressStatus.NOT_STARTED,
        },
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error(
      `Fejl ved hentning af fremskridt for lektion ${lessonId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fremskridt' });
  }
};

/**
 * Opdaterer fremskridt for en specifik lektion
 */
export const updateLessonProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { lessonId } = req.params;
  const { status } = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  // Valider status
  if (!Object.values(ProgressStatus).includes(status as ProgressStatus)) {
    res.status(400).json({ message: 'Ugyldig status' });
    return;
  }

  try {
    // Tjek om lektionen eksisterer
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(lessonId) },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    // Opdater eller opret fremskridt for lektionen
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        lessonId: Number(lessonId),
      },
    });

    let progress;
    if (existingProgress) {
      progress = await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: status as ProgressStatus,
        },
      });
    } else {
      progress = await prisma.userProgress.create({
        data: {
          userId,
          lessonId: Number(lessonId),
          status: status as ProgressStatus,
        },
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error(
      `Fejl ved opdatering af fremskridt for lektion ${lessonId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af fremskridt' });
  }
};

/**
 * Opdaterer brugerens fremskridt for en quiz
 */
export const updateUserProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizId, score, answers, completedAt } = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  if (!quizId || score === undefined) {
    res.status(400).json({ message: 'Manglende påkrævede felter' });
    return;
  }

  try {
    // Tjek om quizzen eksisterer
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Quizzen blev ikke fundet' });
      return;
    }

    // Find eksisterende fremskridt eller opret nyt
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        quizId: Number(quizId),
      },
    });

    let progress;
    if (existingProgress) {
      progress = await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: ProgressStatus.COMPLETED,
          score: score,
          updatedAt: new Date(),
        },
      });
    } else {
      progress = await prisma.userProgress.create({
        data: {
          userId,
          quizId: Number(quizId),
          status: ProgressStatus.COMPLETED,
          score: score,
        },
      });
    }

    // Hvis der er svar, gem dem også
    if (answers && answers.length > 0) {
      // Opret en quiz-attempt hvis der ikke allerede findes en
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId,
          quizId: Number(quizId),
          score: score,
          completedAt: completedAt ? new Date(completedAt) : new Date(),
        },
      });

      // Update the UserProgress to link to this QuizAttempt
      await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          quizAttemptId: quizAttempt.id,
        },
      });

      // Gem svarene
      for (const answer of answers) {
        await prisma.userAnswer.create({
          data: {
            quizAttemptId: quizAttempt.id,
            questionId: answer.questionId,
            selectedAnswerOptionId: answer.selectedOptionId,
            // isCorrect is not in the schema for UserAnswer
          },
        });
      }
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error(`Fejl ved opdatering af quiz fremskridt:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af fremskridt' });
  }
};

export const getCourseProgress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { courseId } = req.params;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om kurset eksisterer
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      include: {
        topics: {
          include: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    // Hent alle lektioner og quizzer i kurset
    const lessonIds: number[] = [];
    const quizIds: number[] = [];

    course.topics.forEach((topic) => {
      topic.lessons.forEach((lesson) => lessonIds.push(lesson.id));
      topic.quizzes.forEach((quiz) => quizIds.push(quiz.id));
    });

    // Hent fremskridt for alle lektioner og quizzer i kurset
    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        OR: [
          { lessonId: { in: lessonIds.length > 0 ? lessonIds : undefined } },
          { quizId: { in: quizIds.length > 0 ? quizIds : undefined } },
        ],
      },
    });

    // Beregn samlet fremskridt for kurset
    const totalItems = lessonIds.length + quizIds.length;
    const completedItems = progress.filter(
      (p) => p.status === ProgressStatus.COMPLETED,
    ).length;
    const inProgressItems = progress.filter(
      (p) => p.status === ProgressStatus.IN_PROGRESS,
    ).length;

    const percentageComplete =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.status(200).json({
      courseId: Number(courseId),
      totalItems,
      completedItems,
      inProgressItems,
      percentageComplete,
      status:
        percentageComplete === 100
          ? ProgressStatus.COMPLETED
          : percentageComplete > 0
            ? ProgressStatus.IN_PROGRESS
            : ProgressStatus.NOT_STARTED,
      detailedProgress: progress,
    });
  } catch (error) {
    console.error(
      `Fejl ved hentning af fremskridt for kursus ${courseId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fremskridt' });
  }
};
