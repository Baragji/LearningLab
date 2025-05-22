// apps/api/src/controllers/dto/course.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  @MinLength(3, { message: 'Titel skal være mindst 3 tegn' })
  @MaxLength(100, { message: 'Titel må højst være 100 tegn' })
  title: string;

  @ApiProperty({
    description: 'Kursets beskrivelse',
    type: String,
    example: 'Lær grundlæggende NestJS-koncepter og -mønstre',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description: string;

  @ApiProperty({
    description: 'Kursets URL-venlige slug',
    type: String,
    example: 'intro-til-nestjs',
  })
  @IsString({ message: 'Slug skal være en streng' })
  @IsNotEmpty({ message: 'Slug må ikke være tom' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug må kun indeholde små bogstaver, tal og bindestreger, og må ikke starte eller slutte med en bindestreg',
  })
  @MinLength(3, { message: 'Slug skal være mindst 3 tegn' })
  @MaxLength(100, { message: 'Slug må højst være 100 tegn' })
  slug: string;

  @ApiProperty({
    description: 'ID for det fagområde, kurset tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Fagområde-ID skal være et tal' })
  @IsPositive({ message: 'Fagområde-ID skal være et positivt tal' })
  @Type(() => Number)
  subjectAreaId: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Kursets titel',
    type: String,
    example: 'Introduktion til NestJS',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  @MinLength(3, { message: 'Titel skal være mindst 3 tegn' })
  @MaxLength(100, { message: 'Titel må højst være 100 tegn' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Kursets beskrivelse',
    type: String,
    example: 'Lær grundlæggende NestJS-koncepter og -mønstre',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Kursets URL-venlige slug',
    type: String,
    example: 'intro-til-nestjs',
  })
  @IsOptional()
  @IsString({ message: 'Slug skal være en streng' })
  @IsNotEmpty({ message: 'Slug må ikke være tom hvis angivet' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug må kun indeholde små bogstaver, tal og bindestreger, og må ikke starte eller slutte med en bindestreg',
  })
  @MinLength(3, { message: 'Slug skal være mindst 3 tegn' })
  @MaxLength(100, { message: 'Slug må højst være 100 tegn' })
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID for det fagområde, kurset tilhører',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fagområde-ID skal være et tal' })
  @IsPositive({ message: 'Fagområde-ID skal være et positivt tal' })
  @Type(() => Number)
  subjectAreaId?: number;
}
