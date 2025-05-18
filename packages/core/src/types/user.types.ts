// packages/core/src/types/user.types.ts

/**
 * Definerer de mulige roller en bruger kan have i systemet.
 * Disse matcher værdierne defineret i Prisma schemaet.
 */
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Interface for en bruger.
 * Dette er en ren data-kontrakt og indeholder ikke backend-specifikke felter som passwordHash.
 * Den er beregnet til at blive brugt på tværs af frontend og backend for type-sikkerhed.
 */
export interface User {
  id: number;
  email: string;
  name?: string | null; // Navn er valgfrit og kan være null
  role: Role;
  createdAt: Date; // Tidspunkt for oprettelse af brugeren
  updatedAt: Date; // Tidspunkt for seneste opdatering af brugeren
  // passwordResetToken, passwordResetExpires og passwordHash er udeladt,
  // da de er backend-specifikke og ikke bør være en del af den delte kerne-type.
}
