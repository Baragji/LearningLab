// apps/api/src/controllers/dto/lesson/lesson.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class LessonDto {
  @ApiProperty({
    description: 'Unik ID for lektionen',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Lektionens titel',
    type: String,
    example: 'Introduktion til TypeScript typer',
  })
  title: string;

  @ApiProperty({
    description: 'Lektionens beskrivelse',
    type: String,
    example: 'Lær om de grundlæggende typer i TypeScript og hvordan de bruges',
  })
  description: string;

  @ApiProperty({
    description: 'Lektionens rækkefølge i emnet',
    type: Number,
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'ID for det emne, lektionen tilhører',
    type: Number,
    example: 1,
  })
  topicId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af lektionen',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af lektionen',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Indholdsblokke tilknyttet lektionen',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        type: { type: 'string', example: 'TEXT' },
        content: {
          type: 'string',
          example: 'Dette er en tekstblok med indhold',
        },
        order: { type: 'number', example: 1 },
      },
    },
  })
  contentBlocks?: any[];

  @ApiPropertyOptional({
    description: 'Quizzer tilknyttet lektionen',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'TypeScript Quiz' },
        description: {
          type: 'string',
          example: 'Test din viden om TypeScript',
        },
      },
    },
  })
  quizzes?: any[];

  @ApiPropertyOptional({
    description: 'Emnet som lektionen tilhører',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'TypeScript Grundkursus' },
      description: { type: 'string', example: 'Lær grundlæggende TypeScript' },
    },
  })
  topic?: any;
}

export class CreateLessonDto {
  @ApiProperty({
    description: 'Lektionens titel',
    type: String,
    example: 'Introduktion til TypeScript typer',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  title: string;

  @ApiProperty({
    description: 'Lektionens beskrivelse',
    type: String,
    example: 'Lær om de grundlæggende typer i TypeScript og hvordan de bruges',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  description: string;

  @ApiPropertyOptional({
    description:
      'Lektionens rækkefølge i emnet (valgfri, auto-genereres hvis ikke angivet)',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiProperty({
    description: 'ID for det emne, lektionen tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Emne-ID skal være et tal' })
  @IsPositive({ message: 'Emne-ID skal være et positivt tal' })
  topicId: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({
    description: 'Lektionens titel',
    type: String,
    example: 'Introduktion til TypeScript typer',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Lektionens beskrivelse',
    type: String,
    example: 'Lær om de grundlæggende typer i TypeScript og hvordan de bruges',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Lektionens rækkefølge i emnet',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiPropertyOptional({
    description: 'ID for det emne, lektionen tilhører',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Emne-ID skal være et tal' })
  @IsPositive({ message: 'Emne-ID skal være et positivt tal' })
  topicId?: number;
}

export class UpdateLessonsOrderDto {
  @ApiProperty({
    description: "Array af lektion-ID'er i den ønskede rækkefølge",
    type: [Number],
    example: [3, 1, 2],
  })
  @IsNotEmpty({ message: 'lessonIds må ikke være tom' })
  lessonIds: number[];
}
