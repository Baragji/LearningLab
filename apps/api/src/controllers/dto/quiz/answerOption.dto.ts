// apps/api/src/controllers/dto/quiz/answerOption.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnswerOptionDto {
  @ApiProperty({
    description: 'Unik ID for svarmuligheden',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Svarmuligheden tekst',
    type: String,
    example: 'Et programmeringssprog der er en overbygning til JavaScript',
  })
  text: string;

  @ApiProperty({
    description: 'Angiver om svarmuligheden er korrekt',
    type: Boolean,
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'ID for det spørgsmål, svarmuligheden tilhører',
    type: Number,
    example: 1,
  })
  questionId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af svarmuligheden',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af svarmuligheden',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;
}

export class CreateAnswerOptionDto {
  @ApiProperty({
    description: 'Svarmuligheden tekst',
    type: String,
    example: 'Et programmeringssprog der er en overbygning til JavaScript',
  })
  @IsString({ message: 'Tekst skal være en streng' })
  @IsNotEmpty({ message: 'Tekst må ikke være tom' })
  text: string;

  @ApiProperty({
    description: 'Angiver om svarmuligheden er korrekt',
    type: Boolean,
    example: true,
  })
  @IsBoolean({ message: 'isCorrect skal være en boolean' })
  isCorrect: boolean;
}

export class UpdateAnswerOptionDto {
  @ApiPropertyOptional({
    description: 'Svarmuligheden tekst',
    type: String,
    example:
      'Et programmeringssprog der er en overbygning til JavaScript (Opdateret)',
  })
  @IsOptional()
  @IsString({ message: 'Tekst skal være en streng' })
  @IsNotEmpty({ message: 'Tekst må ikke være tom hvis angivet' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Angiver om svarmuligheden er korrekt',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isCorrect skal være en boolean' })
  isCorrect?: boolean;
}
