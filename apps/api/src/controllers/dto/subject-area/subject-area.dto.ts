// apps/api/src/controllers/dto/subject-area/subject-area.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class SubjectAreaDto {
  @ApiProperty({
    description: 'Unik ID for fagområdet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Navn på fagområdet',
    type: String,
    example: 'Programmering',
  })
  name: string;

  @ApiProperty({
    description: 'URL-venligt slug for fagområdet',
    type: String,
    example: 'programmering',
  })
  slug: string;

  @ApiProperty({
    description: 'Dato for oprettelse af fagområdet',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dato for seneste opdatering af fagområdet',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Kurser tilknyttet dette fagområde',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Introduktion til TypeScript' },
        description: {
          type: 'string',
          example: 'Lær grundlæggende TypeScript',
        },
        slug: { type: 'string', example: 'intro-til-typescript' },
      },
    },
  })
  courses?: any[];
}

export class CreateSubjectAreaDto {
  @ApiProperty({
    description: 'Navn på fagområdet',
    type: String,
    example: 'Programmering',
  })
  @IsNotEmpty({ message: 'Navn må ikke være tomt' })
  @IsString({ message: 'Navn skal være en tekststreng' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name: string;

  @ApiProperty({
    description: 'URL-venligt slug for fagområdet',
    type: String,
    example: 'programmering',
  })
  @IsNotEmpty({ message: 'Slug må ikke være tomt' })
  @IsString({ message: 'Slug skal være en tekststreng' })
  @MaxLength(100, { message: 'Slug må højst være 100 tegn' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug må kun indeholde små bogstaver, tal og bindestreger',
  })
  slug: string;
}

export class UpdateSubjectAreaDto {
  @ApiPropertyOptional({
    description: 'Navn på fagområdet',
    type: String,
    example: 'Programmering',
  })
  @IsOptional()
  @IsString({ message: 'Navn skal være en tekststreng' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-venligt slug for fagområdet',
    type: String,
    example: 'programmering',
  })
  @IsOptional()
  @IsString({ message: 'Slug skal være en tekststreng' })
  @MaxLength(100, { message: 'Slug må højst være 100 tegn' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug må kun indeholde små bogstaver, tal og bindestreger',
  })
  slug?: string;
}

export class SubjectAreaResponseDto {
  @ApiProperty({
    description: 'Besked om resultatet af operationen',
    type: String,
    example: 'Fagområdet blev slettet',
  })
  message: string;
}
