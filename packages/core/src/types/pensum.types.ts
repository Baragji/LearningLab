/**
 * Core pensum types for the LearningLab platform
 */

/**
 * Represents a subject area or content context
 */
export interface SubjectArea {
  id: number;
  name: string;
  slug: string; // f.eks. "template-arabic", "lab-tech"
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a course within a subject area
 */
export interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  subjectAreaId: number;
  subjectArea?: SubjectArea;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a module within a course
 */
export interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  courseId: number;
  course?: Course;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a lesson within a module
 */
export interface Lesson {
  id: number;
  title: string;
  description: string;
  order: number;
  moduleId: number;
  module?: Module;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content block types
 */
export enum ContentBlockType {
  TEXT = "TEXT",
  IMAGE_URL = "IMAGE_URL",
  VIDEO_URL = "VIDEO_URL",
  QUIZ_REF = "QUIZ_REF"
}

/**
 * Represents a content block within a lesson
 */
export interface ContentBlock {
  id: number;
  type: ContentBlockType;
  content: string;
  order: number;
  lessonId: number;
  lesson?: Lesson;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new subject area
 */
export interface CreateSubjectAreaInput {
  name: string;
  slug: string;
}

/**
 * Input for creating a new course
 */
export interface CreateCourseInput {
  title: string;
  description: string;
  slug: string;
  subjectAreaId: number;
}

/**
 * Input for creating a new module
 */
export interface CreateModuleInput {
  title: string;
  description: string;
  order: number;
  courseId: number;
}

/**
 * Input for creating a new lesson
 */
export interface CreateLessonInput {
  title: string;
  description: string;
  order: number;
  moduleId: number;
}

/**
 * Input for creating a new content block
 */
export interface CreateContentBlockInput {
  type: ContentBlockType;
  content: string;
  order: number;
  lessonId: number;
}