// apps/api/src/controllers/dto/pensum/pensum.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectAreaDto } from '../subject-area/subject-area.dto';

/**
 * DTO for representing the complete curriculum structure
 */
export class PensumStructureDto {
  @ApiProperty({
    description:
      'Liste af alle fagområder med deres kurser, moduler og lektioner',
    type: [SubjectAreaDto],
  })
  subjectAreas: SubjectAreaDto[];
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
 * DTO for representing a subject within a course
 */
export class SubjectDto {
  @ApiProperty({
    description: 'Unik ID for faget',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Navn på faget',
    type: String,
    example: 'Biologi',
  })
  name: string;

  @ApiProperty({
    description: 'Beskrivelse af faget',
    type: String,
    example: 'Grundlæggende biologiske principper og teknikker',
  })
  description: string;

  @ApiProperty({
    description: 'Kursus ID som faget tilhører',
    type: Number,
    example: 1,
  })
  courseId: number;

  @ApiPropertyOptional({
    description: 'Emner tilknyttet dette fag',
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
  topics?: any[];
}

/**
 * DTO for representing a topic within a subject
 */
export class TopicDto {
  @ApiProperty({
    description: 'Unik ID for emnet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Titel på emnet',
    type: String,
    example: 'Bakteriepodning',
  })
  title: string;

  @ApiProperty({
    description: 'Beskrivelse af emnet',
    type: String,
    example: 'Teknikker til podning og dyrkning af bakterier',
  })
  description: string;

  @ApiProperty({
    description: 'Fag ID som emnet tilhører',
    type: Number,
    example: 1,
  })
  subjectId: number;

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
 * DTO for representing the complete curriculum structure with semesters
 */
export class CompletePensumStructureDto {
  @ApiProperty({
    description:
      'Liste af alle semestre med deres kurser, fag, emner og lektioner',
    type: [SemesterDto],
  })
  semesters: SemesterDto[];
}
