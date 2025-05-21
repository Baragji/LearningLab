// apps/api/src/quiz/dto/update-quiz-progress.dto.ts
import { IsInt, IsArray, IsDateString, IsNumber, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsInt()
  questionId: number;

  @IsInt()
  selectedOptionId: number;

  @IsBoolean()
  isCorrect: boolean;
}

export class UpdateQuizProgressDto {
  @IsInt()
  quizId: number;

  @IsNumber()
  score: number; // Percentage

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
