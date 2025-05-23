// apps/api/src/controllers/dto/subject-area/subject-area.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsNumber,
  Min,
  IsEnum,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Dato for sletning af fagområdet (hvis slettet)',
    type: Date,
    example: null,
  })
  deletedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'ID på brugeren der oprettede fagområdet',
    type: Number,
    example: 1,
  })
  createdBy?: number | null;

  @ApiPropertyOptional({
    description: 'ID på brugeren der sidst opdaterede fagområdet',
    type: Number,
    example: 1,
  })
  updatedBy?: number | null;

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

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Samlet antal resultater',
    type: Number,
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Nuværende side',
    type: Number,
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Antal resultater per side',
    type: Number,
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Samlet antal sider',
    type: Number,
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Om der er en næste side',
    type: Boolean,
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Om der er en forrige side',
    type: Boolean,
    example: false,
  })
  hasPrevPage: boolean;
}

export class PaginatedSubjectAreaResponseDto {
  @ApiProperty({
    description: 'Liste af fagområder',
    type: [SubjectAreaDto],
  })
  data: SubjectAreaDto[];

  @ApiProperty({
    description: 'Metadata om paginering',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

export class FilterQueryDto {
  @ApiPropertyOptional({
    description: 'Sidenummer',
    type: Number,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Antal resultater per side',
    type: Number,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Felt der skal sorteres efter',
    type: String,
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sorteringsretning',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'JSON-streng med filtreringsparametre',
    type: String,
    example: '{"name": {"contains": "programmering"}}',
  })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional({
    description: 'Om kurser skal inkluderes i resultatet',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeCourses?: boolean = false;
}
