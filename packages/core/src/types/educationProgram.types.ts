/**
 * Core EducationProgram types for the LearningLab platform
 */

/**
 * Represents an education program
 */
export interface EducationProgram {
  id: number;
  title: string;
  description: string;
  slug: string;
  // Add other relevant fields for EducationProgram
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new education program
 */
export interface CreateEducationProgramInput {
  title: string;
  description: string;
  slug: string;
  // Add other relevant fields for creating an EducationProgram
}
