// apps/api/src/controllers/lesson.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateLessonInput } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle lektioner for et specifikt modul
 */
export const getLessonsByModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { moduleId } = req.params;

  try {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId: Number(moduleId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(lessons);
  } catch (error) {
    console.error(
      `Fejl ved hentning af lektioner for modul ${moduleId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af lektioner' });
  }
};

/**
 * Henter en specifik lektion ud fra ID
 */
export const getLessonById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      include: {
        module: {
          include: {
            course: {
              include: {
                subjectArea: true,
              },
            },
          },
        },
        contentBlocks: {
          orderBy: { order: 'asc' },
        },
        quizzes: true,
      },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error(`Fejl ved hentning af lektion med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af lektionen' });
  }
};

/**
 * Opretter en ny lektion
 */
export const createLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, order, moduleId }: CreateLessonInput = req.body;

  try {
    // Tjek om modulet eksisterer
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      res.status(404).json({ message: 'Det angivne modul findes ikke' });
      return;
    }

    // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter den sidste lektion
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { order: 'desc' },
      });

      lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const newLesson = await prisma.lesson.create({
      data: {
        title,
        description,
        order: lessonOrder,
        moduleId,
      },
    });

    res.status(201).json(newLesson);
  } catch (error) {
    console.error('Fejl ved oprettelse af lektion:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af lektionen' });
  }
};

/**
 * Opdaterer en eksisterende lektion
 */
export const updateLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { title, description, order, moduleId } = req.body;

  try {
    // Tjek om lektionen eksisterer
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
    });

    if (!existingLesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    // Hvis moduleId ændres, tjek om det nye modul eksisterer
    if (moduleId && moduleId !== existingLesson.moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        res.status(404).json({ message: 'Det angivne modul findes ikke' });
        return;
      }
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        title: title || existingLesson.title,
        description: description || existingLesson.description,
        order: order !== undefined ? order : existingLesson.order,
        moduleId: moduleId || existingLesson.moduleId,
      },
    });

    res.status(200).json(updatedLesson);
  } catch (error) {
    console.error(`Fejl ved opdatering af lektion med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af lektionen' });
  }
};

/**
 * Opdaterer rækkefølgen af lektioner i et modul
 */
export const updateLessonsOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { moduleId } = req.params;
  const { lessonIds } = req.body;

  if (!Array.isArray(lessonIds)) {
    res
      .status(400)
      .json({ message: "lessonIds skal være et array af lektion-ID'er" });
    return;
  }

  try {
    // Tjek om modulet eksisterer
    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: { lessons: true },
    });

    if (!module) {
      res.status(404).json({ message: 'Modulet blev ikke fundet' });
      return;
    }

    // Tjek om alle lektioner tilhører modulet
    const moduleLessonIds = module.lessons.map((lesson) => lesson.id);
    const allLessonsExist = lessonIds.every((id) =>
      moduleLessonIds.includes(Number(id)),
    );

    if (!allLessonsExist) {
      res.status(400).json({
        message: 'En eller flere lektioner tilhører ikke det angivne modul',
      });
      return;
    }

    // Opdater rækkefølgen af lektioner
    const updates = lessonIds.map((lessonId, index) => {
      return prisma.lesson.update({
        where: { id: Number(lessonId) },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    const updatedLessons = await prisma.lesson.findMany({
      where: { moduleId: Number(moduleId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(updatedLessons);
  } catch (error) {
    console.error(
      `Fejl ved opdatering af lektionsrækkefølge for modul ${moduleId}:`,
      error,
    );
    res.status(500).json({
      message: 'Der opstod en fejl ved opdatering af lektionsrækkefølgen',
    });
  }
};

/**
 * Sletter en lektion
 */
export const deleteLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om lektionen eksisterer
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      include: { contentBlocks: true, quizzes: true },
    });

    if (!existingLesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    // Tjek om der er indholdsblokke eller quizzer tilknyttet lektionen
    if (
      existingLesson.contentBlocks.length > 0 ||
      existingLesson.quizzes.length > 0
    ) {
      res.status(400).json({
        message:
          'Lektionen kan ikke slettes, da der er indholdsblokke eller quizzer tilknyttet. Slet venligst disse først.',
      });
      return;
    }

    await prisma.lesson.delete({
      where: { id: Number(id) },
    });

    // Opdater rækkefølgen af de resterende lektioner
    const remainingLessons = await prisma.lesson.findMany({
      where: { moduleId: existingLesson.moduleId },
      orderBy: { order: 'asc' },
    });

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    res.status(200).json({ message: 'Lektionen blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af lektion med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af lektionen' });
  }
};
