// packages/core/src/index.ts

/**
 * Dette er hoved-eksportfilen for @repo/core pakken.
 * Alle delte typer, interfaces, enums, og potentielt funktioner eller konstanter
 * bør eksporteres herfra, så de nemt kan importeres i andre pakker (apps/web, apps/api, etc.).
 */

export * from './types/user.types';
// Tilføj andre eksports her efterhånden som pakken vokser, f.eks.:
// export * from './types/course.types';
// export * from './utils/formatter.utils';
