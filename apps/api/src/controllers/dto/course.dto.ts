// apps/api/src/controllers/dto/course.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({
    description: 'Unik ID for kurset',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Kursets titel',
    type: String,
    example: 'Introduktion til NestJS',
  })
  title: string;

  @ApiProperty({
    description: 'Kursets beskrivelse',
    type: String,
    example: 'Lær grundlæggende NestJS-koncepter og -mønstre',
  })
  description: string;

  @ApiProperty({
    description: 'Kursets URL-venlige slug',
    type: String,
    example: 'intro-til-nestjs',
  })
  slug: string;

  @ApiProperty({
    description: 'ID for det fagområde, kurset tilhører',
    type: Number,
    example: 1,
  })
  subjectAreaId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af kurset',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af kurset',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;
}

export class CreateCourseDto {
  @ApiProperty({
    description: 'Kursets titel',
    type: String,
    example: 'Introduktion til NestJS',
  })
  title: string;

  @ApiProperty({
    description: 'Kursets beskrivelse',
    type: String,
    example: 'Lær grundlæggende NestJS-koncepter og -mønstre',
  })
  description: string;

  @ApiProperty({
    description: 'Kursets URL-venlige slug',
    type: String,
    example: 'intro-til-nestjs',
  })
  slug: string;

  @ApiProperty({
    description: 'ID for det fagområde, kurset tilhører',
    type: Number,
    example: 1,
  })
  subjectAreaId: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Kursets titel',
    type: String,
    example: 'Introduktion til NestJS',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Kursets beskrivelse',
    type: String,
    example: 'Lær grundlæggende NestJS-koncepter og -mønstre',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Kursets URL-venlige slug',
    type: String,
    example: 'intro-til-nestjs',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID for det fagområde, kurset tilhører',
    type: Number,
    example: 1,
  })
  subjectAreaId?: number;
}
