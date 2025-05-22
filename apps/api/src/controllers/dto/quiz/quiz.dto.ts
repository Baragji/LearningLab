// apps/api/src/controllers/dto/quiz/quiz.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class QuizDto {
  @ApiProperty({
    description: 'Unik ID for quizzen',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Quizzens titel',
    type: String,
    example: 'TypeScript Grundbegreber Quiz',
  })
  title: string;

  @ApiProperty({
    description: 'Quizzens beskrivelse',
    type: String,
    example: 'Test din viden om grundlæggende TypeScript-koncepter',
  })
  description: string;

  @ApiPropertyOptional({
    description:
      'ID for den lektion, quizzen tilhører (hvis tilknyttet en lektion)',
    type: Number,
    example: 1,
    nullable: true,
  })
  lessonId?: number | null;

  @ApiPropertyOptional({
    description:
      'ID for det modul, quizzen tilhører (hvis tilknyttet et modul)',
    type: Number,
    example: 1,
    nullable: true,
  })
  moduleId?: number | null;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af quizzen',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af quizzen',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Spørgsmål i quizzen',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        text: { type: 'string', example: 'Hvad er TypeScript?' },
        type: { type: 'string', example: 'MULTIPLE_CHOICE' },
      },
    },
  })
  questions?: any[];

  @ApiPropertyOptional({
    description: 'Lektionen som quizzen tilhører',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'Introduktion til TypeScript' },
    },
    nullable: true,
  })
  lesson?: any | null;

  @ApiPropertyOptional({
    description: 'Modulet som quizzen tilhører',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'TypeScript Grundkursus' },
    },
    nullable: true,
  })
  module?: any | null;
}

export class CreateQuizDto {
  @ApiProperty({
    description: 'Quizzens titel',
    type: String,
    example: 'TypeScript Grundbegreber Quiz',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  title: string;

  @ApiProperty({
    description: 'Quizzens beskrivelse',
    type: String,
    example: 'Test din viden om grundlæggende TypeScript-koncepter',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  description: string;

  @ApiPropertyOptional({
    description:
      'ID for den lektion, quizzen tilhører (hvis tilknyttet en lektion)',
    type: Number,
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Lektion-ID skal være et tal' })
  @IsPositive({ message: 'Lektion-ID skal være et positivt tal' })
  lessonId?: number | null;

  @ApiPropertyOptional({
    description:
      'ID for det modul, quizzen tilhører (hvis tilknyttet et modul)',
    type: Number,
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Modul-ID skal være et tal' })
  @IsPositive({ message: 'Modul-ID skal være et positivt tal' })
  moduleId?: number | null;
}

export class UpdateQuizDto {
  @ApiPropertyOptional({
    description: 'Quizzens titel',
    type: String,
    example: 'TypeScript Grundbegreber Quiz - Opdateret',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Quizzens beskrivelse',
    type: String,
    example:
      'Opdateret test af din viden om grundlæggende TypeScript-koncepter',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  description?: string;

  @ApiPropertyOptional({
    description:
      'ID for den lektion, quizzen tilhører (hvis tilknyttet en lektion)',
    type: Number,
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Lektion-ID skal være et tal' })
  @IsPositive({ message: 'Lektion-ID skal være et positivt tal' })
  lessonId?: number | null;

  @ApiPropertyOptional({
    description:
      'ID for det modul, quizzen tilhører (hvis tilknyttet et modul)',
    type: Number,
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Modul-ID skal være et tal' })
  @IsPositive({ message: 'Modul-ID skal være et positivt tal' })
  moduleId?: number | null;
}
