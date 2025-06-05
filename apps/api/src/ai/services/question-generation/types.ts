import { QuestionType, Difficulty } from '@prisma/client';

/**
 * Analyse af indhold for at forstå emner og kompleksitet
 */
export interface ContentAnalysis {
  mainTopics: string[];
  keyTerms: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'text' | 'code' | 'mixed';
  estimatedReadingTime: number;
}

/**
 * Genereret spørgsmål med metadata
 */
export interface GeneratedQuestion {
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  points: number;
  answerOptions?: AnswerOption[];
  codeTemplate?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  dragDropItems?: any;
  matchingPairs?: { left: string; right: string }[]; // For MATCHING type
  qualityScore: number;
  reasoning: string;
}

/**
 * Svarmulighed for multiple choice spørgsmål
 */
export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Request for spørgsmålsgenerering
 */
export interface QuestionGenerationRequest {
  content: string;
  contentType: 'lesson' | 'topic' | 'course';
  contentId: string;
  targetDifficulty?: Difficulty;
  questionTypes?: QuestionType[];
  numberOfQuestions?: number;
  focusAreas?: string[];
}

/**
 * AI prompt response format
 */
export interface AIQuestionResponse {
  text: string;
  type: string;
  difficulty: string;
  points?: number;
  answerOptions?: AnswerOption[];
  essayMinWords?: number;
  essayMaxWords?: number;
  reasoning?: string;
}

/**
 * Kvalitetsscore kriterier
 */
export interface QualityScoreCriteria {
  textLengthScore: number;
  questionFormatScore: number;
  answerOptionsScore: number;
  essayRequirementsScore: number;
  reasoningScore: number;
}
