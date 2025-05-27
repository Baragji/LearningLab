// apps/api/src/controllers/dto/question-bank/question-bank.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';
import { QuestionType, Difficulty } from '@prisma/client';

export class QuestionBankDto {
  @ApiProperty({
    description: 'Unik ID for spørgsmålsbanken',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Spørgsmålsbankens navn',
    type: String,
    example: 'TypeScript Spørgsmålsbank',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Spørgsmålsbankens beskrivelse',
    type: String,
    example: 'En samling af spørgsmål om TypeScript',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Spørgsmålsbankens kategori',
    type: String,
    example: 'Programmering',
  })
  category: string;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af spørgsmålsbanken',
    type: [String],
    example: ['TypeScript', 'JavaScript', 'Programmering'],
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af spørgsmålsbanken',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af spørgsmålsbanken',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Spørgsmål i spørgsmålsbanken',
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
}

export class QuestionBankItemDto {
  @ApiProperty({
    description: 'Unik ID for spørgsmålet i banken',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for spørgsmålsbanken',
    type: Number,
    example: 1,
  })
  questionBankId: number;

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

  @ApiProperty({
    description: 'Spørgsmålets sværhedsgrad',
    enum: Difficulty,
    example: Difficulty.BEGINNER,
  })
  difficulty: Difficulty;

  @ApiPropertyOptional({
    description: 'Svarmuligheder for spørgsmålet',
    type: 'object',
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
    nullable: true,
  })
  answerOptions?: any | null;

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
}

export class CreateQuestionBankDto {
  @ApiProperty({
    description: 'Spørgsmålsbankens navn',
    type: String,
    example: 'TypeScript Spørgsmålsbank',
  })
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tom' })
  name: string;

  @ApiPropertyOptional({
    description: 'Spørgsmålsbankens beskrivelse',
    type: String,
    example: 'En samling af spørgsmål om TypeScript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  description?: string | null;

  @ApiProperty({
    description: 'Spørgsmålsbankens kategori',
    type: String,
    example: 'Programmering',
  })
  @IsString({ message: 'Kategori skal være en streng' })
  @IsNotEmpty({ message: 'Kategori må ikke være tom' })
  category: string;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af spørgsmålsbanken',
    type: [String],
    example: ['TypeScript', 'JavaScript', 'Programmering'],
    default: [],
  })
  @IsOptional()
  @IsArray({ message: 'Tags skal være et array' })
  @IsString({ each: true, message: 'Hvert tag skal være en streng' })
  tags?: string[];
}

export class CreateQuestionBankItemDto {
  @ApiProperty({
    description: 'ID for spørgsmålsbanken',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Spørgsmålsbank-ID skal være et tal' })
  @IsPositive({ message: 'Spørgsmålsbank-ID skal være et positivt tal' })
  questionBankId: number;

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

  @ApiProperty({
    description: 'Spørgsmålets sværhedsgrad',
    enum: Difficulty,
    example: Difficulty.BEGINNER,
    default: Difficulty.BEGINNER,
  })
  @IsEnum(Difficulty, {
    message: 'Sværhedsgrad skal være en gyldig Difficulty',
  })
  difficulty: Difficulty;

  @ApiPropertyOptional({
    description: 'Svarmuligheder for spørgsmålet',
    type: 'object',
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
    nullable: true,
  })
  @IsOptional()
  answerOptions?: any | null;
}

export class UpdateQuestionBankDto {
  @ApiPropertyOptional({
    description: 'Spørgsmålsbankens navn',
    type: String,
    example: 'TypeScript Spørgsmålsbank - Opdateret',
  })
  @IsOptional()
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tom hvis angivet' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Spørgsmålsbankens beskrivelse',
    type: String,
    example: 'En opdateret samling af spørgsmål om TypeScript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Spørgsmålsbankens kategori',
    type: String,
    example: 'Programmering',
  })
  @IsOptional()
  @IsString({ message: 'Kategori skal være en streng' })
  @IsNotEmpty({ message: 'Kategori må ikke være tom hvis angivet' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af spørgsmålsbanken',
    type: [String],
    example: ['TypeScript', 'JavaScript', 'Programmering', 'Avanceret'],
  })
  @IsOptional()
  @IsArray({ message: 'Tags skal være et array' })
  @IsString({ each: true, message: 'Hvert tag skal være en streng' })
  tags?: string[];
}

export class UpdateQuestionBankItemDto {
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
      'function add(a: number, b: number): number {\n  // Din opdaterede kode her\n}',
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
    example: '5',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Forventet output skal være en streng' })
  expectedOutput?: string | null;

  @ApiPropertyOptional({
    description: 'Minimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 150,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum antal ord skal være et tal' })
  @Min(0, { message: 'Minimum antal ord skal være mindst 0' })
  essayMinWords?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimum antal ord for ESSAY-type spørgsmål',
    type: Number,
    example: 600,
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
      items: ['TypeScript', 'JavaScript', 'Python', 'Java'],
      targets: ['Statisk typet', 'Dynamisk typet', 'Fortolket', 'Kompileret'],
      correctPairs: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ],
    },
    nullable: true,
  })
  @IsOptional()
  dragDropItems?: any | null;

  @ApiPropertyOptional({
    description: 'Point tildelt for korrekt svar',
    type: Number,
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Point skal være et tal' })
  @Min(1, { message: 'Point skal være mindst 1' })
  points?: number;

  @ApiPropertyOptional({
    description: 'Spørgsmålets sværhedsgrad',
    enum: Difficulty,
    example: Difficulty.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(Difficulty, {
    message: 'Sværhedsgrad skal være en gyldig Difficulty',
  })
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Svarmuligheder for spørgsmålet',
    type: 'object',
    example: [
      {
        text: 'Et programmeringssprog der er en overbygning til JavaScript med statisk typning',
        isCorrect: true,
      },
      {
        text: 'Et operativsystem',
        isCorrect: false,
      },
      {
        text: 'En database',
        isCorrect: false,
      },
    ],
    nullable: true,
  })
  @IsOptional()
  answerOptions?: any | null;
}
