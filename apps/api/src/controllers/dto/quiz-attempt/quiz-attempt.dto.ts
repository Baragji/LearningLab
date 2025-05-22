// apps/api/src/controllers/dto/quiz-attempt/quiz-attempt.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDate,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Tekstsvar (for åbne spørgsmål)',
    type: String,
    example: 'Mit svar på et åbent spørgsmål',
    nullable: true,
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Tekstsvar må ikke være tomt hvis angivet' })
  inputText?: string;
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
    description: 'Tekstsvar for åbne spørgsmål',
    type: String,
    example: 'Mit svar på et åbent spørgsmål',
    nullable: true,
  })
  inputText?: string | null;

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
