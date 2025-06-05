// packages/core/src/index.ts

/**
 * Dette er hoved-eksportfilen for @repo/core pakken.
 * Alle delte typer, interfaces, enums, og potentielt funktioner eller konstanter
 * bør eksporteres herfra, så de nemt kan importeres i andre pakker (apps/web, apps/api, etc.).
 */

// User types
export * from "./types/user.types";

// Pensum types
export * from "./types/pensum.types";

// Quiz types
export * from "./types/quiz.types";

// EducationProgram types
export * from "./types/educationProgram.types";

// Utility functions
export * from "./utils/validation";
