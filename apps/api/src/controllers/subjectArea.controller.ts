// apps/api/src/controllers/subjectArea.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateSubjectAreaInput } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle fagområder
 */
export const getAllSubjectAreas = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const subjectAreas = await prisma.subjectArea.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json(subjectAreas);
  } catch (error) {
    console.error('Fejl ved hentning af fagområder:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fagområder' });
  }
};

/**
 * Henter et specifikt fagområde ud fra ID
 */
export const getSubjectAreaById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const subjectArea = await prisma.subjectArea.findUnique({
      where: { id: Number(id) },
      include: { courses: true },
    });

    if (!subjectArea) {
      res.status(404).json({ message: 'Fagområdet blev ikke fundet' });
      return;
    }

    res.status(200).json(subjectArea);
  } catch (error) {
    console.error(`Fejl ved hentning af fagområde med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fagområdet' });
  }
};

/**
 * Henter et specifikt fagområde ud fra slug
 */
export const getSubjectAreaBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { slug } = req.params;

  try {
    const subjectArea = await prisma.subjectArea.findUnique({
      where: { slug },
      include: { courses: true },
    });

    if (!subjectArea) {
      res.status(404).json({ message: 'Fagområdet blev ikke fundet' });
      return;
    }

    res.status(200).json(subjectArea);
  } catch (error) {
    console.error(`Fejl ved hentning af fagområde med slug ${slug}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af fagområdet' });
  }
};

/**
 * Opretter et nyt fagområde
 */
export const createSubjectArea = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, slug }: CreateSubjectAreaInput = req.body;

  try {
    // Tjek om slug allerede eksisterer
    const existingSubjectArea = await prisma.subjectArea.findUnique({
      where: { slug },
    });

    if (existingSubjectArea) {
      res
        .status(400)
        .json({ message: 'Et fagområde med dette slug eksisterer allerede' });
      return;
    }

    const newSubjectArea = await prisma.subjectArea.create({
      data: {
        name,
        slug,
      },
    });

    res.status(201).json(newSubjectArea);
  } catch (error) {
    console.error('Fejl ved oprettelse af fagområde:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af fagområdet' });
  }
};

/**
 * Opdaterer et eksisterende fagområde
 */
export const updateSubjectArea = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { name, slug } = req.body;

  try {
    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await prisma.subjectArea.findUnique({
      where: { id: Number(id) },
    });

    if (!existingSubjectArea) {
      res.status(404).json({ message: 'Fagområdet blev ikke fundet' });
      return;
    }

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingSubjectArea.slug) {
      const slugExists = await prisma.subjectArea.findUnique({
        where: { slug },
      });

      if (slugExists) {
        res
          .status(400)
          .json({ message: 'Et fagområde med dette slug eksisterer allerede' });
        return;
      }
    }

    const updatedSubjectArea = await prisma.subjectArea.update({
      where: { id: Number(id) },
      data: {
        name: name || existingSubjectArea.name,
        slug: slug || existingSubjectArea.slug,
      },
    });

    res.status(200).json(updatedSubjectArea);
  } catch (error) {
    console.error(`Fejl ved opdatering af fagområde med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af fagområdet' });
  }
};

/**
 * Sletter et fagområde
 */
export const deleteSubjectArea = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await prisma.subjectArea.findUnique({
      where: { id: Number(id) },
      include: { courses: true },
    });

    if (!existingSubjectArea) {
      res.status(404).json({ message: 'Fagområdet blev ikke fundet' });
      return;
    }

    // Tjek om der er kurser tilknyttet fagområdet
    if (existingSubjectArea.courses.length > 0) {
      res.status(400).json({
        message:
          'Fagområdet kan ikke slettes, da der er kurser tilknyttet. Slet venligst kurserne først.',
      });
      return;
    }

    await prisma.subjectArea.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Fagområdet blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af fagområde med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af fagområdet' });
  }
};
