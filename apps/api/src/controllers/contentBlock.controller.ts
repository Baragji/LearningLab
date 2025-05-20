// apps/api/src/controllers/contentBlock.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, ContentBlockType } from '@prisma/client';
import { CreateContentBlockInput } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle indholdsblokke for en specifik lektion
 */
export const getContentBlocksByLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { lessonId } = req.params;

  try {
    const contentBlocks = await prisma.contentBlock.findMany({
      where: { lessonId: Number(lessonId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(contentBlocks);
  } catch (error) {
    console.error(
      `Fejl ved hentning af indholdsblokke for lektion ${lessonId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af indholdsblokke' });
  }
};

/**
 * Henter en specifik indholdsblok ud fra ID
 */
export const getContentBlockById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const contentBlock = await prisma.contentBlock.findUnique({
      where: { id: Number(id) },
      include: {
        lesson: true,
      },
    });

    if (!contentBlock) {
      res.status(404).json({ message: 'Indholdsblokken blev ikke fundet' });
      return;
    }

    res.status(200).json(contentBlock);
  } catch (error) {
    console.error(`Fejl ved hentning af indholdsblok med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af indholdsblokken' });
  }
};

/**
 * Opretter en ny indholdsblok
 */
export const createContentBlock = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { type, content, order, lessonId }: CreateContentBlockInput = req.body;

  try {
    // Tjek om lektionen eksisterer
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Den angivne lektion findes ikke' });
      return;
    }

    // Valider indholdstypen
    if (!Object.values(ContentBlockType).includes(type as ContentBlockType)) {
      res.status(400).json({ message: 'Ugyldig indholdstype' });
      return;
    }

    // Hvis der ikke er angivet en rækkefølge, sæt den til at være efter den sidste indholdsblok
    let blockOrder = order;
    if (blockOrder === undefined) {
      const lastBlock = await prisma.contentBlock.findFirst({
        where: { lessonId },
        orderBy: { order: 'desc' },
      });

      blockOrder = lastBlock ? lastBlock.order + 1 : 1;
    }

    const newContentBlock = await prisma.contentBlock.create({
      data: {
        type: type as ContentBlockType,
        content,
        order: blockOrder,
        lessonId,
      },
    });

    res.status(201).json(newContentBlock);
  } catch (error) {
    console.error('Fejl ved oprettelse af indholdsblok:', error);
    res.status(500).json({
      message: 'Der opstod en fejl ved oprettelse af indholdsblokken',
    });
  }
};

/**
 * Opdaterer en eksisterende indholdsblok
 */
export const updateContentBlock = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { type, content, order, lessonId } = req.body;

  try {
    // Tjek om indholdsblokken eksisterer
    const existingContentBlock = await prisma.contentBlock.findUnique({
      where: { id: Number(id) },
    });

    if (!existingContentBlock) {
      res.status(404).json({ message: 'Indholdsblokken blev ikke fundet' });
      return;
    }

    // Hvis lessonId ændres, tjek om den nye lektion eksisterer
    if (lessonId && lessonId !== existingContentBlock.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        res.status(404).json({ message: 'Den angivne lektion findes ikke' });
        return;
      }
    }

    // Valider indholdstypen hvis den ændres
    if (type && type !== existingContentBlock.type) {
      if (!Object.values(ContentBlockType).includes(type as ContentBlockType)) {
        res.status(400).json({ message: 'Ugyldig indholdstype' });
        return;
      }
    }

    const updatedContentBlock = await prisma.contentBlock.update({
      where: { id: Number(id) },
      data: {
        type: type ? (type as ContentBlockType) : existingContentBlock.type,
        content: content || existingContentBlock.content,
        order: order !== undefined ? order : existingContentBlock.order,
        lessonId: lessonId || existingContentBlock.lessonId,
      },
    });

    res.status(200).json(updatedContentBlock);
  } catch (error) {
    console.error(`Fejl ved opdatering af indholdsblok med id ${id}:`, error);
    res.status(500).json({
      message: 'Der opstod en fejl ved opdatering af indholdsblokken',
    });
  }
};

/**
 * Opdaterer rækkefølgen af indholdsblokke i en lektion
 */
export const updateContentBlocksOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { lessonId } = req.params;
  const { contentBlockIds } = req.body;

  if (!Array.isArray(contentBlockIds)) {
    res.status(400).json({
      message: "contentBlockIds skal være et array af indholdsblok-ID'er",
    });
    return;
  }

  try {
    // Tjek om lektionen eksisterer
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(lessonId) },
      include: { contentBlocks: true },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Lektionen blev ikke fundet' });
      return;
    }

    // Tjek om alle indholdsblokke tilhører lektionen
    const lessonContentBlockIds = lesson.contentBlocks.map((block) => block.id);
    const allBlocksExist = contentBlockIds.every((id) =>
      lessonContentBlockIds.includes(Number(id)),
    );

    if (!allBlocksExist) {
      res.status(400).json({
        message:
          'En eller flere indholdsblokke tilhører ikke den angivne lektion',
      });
      return;
    }

    // Opdater rækkefølgen af indholdsblokke
    const updates = contentBlockIds.map((blockId, index) => {
      return prisma.contentBlock.update({
        where: { id: Number(blockId) },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    const updatedContentBlocks = await prisma.contentBlock.findMany({
      where: { lessonId: Number(lessonId) },
      orderBy: { order: 'asc' },
    });

    res.status(200).json(updatedContentBlocks);
  } catch (error) {
    console.error(
      `Fejl ved opdatering af indholdsblokrækkefølge for lektion ${lessonId}:`,
      error,
    );
    res.status(500).json({
      message: 'Der opstod en fejl ved opdatering af indholdsblokrækkefølgen',
    });
  }
};

/**
 * Sletter en indholdsblok
 */
export const deleteContentBlock = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om indholdsblokken eksisterer
    const existingContentBlock = await prisma.contentBlock.findUnique({
      where: { id: Number(id) },
    });

    if (!existingContentBlock) {
      res.status(404).json({ message: 'Indholdsblokken blev ikke fundet' });
      return;
    }

    await prisma.contentBlock.delete({
      where: { id: Number(id) },
    });

    // Opdater rækkefølgen af de resterende indholdsblokke
    const remainingBlocks = await prisma.contentBlock.findMany({
      where: { lessonId: existingContentBlock.lessonId },
      orderBy: { order: 'asc' },
    });

    const updates = remainingBlocks.map((block, index) => {
      return prisma.contentBlock.update({
        where: { id: block.id },
        data: { order: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    res.status(200).json({ message: 'Indholdsblokken blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af indholdsblok med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af indholdsblokken' });
  }
};
