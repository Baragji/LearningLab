/**
 * Core quiz types for the LearningLab platform
 */

/**
 * Question types
 */
export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  FILL_IN_BLANK = "FILL_IN_BLANK",
  MATCHING = "MATCHING"
}

/**
 * User progress status
 */
export enum ProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

/**
 * Represents a quiz
 */
export interface Quiz {
  id: number;
  title: string;
  description: string;
  lessonId?: number | null;
  moduleId?: number | null;
  passingScore?: number;
  questions?: Question[];
  answerOptions?: Record<number, AnswerOption[]>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a question within a quiz
 */
export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  quizId: number;
  quiz?: Quiz;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents an answer option for a question
 */
export interface AnswerOption {
  id: number;
  text: string;
  isCorrect: boolean;
  questionId: number;
  question?: Question;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a quiz attempt by a user
 */
export interface QuizAttempt {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a user's answer to a question
 */
export interface UserAnswer {
  id: number;
  quizAttemptId: number;
  questionId: number;
  selectedAnswerOptionId?: number | null;
  inputText?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a user's progress in lessons and quizzes
 */
export interface UserProgress {
  id: number;
  userId: number;
  lessonId?: number | null;
  quizId?: number | null;
  status: ProgressStatus;
  score?: number | null;
  quizAttemptId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new quiz
 */
export interface CreateQuizInput {
  title: string;
  description: string;
  lessonId?: number;
  moduleId?: number;
}

/**
 * Input for creating a new question
 */
export interface CreateQuestionInput {
  text: string;
  type: QuestionType;
  quizId: number;
  answerOptions?: CreateAnswerOptionInput[];
}

/**
 * Input for creating a new answer option
 */
export interface CreateAnswerOptionInput {
  text: string;
  isCorrect: boolean;
  questionId?: number;
}

/**
 * Input for starting a quiz attempt
 */
export interface StartQuizAttemptInput {
  quizId: number;
}

/**
 * Input for submitting an answer
 */
export interface SubmitAnswerInput {
  quizAttemptId: number;
  questionId: number;
  selectedAnswerOptionId?: number;
  inputText?: string;
}

/**
 * Input for completing a quiz attempt
 */
export interface CompleteQuizAttemptInput {
  quizAttemptId: number;
}