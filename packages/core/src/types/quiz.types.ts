/**
 * Core quiz types for the LearningLab platform
 */

/**
 * Question types
 */
export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  FILL_IN_BLANK = "FILL_IN_BLANK",
  MATCHING = "MATCHING",
  DRAG_AND_DROP = "DRAG_AND_DROP",
  CODE = "CODE",
  ESSAY = "ESSAY"
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
  timeLimit?: number | null;
  maxAttempts?: number | null;
  randomizeQuestions: boolean;
  showAnswers: boolean;
  passingScore?: number | null;
  issueCertificate: boolean;
  questionBankCategory?: string | null;
  tags: string[];
  questions?: Question[];
  answerOptions?: Record<number, AnswerOption[]>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
  codeTemplate?: string | null;
  codeLanguage?: string | null;
  expectedOutput?: string | null;
  essayMinWords?: number | null;
  essayMaxWords?: number | null;
  dragDropItems?: Record<string, unknown> | null;
  points: number;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
  codeAnswer?: string | null;
  dragDropAnswer?: Record<string, unknown> | null;
  isCorrect?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
  timeLimit?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  showAnswers?: boolean;
  passingScore?: number;
  issueCertificate?: boolean;
  questionBankCategory?: string;
  tags?: string[];
}

/**
 * Input for creating a new question
 */
export interface CreateQuestionInput {
  text: string;
  type: QuestionType;
  quizId: number;
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  dragDropItems?: Record<string, unknown>;
  points?: number;
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
  codeAnswer?: string;
  dragDropAnswer?: Record<string, unknown>;
}

/**
 * Input for completing a quiz attempt
 */
export interface CompleteQuizAttemptInput {
  quizAttemptId: number;
}

/**
 * Input for creating a question bank
 */
export interface CreateQuestionBankInput {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
}

/**
 * Input for creating a question bank item
 */
export interface CreateQuestionBankItemInput {
  questionBankId: number;
  text: string;
  type: QuestionType;
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  dragDropItems?: Record<string, unknown>;
  points?: number;
  difficulty?: string;
  answerOptions?: Record<string, unknown>;
}

/**
 * Input for importing questions from CSV/Excel
 */
export interface ImportQuestionsInput {
  questionBankId: number;
  fileContent: string;
  fileType: 'csv' | 'excel';
}

/**
 * Input for adding questions from question bank to a quiz
 */
export interface AddQuestionsFromBankInput {
  quizId: number;
  questionBankItemIds: number[];
}

/**
 * Represents a quiz result with detailed information
 */
export interface QuizResult {
  id: number;
  userId: number;
  quizId: number;
  quiz?: Quiz;
  score: number;
  passed: boolean;
  answers: Array<{
    questionId: number;
    question?: Question;
    selectedOptionId: number;
    selectedOption?: AnswerOption;
    isCorrect: boolean;
  }>;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a question bank
 */
export interface QuestionBank {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  tags: string[];
  questions?: QuestionBankItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Represents a question in a question bank
 */
export interface QuestionBankItem {
  id: number;
  questionBankId: number;
  text: string;
  type: QuestionType;
  codeTemplate?: string | null;
  codeLanguage?: string | null;
  expectedOutput?: string | null;
  essayMinWords?: number | null;
  essayMaxWords?: number | null;
  dragDropItems?: Record<string, unknown> | null;
  points: number;
  difficulty: string;
  answerOptions?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Represents a certificate issued to a user
 */
export interface Certificate {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  issueDate: Date;
  certificateId: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}