import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, Difficulty } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for generering af spørgsmål fra rå indhold
 */
export class GenerateQuestionsDto {
  @ApiProperty({ description: 'Indhold at generere spørgsmål fra' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Type af indhold',
    enum: ['lesson', 'topic', 'course'],
  })
  @IsString()
  contentType: 'lesson' | 'topic' | 'course';

  @ApiProperty({ description: 'ID på indholdet' })
  @IsString()
  contentId: string;

  @ApiPropertyOptional({
    description: 'Antal spørgsmål at generere',
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  numberOfQuestions?: number;

  @ApiPropertyOptional({
    description: 'Typer af spørgsmål at generere',
    enum: QuestionType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(QuestionType, { each: true })
  questionTypes?: QuestionType[];

  @ApiPropertyOptional({
    description: 'Målsværhedsgrad',
    enum: Difficulty,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  targetDifficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Fokusområder for spørgsmålene',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];
}

/**
 * DTO for generering af spørgsmål fra lesson/topic/course
 */
export class GenerateQuestionsOptionsDto {
  @ApiPropertyOptional({
    description: 'Antal spørgsmål at generere',
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  numberOfQuestions?: number;

  @ApiPropertyOptional({
    description: 'Typer af spørgsmål at generere',
    enum: QuestionType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(QuestionType, { each: true })
  questionTypes?: QuestionType[];

  @ApiPropertyOptional({
    description: 'Målsværhedsgrad',
    enum: Difficulty,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  targetDifficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Fokusområder for spørgsmålene',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];
}

/**
 * Response DTO for genererede spørgsmål
 */
export class GeneratedQuestionDto {
  @ApiProperty({ description: 'Spørgsmålstekst' })
  text: string;

  @ApiProperty({
    description: 'Type af spørgsmål',
    enum: QuestionType,
  })
  type: QuestionType;

  @ApiProperty({
    description: 'Sværhedsgrad',
    enum: Difficulty,
  })
  difficulty: Difficulty;

  @ApiProperty({
    description: 'Point for spørgsmålet',
    minimum: 1,
    maximum: 10,
  })
  points: number;

  @ApiPropertyOptional({
    description: 'Svarmuligheder (kun for MULTIPLE_CHOICE)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        isCorrect: { type: 'boolean' },
      },
    },
  })
  answerOptions?: {
    text: string;
    isCorrect: boolean;
  }[];

  @ApiPropertyOptional({
    description: 'Minimum antal ord for essay (kun for ESSAY)',
  })
  essayMinWords?: number;

  @ApiPropertyOptional({
    description: 'Maximum antal ord for essay (kun for ESSAY)',
  })
  essayMaxWords?: number;

  @ApiProperty({
    description: 'Kvalitetsscore (0-100)',
    minimum: 0,
    maximum: 100,
  })
  qualityScore: number;

  @ApiProperty({
    description: 'Forklaring på hvorfor spørgsmålet er relevant',
  })
  reasoning: string;
}

/**
 * Response DTO for spørgsmålsgenerering
 */
export class QuestionGenerationResponseDto {
  @ApiProperty({ description: 'Om genereringen lykkedes' })
  success: boolean;

  @ApiProperty({
    description: 'Genererede spørgsmål',
    type: [GeneratedQuestionDto],
  })
  questions: GeneratedQuestionDto[];

  @ApiProperty({ description: 'Antal genererede spørgsmål' })
  count: number;

  @ApiPropertyOptional({ description: 'Besked om genereringen' })
  message?: string;

  @ApiPropertyOptional({
    description: 'Metadata om genereringen',
    type: 'object',
  })
  metadata?: {
    contentType: string;
    contentId: string;
    processingTime?: number;
  };
}
