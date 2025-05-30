// apps/api/src/controllers/dto/pensum/pensum.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EducationProgramDto } from '../education-program/education-program.dto';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for representing the complete curriculum structure
 */
export class PensumStructureDto {
  @ApiProperty({
    description:
      'Liste af alle uddannelsesprogrammer med deres kurser, emner og lektioner',
    type: [EducationProgramDto],
  })
  @IsArray({ message: 'educationPrograms skal være et array' })
  @ValidateNested({ each: true })
  @Type(() => EducationProgramDto)
  educationPrograms: EducationProgramDto[];
}

/**
 * DTO for representing a semester in the curriculum
 */
export class SemesterDto {
  @ApiProperty({
    description: 'Unik ID for semesteret',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Navn på semesteret',
    type: String,
    example: '1. semester',
  })
  name: string;

  @ApiProperty({
    description: 'Beskrivelse af semesteret',
    type: String,
    example: 'Introduktion til grundlæggende laboratorieteknikker',
  })
  description: string;

  @ApiProperty({
    description: 'Semesterets nummer i uddannelsen',
    type: Number,
    example: 1,
  })
  number: number;

  @ApiPropertyOptional({
    description: 'Kurser tilknyttet dette semester',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Introduktion til analyseteknik' },
        description: {
          type: 'string',
          example:
            'Grundlæggende introduktion til analyseteknikker i laboratoriet',
        },
      },
    },
  })
  courses?: any[];
}

/**
 * DTO for creating a new semester
 */
export class CreateSemesterDto {
  @ApiProperty({
    description: 'Navn på semesteret',
    type: String,
    example: '1. semester',
  })
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tomt' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name: string;

  @ApiProperty({
    description: 'Beskrivelse af semesteret',
    type: String,
    example: 'Introduktion til grundlæggende laboratorieteknikker',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description: string;

  @ApiProperty({
    description: 'Semesterets nummer i uddannelsen',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Nummer skal være et tal' })
  @IsPositive({ message: 'Nummer skal være et positivt tal' })
  number: number;
}

/**
 * DTO for updating a semester
 */
export class UpdateSemesterDto {
  @ApiPropertyOptional({
    description: 'Navn på semesteret',
    type: String,
    example: '1. semester',
  })
  @IsOptional()
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tomt hvis angivet' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Beskrivelse af semesteret',
    type: String,
    example: 'Introduktion til grundlæggende laboratorieteknikker',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Semesterets nummer i uddannelsen',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Nummer skal være et tal' })
  @IsPositive({ message: 'Nummer skal være et positivt tal' })
  number?: number;
}

/**
 * DTO for representing a topic within a course (in pensum context)
 */
export class PensumTopicDto {
  @ApiProperty({
    description: 'Unik ID for lektionen (i pensum)',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Navn på emnet (i pensum)',
    type: String,
    example: 'Biologi',
  })
  name: string;

  @ApiProperty({
    description: 'Beskrivelse af lektionen (i pensum)',
    type: String,
    example: 'Grundlæggende biologiske principper og teknikker',
  })
  description: string;

  @ApiProperty({
    description: 'Kursus ID som emnet (i pensum) tilhører',
    type: Number,
    example: 1,
  })
  courseId: number;

  @ApiPropertyOptional({
    description: 'Lektioner tilknyttet dette emne (i pensum)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Bakteriepodning' },
        description: {
          type: 'string',
          example: 'Teknikker til podning og dyrkning af bakterier',
        },
      },
    },
  })
  lessons?: any[];
}

/**
 * DTO for creating a new pensum topic
 */
export class CreatePensumTopicDto {
  @ApiProperty({
    description: 'Navn på emnet (i pensum)',
    type: String,
    example: 'Biologi',
  })
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tomt' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name: string;

  @ApiProperty({
    description: 'Beskrivelse af lektionen (i pensum)',
    type: String,
    example: 'Grundlæggende biologiske principper og teknikker',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description: string;

  @ApiProperty({
    description: 'Kursus ID som emnet (i pensum) tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId: number;
}

/**
 * DTO for updating a pensum topic
 */
export class UpdatePensumTopicDto {
  @ApiPropertyOptional({
    description: 'Navn på emnet (i pensum)',
    type: String,
    example: 'Biologi',
  })
  @IsOptional()
  @IsString({ message: 'Navn skal være en streng' })
  @IsNotEmpty({ message: 'Navn må ikke være tomt hvis angivet' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Beskrivelse af lektionen (i pensum)',
    type: String,
    example: 'Grundlæggende biologiske principper og teknikker',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Kursus ID som emnet (i pensum) tilhører',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId?: number;
}

/**
 * DTO for representing a lesson within a pensum topic
 */
export class LessonDto {
  @ApiProperty({
    description: 'Unik ID for lektionen',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Titel på lektionen',
    type: String,
    example: 'Bakteriepodning',
  })
  title: string;

  @ApiProperty({
    description: 'Beskrivelse af lektionen',
    type: String,
    example: 'Teknikker til podning og dyrkning af bakterier',
  })
  description: string;

  @ApiProperty({
    description: 'Emne (i pensum) ID som lektionen tilhører',
    type: Number,
    example: 1,
  })
  pensumTopicId: number;

  @ApiPropertyOptional({
    description: 'Lektioner tilknyttet dette emne',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Introduktion til bakteriepodning' },
        description: {
          type: 'string',
          example: 'Grundlæggende principper for bakteriepodning',
        },
      },
    },
  })
  lessons?: any[];
}

/**
 * DTO for creating a new lesson
 */
export class CreateLessonDto {
  @ApiProperty({
    description: 'Titel på lektionen',
    type: String,
    example: 'Bakteriepodning',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  @MaxLength(100, { message: 'Titel må højst være 100 tegn' })
  title: string;

  @ApiProperty({
    description: 'Beskrivelse af lektionen',
    type: String,
    example: 'Teknikker til podning og dyrkning af bakterier',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description: string;

  @ApiProperty({
    description: 'Emne (i pensum) ID som lektionen tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Emne (i pensum) ID skal være et tal' })
  @IsPositive({ message: 'Emne (i pensum) ID skal være et positivt tal' })
  pensumTopicId: number;
}

/**
 * DTO for updating a lesson
 */
export class UpdateLessonDto {
  @ApiPropertyOptional({
    description: 'Titel på lektionen',
    type: String,
    example: 'Bakteriepodning',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  @MaxLength(100, { message: 'Titel må højst være 100 tegn' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Beskrivelse af lektionen',
    type: String,
    example: 'Teknikker til podning og dyrkning af bakterier',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  @MinLength(10, { message: 'Beskrivelse skal være mindst 10 tegn' })
  @MaxLength(2000, { message: 'Beskrivelse må højst være 2000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Emne (i pensum) ID som lektionen tilhører',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Emne (i pensum) ID skal være et tal' })
  @IsPositive({ message: 'Emne (i pensum) ID skal være et positivt tal' })
  pensumTopicId?: number;
}

/**
 * DTO for representing the complete curriculum structure with semesters
 */
export class CompletePensumStructureDto {
  @ApiProperty({
    description:
      'Liste af alle semestre med deres kurser, fag, emner og lektioner',
    type: [SemesterDto],
  })
  @IsArray({ message: 'semesters skal være et array' })
  @ValidateNested({ each: true })
  @Type(() => SemesterDto)
  semesters: SemesterDto[];
}
