// apps/api/src/controllers/dto/quiz/question.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAnswerOptionDto } from './answerOption.dto';

export class QuestionDto {
  @ApiProperty({
    description: 'Unik ID for spørgsmålet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Spørgsmålets tekst',
    type: String,
    example: 'Hvad er TypeScript?',
  })
  text: string;

  @ApiProperty({
    description: 'Spørgsmålets type',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  type: QuestionType;

  @ApiProperty({
    description: 'ID for den quiz, spørgsmålet tilhører',
    type: Number,
    example: 1,
  })
  quizId: number;

  @ApiPropertyOptional({
    description: 'Skabelon-kode for CODE-type spørgsmål',
    type: String,
    example:
      'function add(a: number, b: number): number {\n  // Din kode her\n}',
    nullable: true,
  })
  codeTemplate?: string | null;

  @ApiPropertyOptional({
    description: 'Programmeringssprog for CODE-type spørgsmål',
    type: String,
    example: 'typescript',
    nullable: true,
  })
  codeLanguage?: string | null;

  @ApiPropertyOptional({
    description: 'Forventet output for CODE-type spørgsmål',
    type: String,
    example: '3',
    nullable: true,
  })
  expectedOutput?: string | null;

  @ApiPropertyOptional({
    description: 'Minimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 100,
    nullable: true,
  })
  essayMinWords?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 500,
    nullable: true,
  })
  essayMaxWords?: number | null;

  @ApiPropertyOptional({
    description: 'Elementer for DRAG_AND_DROP-type spørgsmål',
    type: 'object',
    example: {
      items: ['TypeScript', 'JavaScript', 'Python'],
      targets: ['Statisk typet', 'Dynamisk typet', 'Fortolket'],
      correctPairs: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    },
    nullable: true,
  })
  dragDropItems?: any | null;

  @ApiPropertyOptional({
    description: 'Point tildelt for korrekt svar',
    type: Number,
    example: 1,
  })
  points?: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af spørgsmålet',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af spørgsmålet',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Svarmuligheder for spørgsmålet',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        text: {
          type: 'string',
          example:
            'Et programmeringssprog der er en overbygning til JavaScript',
        },
        isCorrect: { type: 'boolean', example: true },
      },
    },
  })
  answerOptions?: any[];
}

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Spørgsmålets tekst',
    type: String,
    example: 'Hvad er TypeScript?',
  })
  @IsString({ message: 'Tekst skal være en streng' })
  @IsNotEmpty({ message: 'Tekst må ikke være tom' })
  text: string;

  @ApiProperty({
    description: 'Spørgsmålets type',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsEnum(QuestionType, { message: 'Type skal være en gyldig QuestionType' })
  type: QuestionType;

  @ApiProperty({
    description: 'ID for den quiz, spørgsmålet tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-ID skal være et positivt tal' })
  quizId: number;

  @ApiPropertyOptional({
    description: 'Skabelon-kode for CODE-type spørgsmål',
    type: String,
    example:
      'function add(a: number, b: number): number {\n  // Din kode her\n}',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Kodeskabelon skal være en streng' })
  codeTemplate?: string | null;

  @ApiPropertyOptional({
    description: 'Programmeringssprog for CODE-type spørgsmål',
    type: String,
    example: 'typescript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Programmeringssprog skal være en streng' })
  codeLanguage?: string | null;

  @ApiPropertyOptional({
    description: 'Forventet output for CODE-type spørgsmål',
    type: String,
    example: '3',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Forventet output skal være en streng' })
  expectedOutput?: string | null;

  @ApiPropertyOptional({
    description: 'Minimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum antal ord skal være et tal' })
  @Min(0, { message: 'Minimum antal ord skal være mindst 0' })
  essayMinWords?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 500,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maksimum antal ord skal være et tal' })
  @Min(1, { message: 'Maksimum antal ord skal være mindst 1' })
  essayMaxWords?: number | null;

  @ApiPropertyOptional({
    description: 'Elementer for DRAG_AND_DROP-type spørgsmål',
    type: 'object',
    example: {
      items: ['TypeScript', 'JavaScript', 'Python'],
      targets: ['Statisk typet', 'Dynamisk typet', 'Fortolket'],
      correctPairs: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    },
    nullable: true,
  })
  @IsOptional()
  dragDropItems?: any | null;

  @ApiPropertyOptional({
    description: 'Point tildelt for korrekt svar',
    type: Number,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Point skal være et tal' })
  @Min(1, { message: 'Point skal være mindst 1' })
  points?: number;

  @ApiPropertyOptional({
    description: 'Svarmuligheder for spørgsmålet',
    type: [CreateAnswerOptionDto],
    example: [
      {
        text: 'Et programmeringssprog der er en overbygning til JavaScript',
        isCorrect: true,
      },
      {
        text: 'Et operativsystem',
        isCorrect: false,
      },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Svarmuligheder skal være et array' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerOptionDto)
  answerOptions?: CreateAnswerOptionDto[];
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'Spørgsmålets tekst',
    type: String,
    example: 'Hvad er TypeScript? (Opdateret)',
  })
  @IsOptional()
  @IsString({ message: 'Tekst skal være en streng' })
  @IsNotEmpty({ message: 'Tekst må ikke være tom hvis angivet' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Spørgsmålets type',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsOptional()
  @IsEnum(QuestionType, { message: 'Type skal være en gyldig QuestionType' })
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Skabelon-kode for CODE-type spørgsmål',
    type: String,
    example:
      'function add(a: number, b: number): number {\n  // Din kode her\n}',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Kodeskabelon skal være en streng' })
  codeTemplate?: string | null;

  @ApiPropertyOptional({
    description: 'Programmeringssprog for CODE-type spørgsmål',
    type: String,
    example: 'typescript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Programmeringssprog skal være en streng' })
  codeLanguage?: string | null;

  @ApiPropertyOptional({
    description: 'Forventet output for CODE-type spørgsmål',
    type: String,
    example: '3',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Forventet output skal være en streng' })
  expectedOutput?: string | null;

  @ApiPropertyOptional({
    description: 'Minimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum antal ord skal være et tal' })
  @Min(0, { message: 'Minimum antal ord skal være mindst 0' })
  essayMinWords?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 500,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maksimum antal ord skal være et tal' })
  @Min(1, { message: 'Maksimum antal ord skal være mindst 1' })
  essayMaxWords?: number | null;

  @ApiPropertyOptional({
    description: 'Elementer for DRAG_AND_DROP-type spørgsmål',
    type: 'object',
    example: {
      items: ['TypeScript', 'JavaScript', 'Python'],
      targets: ['Statisk typet', 'Dynamisk typet', 'Fortolket'],
      correctPairs: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    },
    nullable: true,
  })
  @IsOptional()
  dragDropItems?: any | null;

  @ApiPropertyOptional({
    description: 'Point tildelt for korrekt svar',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Point skal være et tal' })
  @Min(1, { message: 'Point skal være mindst 1' })
  points?: number;
}
