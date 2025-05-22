// apps/api/src/controllers/dto/user-progress/user-progress.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ProgressStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UserProgressDto {
  @ApiProperty({
    description: 'Unik ID for fremskridtsregistreringen',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for brugeren',
    type: Number,
    example: 1,
  })
  userId: number;

  @ApiPropertyOptional({
    description: 'ID for lektionen (hvis fremskridtet er for en lektion)',
    type: Number,
    example: 1,
    nullable: true,
  })
  lessonId?: number | null;

  @ApiPropertyOptional({
    description: 'ID for quizzen (hvis fremskridtet er for en quiz)',
    type: Number,
    example: 1,
    nullable: true,
  })
  quizId?: number | null;

  @ApiPropertyOptional({
    description: 'ID for quiz-forsøget (hvis fremskridtet er for en quiz)',
    type: Number,
    example: 1,
    nullable: true,
  })
  quizAttemptId?: number | null;

  @ApiProperty({
    description: 'Status for fremskridtet',
    enum: ProgressStatus,
    example: ProgressStatus.COMPLETED,
  })
  status: ProgressStatus;

  @ApiPropertyOptional({
    description: 'Score opnået (for quizzer, 0-100)',
    type: Number,
    example: 85,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  score?: number | null;

  @ApiProperty({
    description: 'Dato for oprettelse af fremskridtsregistreringen',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dato for seneste opdatering af fremskridtsregistreringen',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Lektion som fremskridtet tilhører',
    type: 'object',
    nullable: true,
  })
  lesson?: any;

  @ApiPropertyOptional({
    description: 'Quiz som fremskridtet tilhører',
    type: 'object',
    nullable: true,
  })
  quiz?: any;

  @ApiPropertyOptional({
    description: 'Quiz-forsøg som fremskridtet tilhører',
    type: 'object',
    nullable: true,
  })
  quizAttempt?: any;
}

export class UpdateLessonProgressDto {
  @ApiProperty({
    description: 'Status for fremskridtet',
    enum: ProgressStatus,
    example: ProgressStatus.COMPLETED,
  })
  @IsEnum(ProgressStatus, {
    message: 'Status skal være en gyldig ProgressStatus',
  })
  status: ProgressStatus;
}

export class UpdateQuizProgressDto {
  @ApiProperty({
    description: 'ID for quizzen',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-ID skal være et positivt tal' })
  quizId: number;

  @ApiProperty({
    description: 'Score opnået (0-100)',
    type: Number,
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Score skal være et tal' })
  @Min(0, { message: 'Score skal være mindst 0' })
  @Max(100, { message: 'Score kan højst være 100' })
  score: number;

  @ApiPropertyOptional({
    description: 'Tidspunkt for afslutning af quizzen',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Brugerens svar på quiz-spørgsmål',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        questionId: { type: 'number', example: 1 },
        selectedOptionId: { type: 'number', example: 2 },
      },
    },
  })
  @IsOptional()
  answers?: Array<{
    questionId: number;
    selectedOptionId: number;
  }>;
}

export class CourseProgressDto {
  @ApiProperty({
    description: 'ID for kurset',
    type: Number,
    example: 1,
  })
  courseId: number;

  @ApiProperty({
    description: 'Samlet antal elementer i kurset (lektioner + quizzer)',
    type: Number,
    example: 20,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Antal gennemførte elementer',
    type: Number,
    example: 15,
  })
  completedItems: number;

  @ApiProperty({
    description: 'Antal elementer i gang',
    type: Number,
    example: 3,
  })
  inProgressItems: number;

  @ApiProperty({
    description: 'Procentvis gennemførelse (0-100)',
    type: Number,
    example: 75,
  })
  percentageComplete: number;

  @ApiProperty({
    description: 'Samlet status for kurset',
    enum: ProgressStatus,
    example: ProgressStatus.IN_PROGRESS,
  })
  status: ProgressStatus;

  @ApiPropertyOptional({
    description: 'Detaljeret fremskridt for alle elementer i kurset',
    type: [UserProgressDto],
  })
  detailedProgress?: UserProgressDto[];
}
