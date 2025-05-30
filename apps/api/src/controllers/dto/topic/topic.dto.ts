// apps/api/src/controllers/dto/topic/topic.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested, // Added for nested DTO validation
} from 'class-validator';
import { Type } from 'class-transformer'; // Added for nested DTO transformation
import { LessonDto } from '../lesson/lesson.dto'; // Assuming path, adjust if needed
import { QuizDto } from '../quiz/quiz.dto'; // Assuming path, adjust if needed

export class TopicDto { // Updated class name
  @ApiProperty({
    description: 'Unik ID for topicet', // Updated description
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Topicets titel', // Updated description
    type: String,
    example: 'Introduktion til TypeScript',
  })
  title: string;

  @ApiProperty({
    description: 'Topicets beskrivelse', // Updated description
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  description: string;

  @ApiProperty({
    description: 'Topicets rækkefølge i kurset', // Updated description
    type: Number,
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'ID for det kursus, topicet tilhører', // Updated description
    type: Number,
    example: 1,
  })
  courseId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af topicet', // Updated description
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af topicet', // Updated description
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Liste af lektioner tilknyttet topicet',
    type: () => [LessonDto], // Updated type
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons?: LessonDto[];

  @ApiPropertyOptional({
    description: 'Liste af quizzes tilknyttet topicet',
    type: () => [QuizDto], // Updated type
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuizDto)
  quizzes?: QuizDto[];
}

export class CreateTopicDto { // Updated class name
  @ApiProperty({
    description: 'Topicets titel', // Updated description
    type: String,
    example: 'Introduktion til TypeScript',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  title: string;

  @ApiProperty({
    description: 'Topicets beskrivelse', // Updated description
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  description: string;

  @ApiPropertyOptional({
    description:
      'Topicets rækkefølge i kurset (valgfri, auto-genereres hvis ikke angivet)', // Updated description
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiProperty({
    description: 'ID for det kursus, topicet tilhører', // Updated description
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId: number;
}

export class UpdateTopicDto { // Updated class name
  @ApiPropertyOptional({
    description: 'Topicets titel', // Updated description
    type: String,
    example: 'Introduktion til TypeScript',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Topicets beskrivelse', // Updated description
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Topicets rækkefølge i kurset', // Updated description
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiPropertyOptional({
    description: 'ID for det kursus, topicet tilhører', // Updated description
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId?: number;
}

export class UpdateTopicsOrderDto { // Updated class name
  @ApiProperty({
    description: "Array af topic-ID'er i den ønskede rækkefølge", // Updated description
    type: [Number],
    example: [3, 1, 2],
  })
  @IsNotEmpty({ message: 'topicIds må ikke være tom' }) // Updated message
  topicIds: number[]; // Updated property name
}
