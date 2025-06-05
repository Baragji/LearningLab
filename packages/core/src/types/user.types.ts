// packages/core/src/types/user.types.ts

/**
 * Definerer de mulige roller en bruger kan have i systemet.
 * Disse matcher værdierne defineret i Prisma schemaet.
 */
export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
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

  // Nye felter til brugerprofildata
  profileImage?: string | null; // URL til profilbillede
  bio?: string | null; // Brugerens biografi eller beskrivelse
  socialLinks?: Record<string, string> | null; // Sociale links som et objekt (f.eks. {twitter: "url", linkedin: "url"})
  settings?: Record<string, unknown> | null; // Brugerindstillinger som et objekt

  // Brugergrupper
  groups?: UserGroup[] | null;

  createdAt: Date; // Tidspunkt for oprettelse af brugeren
  updatedAt: Date; // Tidspunkt for seneste opdatering af brugeren
  deletedAt?: Date | null; // Tidspunkt for soft delete af brugeren

  // passwordResetToken, passwordResetExpires og passwordHash er udeladt,
  // da de er backend-specifikke og ikke bør være en del af den delte kerne-type.
}

/**
 * Interface for en brugergruppe.
 */
export interface UserGroup {
  id: number;
  name: string;
  description?: string | null;
  permissions?: Record<string, unknown> | null;
  users?: User[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
