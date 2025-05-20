// apps/api/src/controllers/module.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateModuleInput } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle moduler for et specifikt kursus
 */
export const getModulesByCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { courseId } = req.params;

  try {
    const modules = await prisma.module.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(modules);
  } catch (error) {
    console.error(
      `Fejl ved hentning af moduler for kursus ${courseId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af moduler' });
  }
};

/**
 * Henter et specifikt modul ud fra ID
 */
export const getModuleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const module = await prisma.module.findUnique({
      where: { id: Number(id) },
      include: {
        course: true,
        lessons: {
          orderBy: { order: 'asc' },
        },
        quizzes: true,
      },
    });

    if (!module) {
      res.status(404).json({ message: 'Modulet blev ikke fundet' });
      return;
    }

    res.status(200).json(module);
  } catch (error) {
    console.error(`Fejl ved hentning af modul med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af modulet' });
  }
};

/**
 * Opretter et nyt modul
 */
export const createModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, order, courseId }: CreateModuleInput = req.body;

  try {
    // Tjek om kurset eksisterer
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({ message: 'Det angivne kursus findes ikke' });
      return;
    }

    // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter det sidste modul
    let moduleOrder = order;
    if (moduleOrder === undefined) {
      const lastModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
      });

      moduleOrder = lastModule ? lastModule.order + 1 : 1;
    }

    const newModule = await prisma.module.create({
      data: {
        title,
        description,
        order: moduleOrder,
        courseId,
      },
    });

    res.status(201).json(newModule);
  } catch (error) {
    console.error('Fejl ved oprettelse af modul:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af modulet' });
  }
};

/**
 * Opdaterer et eksisterende modul
 */
export const updateModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { title, description, order, courseId } = req.body;

  try {
    // Tjek om modulet eksisterer
    const existingModule = await prisma.module.findUnique({
      where: { id: Number(id) },
    });

    if (!existingModule) {
      res.status(404).json({ message: 'Modulet blev ikke fundet' });
      return;
    }

    // Hvis courseId ændres, tjek om det nye kursus eksisterer
    if (courseId && courseId !== existingModule.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ message: 'Det angivne kursus findes ikke' });
        return;
      }
    }

    const updatedModule = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        title: title || existingModule.title,
        description: description || existingModule.description,
        order: order !== undefined ? order : existingModule.order,
        courseId: courseId || existingModule.courseId,
      },
    });

    res.status(200).json(updatedModule);
  } catch (error) {
    console.error(`Fejl ved opdatering af modul med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af modulet' });
  }
};

/**
 * Opdaterer rækkefølgen af moduler i et kursus
 */
export const updateModulesOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { courseId } = req.params;
  const { moduleIds } = req.body;

  if (!Array.isArray(moduleIds)) {
    res
      .status(400)
      .json({ message: "moduleIds skal være et array af modul-ID'er" });
    return;
  }

  try {
    // Tjek om kurset eksisterer
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      include: { modules: true },
    });

    if (!course) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    // Tjek om alle moduler tilhører kurset
    const courseModuleIds = course.modules.map((module) => module.id);
    const allModulesExist = moduleIds.every((id) =>
      courseModuleIds.includes(Number(id)),
    );

    if (!allModulesExist) {
      res.status(400).json({
        message: 'Et eller flere moduler tilhører ikke det angivne kursus',
      });
      return;
    }

    // Opdater rækkefølgen af moduler
    const updates = moduleIds.map((moduleId, index) => {
      return prisma.module.update({
        where: { id: Number(moduleId) },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    const updatedModules = await prisma.module.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(updatedModules);
  } catch (error) {
    console.error(
      `Fejl ved opdatering af modulrækkefølge for kursus ${courseId}:`,
      error,
    );
    res.status(500).json({
      message: 'Der opstod en fejl ved opdatering af modulrækkefølgen',
    });
  }
};

/**
 * Sletter et modul
 */
export const deleteModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om modulet eksisterer
    const existingModule = await prisma.module.findUnique({
      where: { id: Number(id) },
      include: { lessons: true, quizzes: true },
    });

    if (!existingModule) {
      res.status(404).json({ message: 'Modulet blev ikke fundet' });
      return;
    }

    // Tjek om der er lektioner eller quizzer tilknyttet modulet
    if (
      existingModule.lessons.length > 0 ||
      existingModule.quizzes.length > 0
    ) {
      res.status(400).json({
        message:
          'Modulet kan ikke slettes, da der er lektioner eller quizzer tilknyttet. Slet venligst disse først.',
      });
      return;
    }

    await prisma.module.delete({
      where: { id: Number(id) },
    });

    // Opdater rækkefølgen af de resterende moduler
    const remainingModules = await prisma.module.findMany({
      where: { courseId: existingModule.courseId },
      orderBy: { order: 'asc' },
    });

    const updates = remainingModules.map((module, index) => {
      return prisma.module.update({
        where: { id: module.id },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    res.status(200).json({ message: 'Modulet blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af modul med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af modulet' });
  }
};
