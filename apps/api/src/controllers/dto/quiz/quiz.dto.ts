// apps/api/src/controllers/dto/quiz/quiz.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsBoolean,
  Min,
  Max,
  IsArray,
  IsEnum,
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
    description: 'Tidsbegrænsning for quizzen i sekunder',
    type: Number,
    example: 600,
    nullable: true,
  })
  timeLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimalt antal forsøg tilladt for quizzen',
    type: Number,
    example: 3,
    nullable: true,
  })
  maxAttempts?: number | null;

  @ApiPropertyOptional({
    description: 'Om spørgsmålene skal vises i tilfældig rækkefølge',
    type: Boolean,
    example: false,
  })
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Om svarene skal vises efter quizzen er gennemført',
    type: Boolean,
    example: true,
  })
  showAnswers?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum score (i procent) for at bestå quizzen',
    type: Number,
    example: 70,
    nullable: true,
  })
  passingScore?: number | null;

  @ApiPropertyOptional({
    description: 'Om der skal udstedes et certifikat ved bestået quiz',
    type: Boolean,
    example: false,
  })
  issueCertificate?: boolean;

  @ApiPropertyOptional({
    description: 'Kategori for spørgsmålsbank',
    type: String,
    example: 'TypeScript',
    nullable: true,
  })
  questionBankCategory?: string | null;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af quizzen',
    type: [String],
    example: ['TypeScript', 'Programmering', 'Begynder'],
  })
  tags?: string[];

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

  @ApiPropertyOptional({
    description: 'Certifikater udstedt for denne quiz',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        score: { type: 'number', example: 85 },
        issueDate: {
          type: 'string',
          format: 'date-time',
          example: '2023-05-25T14:30:00Z',
        },
      },
    },
  })
  certificates?: any[];
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

  @ApiPropertyOptional({
    description: 'Tidsbegrænsning for quizzen i sekunder',
    type: Number,
    example: 600,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tidsbegrænsning skal være et tal' })
  @IsPositive({ message: 'Tidsbegrænsning skal være et positivt tal' })
  timeLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimalt antal forsøg tilladt for quizzen',
    type: Number,
    example: 3,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maksimalt antal forsøg skal være et tal' })
  @Min(1, { message: 'Maksimalt antal forsøg skal være mindst 1' })
  maxAttempts?: number | null;

  @ApiPropertyOptional({
    description: 'Om spørgsmålene skal vises i tilfældig rækkefølge',
    type: Boolean,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Tilfældig rækkefølge skal være en boolean værdi' })
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Om svarene skal vises efter quizzen er gennemført',
    type: Boolean,
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Vis svar skal være en boolean værdi' })
  showAnswers?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum score (i procent) for at bestå quizzen',
    type: Number,
    example: 70,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Beståelsesscore skal være et tal' })
  @Min(0, { message: 'Beståelsesscore skal være mindst 0' })
  @Max(100, { message: 'Beståelsesscore kan maksimalt være 100' })
  passingScore?: number | null;

  @ApiPropertyOptional({
    description: 'Om der skal udstedes et certifikat ved bestået quiz',
    type: Boolean,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Udsted certifikat skal være en boolean værdi' })
  issueCertificate?: boolean;

  @ApiPropertyOptional({
    description: 'Kategori for spørgsmålsbank',
    type: String,
    example: 'TypeScript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Kategori skal være en streng' })
  questionBankCategory?: string | null;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af quizzen',
    type: [String],
    example: ['TypeScript', 'Programmering', 'Begynder'],
    default: [],
  })
  @IsOptional()
  @IsArray({ message: 'Tags skal være et array' })
  @IsString({ each: true, message: 'Hvert tag skal være en streng' })
  tags?: string[];
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

  @ApiPropertyOptional({
    description: 'Tidsbegrænsning for quizzen i sekunder',
    type: Number,
    example: 600,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tidsbegrænsning skal være et tal' })
  @IsPositive({ message: 'Tidsbegrænsning skal være et positivt tal' })
  timeLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Maksimalt antal forsøg tilladt for quizzen',
    type: Number,
    example: 3,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maksimalt antal forsøg skal være et tal' })
  @Min(1, { message: 'Maksimalt antal forsøg skal være mindst 1' })
  maxAttempts?: number | null;

  @ApiPropertyOptional({
    description: 'Om spørgsmålene skal vises i tilfældig rækkefølge',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Tilfældig rækkefølge skal være en boolean værdi' })
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Om svarene skal vises efter quizzen er gennemført',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Vis svar skal være en boolean værdi' })
  showAnswers?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum score (i procent) for at bestå quizzen',
    type: Number,
    example: 70,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Beståelsesscore skal være et tal' })
  @Min(0, { message: 'Beståelsesscore skal være mindst 0' })
  @Max(100, { message: 'Beståelsesscore kan maksimalt være 100' })
  passingScore?: number | null;

  @ApiPropertyOptional({
    description: 'Om der skal udstedes et certifikat ved bestået quiz',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Udsted certifikat skal være en boolean værdi' })
  issueCertificate?: boolean;

  @ApiPropertyOptional({
    description: 'Kategori for spørgsmålsbank',
    type: String,
    example: 'TypeScript',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Kategori skal være en streng' })
  questionBankCategory?: string | null;

  @ApiPropertyOptional({
    description: 'Tags til kategorisering af quizzen',
    type: [String],
    example: ['TypeScript', 'Programmering', 'Avanceret'],
  })
  @IsOptional()
  @IsArray({ message: 'Tags skal være et array' })
  @IsString({ each: true, message: 'Hvert tag skal være en streng' })
  tags?: string[];
}
