// apps/api/src/controllers/course.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateCourseInput } from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle kurser
 */
export const getAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        subjectArea: true,
      },
      orderBy: { title: 'asc' },
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error('Fejl ved hentning af kurser:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af kurser' });
  }
};

/**
 * Henter kurser for et specifikt fagområde
 */
export const getCoursesBySubjectArea = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { subjectAreaId } = req.params;

  try {
    const courses = await prisma.course.findMany({
      where: { subjectAreaId: Number(subjectAreaId) },
      orderBy: { title: 'asc' },
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error(
      `Fejl ved hentning af kurser for fagområde ${subjectAreaId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af kurser' });
  }
};

/**
 * Henter et specifikt kursus ud fra ID
 */
export const getCourseById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        subjectArea: true,
        modules: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(`Fejl ved hentning af kursus med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af kurset' });
  }
};

/**
 * Henter et specifikt kursus ud fra slug
 */
export const getCourseBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { slug } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        subjectArea: true,
        modules: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(`Fejl ved hentning af kursus med slug ${slug}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af kurset' });
  }
};

/**
 * Opretter et nyt kursus
 */
export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, slug, subjectAreaId }: CreateCourseInput =
    req.body;

  try {
    // Tjek om fagområdet eksisterer
    const subjectArea = await prisma.subjectArea.findUnique({
      where: { id: subjectAreaId },
    });

    if (!subjectArea) {
      res.status(404).json({ message: 'Det angivne fagområde findes ikke' });
      return;
    }

    // Tjek om slug allerede eksisterer
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      res
        .status(400)
        .json({ message: 'Et kursus med dette slug eksisterer allerede' });
      return;
    }

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        slug,
        subjectAreaId,
      },
    });

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Fejl ved oprettelse af kursus:', error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved oprettelse af kurset' });
  }
};

/**
 * Opdaterer et eksisterende kursus
 */
export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { title, description, slug, subjectAreaId } = req.body;

  try {
    // Tjek om kurset eksisterer
    const existingCourse = await prisma.course.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCourse) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    // Hvis subjectAreaId ændres, tjek om det nye fagområde eksisterer
    if (subjectAreaId && subjectAreaId !== existingCourse.subjectAreaId) {
      const subjectArea = await prisma.subjectArea.findUnique({
        where: { id: subjectAreaId },
      });

      if (!subjectArea) {
        res.status(404).json({ message: 'Det angivne fagområde findes ikke' });
        return;
      }
    }

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingCourse.slug) {
      const slugExists = await prisma.course.findUnique({
        where: { slug },
      });

      if (slugExists) {
        res
          .status(400)
          .json({ message: 'Et kursus med dette slug eksisterer allerede' });
        return;
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        title: title || existingCourse.title,
        description: description || existingCourse.description,
        slug: slug || existingCourse.slug,
        subjectAreaId: subjectAreaId || existingCourse.subjectAreaId,
      },
    });

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error(`Fejl ved opdatering af kursus med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved opdatering af kurset' });
  }
};

/**
 * Sletter et kursus
 */
export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // Tjek om kurset eksisterer
    const existingCourse = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: { modules: true },
    });

    if (!existingCourse) {
      res.status(404).json({ message: 'Kurset blev ikke fundet' });
      return;
    }

    // Tjek om der er moduler tilknyttet kurset
    if (existingCourse.modules.length > 0) {
      res.status(400).json({
        message:
          'Kurset kan ikke slettes, da der er moduler tilknyttet. Slet venligst modulerne først.',
      });
      return;
    }

    await prisma.course.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Kurset blev slettet' });
  } catch (error) {
    console.error(`Fejl ved sletning af kursus med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved sletning af kurset' });
  }
};
