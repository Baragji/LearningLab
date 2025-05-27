// apps/api/src/controllers/dto/quiz-attempt/quiz-attempt.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  // IsDate,
  // IsInt,
  // Min,
  // Max,
} from 'class-validator';
// import { Type } from 'class-transformer';

export class QuizAttemptDto {
  @ApiProperty({
    description: 'Unik ID for quiz-forsøget',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for brugeren der har taget quizzen',
    type: Number,
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'ID for den quiz der er taget',
    type: Number,
    example: 1,
  })
  quizId: number;

  @ApiProperty({
    description: 'Score opnået i quizzen (0-100)',
    type: Number,
    example: 85,
  })
  score: number;

  @ApiProperty({
    description: 'Tidspunkt for start af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Tidspunkt for afslutning af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:15:00Z',
    nullable: true,
  })
  completedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Quiz som forsøget tilhører',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'TypeScript Grundbegreber Quiz' },
      description: {
        type: 'string',
        example: 'Test din viden om grundlæggende TypeScript-koncepter',
      },
    },
  })
  quiz?: any;

  @ApiPropertyOptional({
    description: 'Brugerens svar på spørgsmål i quizzen',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        questionId: { type: 'number', example: 1 },
        selectedAnswerOptionId: { type: 'number', example: 2, nullable: true },
        inputText: {
          type: 'string',
          example: 'Mit svar på et åbent spørgsmål',
          nullable: true,
        },
      },
    },
  })
  userAnswers?: any[];
}

export class CreateQuizAttemptDto {
  @ApiProperty({
    description: 'ID for den quiz der skal tages',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-ID skal være et positivt tal' })
  quizId: number;
}

export class SubmitQuizAnswerDto {
  @ApiProperty({
    description: 'ID for quiz-forsøget',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-forsøg-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-forsøg-ID skal være et positivt tal' })
  quizAttemptId: number;

  @ApiProperty({
    description: 'ID for spørgsmålet der besvares',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Spørgsmål-ID skal være et tal' })
  @IsPositive({ message: 'Spørgsmål-ID skal være et positivt tal' })
  questionId: number;

  @ApiPropertyOptional({
    description:
      'ID for den valgte svarmulighed (for multiple choice spørgsmål)',
    type: Number,
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Svarmulighed-ID skal være et tal' })
  @IsPositive({ message: 'Svarmulighed-ID skal være et positivt tal' })
  selectedAnswerOptionId?: number;

  @ApiPropertyOptional({
    description: 'Tekstsvar (for FILL_IN_BLANK og ESSAY spørgsmål)',
    type: String,
    example: 'Mit svar på et åbent spørgsmål',
    nullable: true,
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Tekstsvar må ikke være tomt hvis angivet' })
  inputText?: string;

  @ApiPropertyOptional({
    description: 'Kodesvar (for CODE spørgsmål)',
    type: String,
    example: 'function add(a, b) { return a + b; }',
    nullable: true,
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Kodesvar må ikke være tomt hvis angivet' })
  codeAnswer?: string;

  @ApiPropertyOptional({
    description: 'Drag-and-drop svar (for DRAG_AND_DROP spørgsmål)',
    type: 'object',
    example: {
      pairs: [
        [0, 2],
        [1, 0],
        [2, 1],
      ],
    },
    nullable: true,
  })
  @IsOptional()
  dragDropAnswer?: any;
}

export class CompleteQuizAttemptDto {
  @ApiProperty({
    description: 'ID for quiz-forsøget der skal afsluttes',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-forsøg-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-forsøg-ID skal være et positivt tal' })
  quizAttemptId: number;
}

export class QuizAttemptResultDto {
  @ApiProperty({
    description: 'Unik ID for quiz-forsøget',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for brugeren der har taget quizzen',
    type: Number,
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'ID for den quiz der er taget',
    type: Number,
    example: 1,
  })
  quizId: number;

  @ApiProperty({
    description: 'Score opnået i quizzen (0-100)',
    type: Number,
    example: 85,
  })
  score: number;

  @ApiProperty({
    description: 'Tidspunkt for start af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  startedAt: Date;

  @ApiProperty({
    description: 'Tidspunkt for afslutning af quiz-forsøget',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  completedAt: Date;

  @ApiProperty({
    description: 'Samlet antal spørgsmål i quizzen',
    type: Number,
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Antal korrekte svar',
    type: Number,
    example: 8,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Procentvis score (0-100)',
    type: Number,
    example: 80,
  })
  percentageScore: number;

  @ApiPropertyOptional({
    description: 'Om quizzen er bestået',
    type: Boolean,
    example: true,
  })
  passed?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum score (i procent) for at bestå quizzen',
    type: Number,
    example: 70,
    nullable: true,
  })
  passingScore?: number | null;

  @ApiPropertyOptional({
    description: 'Certifikat udstedt for denne quiz',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      certificateId: { type: 'string', example: 'CERT-12345-ABCDE' },
      issueDate: {
        type: 'string',
        format: 'date-time',
        example: '2023-05-20T12:15:00Z',
      },
      title: { type: 'string', example: 'TypeScript Grundkursus Certifikat' },
    },
    nullable: true,
  })
  certificate?: any | null;

  @ApiPropertyOptional({
    description: 'Detaljeret feedback for hvert spørgsmål',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        questionId: { type: 'number', example: 1 },
        questionText: { type: 'string', example: 'Hvad er TypeScript?' },
        isCorrect: { type: 'boolean', example: true },
        score: { type: 'number', example: 1 },
        feedback: {
          type: 'string',
          example: 'Korrekt! TypeScript er en overbygning til JavaScript.',
        },
      },
    },
  })
  questionFeedback?: any[];
}

export class UserAnswerDto {
  @ApiProperty({
    description: 'Unik ID for brugerens svar',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for quiz-forsøget',
    type: Number,
    example: 1,
  })
  quizAttemptId: number;

  @ApiProperty({
    description: 'ID for spørgsmålet',
    type: Number,
    example: 1,
  })
  questionId: number;

  @ApiPropertyOptional({
    description: 'ID for den valgte svarmulighed',
    type: Number,
    example: 2,
    nullable: true,
  })
  selectedAnswerOptionId?: number | null;

  @ApiPropertyOptional({
    description: 'Tekstsvar for FILL_IN_BLANK og ESSAY spørgsmål',
    type: String,
    example: 'Mit svar på et åbent spørgsmål',
    nullable: true,
  })
  inputText?: string | null;

  @ApiPropertyOptional({
    description: 'Kodesvar for CODE spørgsmål',
    type: String,
    example: 'function add(a, b) { return a + b; }',
    nullable: true,
  })
  codeAnswer?: string | null;

  @ApiPropertyOptional({
    description: 'Drag-and-drop svar for DRAG_AND_DROP spørgsmål',
    type: 'object',
    example: {
      pairs: [
        [0, 2],
        [1, 0],
        [2, 1],
      ],
    },
    nullable: true,
  })
  dragDropAnswer?: any | null;

  @ApiPropertyOptional({
    description: 'Om svaret er korrekt',
    type: Boolean,
    example: true,
    nullable: true,
  })
  isCorrect?: boolean | null;

  @ApiPropertyOptional({
    description: 'Score for dette svar (for delvis kredit)',
    type: Number,
    example: 0.5,
    nullable: true,
  })
  score?: number | null;

  @ApiPropertyOptional({
    description: 'Feedback for dette svar',
    type: String,
    example: 'Godt forsøg, men ikke helt korrekt. Prøv at overveje...',
    nullable: true,
  })
  feedback?: string | null;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af svaret',
    type: Date,
    example: '2023-05-20T12:05:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af svaret',
    type: Date,
    example: '2023-05-20T12:05:00Z',
  })
  updatedAt?: Date;
}
