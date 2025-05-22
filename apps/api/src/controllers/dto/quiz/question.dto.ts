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
}
