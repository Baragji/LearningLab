// apps/api/src/controllers/dto/education-program/education-program.dto.ts
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
  IsBoolean,
} from 'class-validator';

export class EducationProgramDto {
  @ApiProperty({
    description: 'Unik ID for uddannelsesprogrammet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Navn på uddannelsesprogrammet',
    type: String,
    example: 'Programmering',
  })
  name: string;

  @ApiProperty({
    description: 'URL-venligt slug for uddannelsesprogrammet',
    type: String,
    example: 'programmering',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Beskrivelse af uddannelsesprogrammet',
    type: String,
    example: 'Lær at programmere i forskellige sprog og teknologier',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for uddannelsesprogrammet',
    type: [String],
    example: ['programmering', 'kode', 'udvikling'],
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Kategorier for fagområdet',
    type: [String],
    example: ['teknologi', 'it', 'software'],
  })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'URL til fagområdets billede',
    type: String,
    example: 'https://example.com/images/programming.jpg',
  })
  image?: string;

  @ApiPropertyOptional({
    description: 'URL til fagområdets banner',
    type: String,
    example: 'https://example.com/images/programming-banner.jpg',
  })
  banner?: string;

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
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['typescript', 'javascript', 'programmering'],
        },
        difficulty: {
          type: 'string',
          enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
          example: 'BEGINNER',
        },
        estimatedHours: { type: 'number', example: 10 },
        status: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
          example: 'PUBLISHED',
        },
        image: {
          type: 'string',
          example: 'https://example.com/images/typescript.jpg',
        },
        banner: {
          type: 'string',
          example: 'https://example.com/images/typescript-banner.jpg',
        },
      },
    },
  })
  courses?: any[];
}

export class CreateEducationProgramDto {
  @ApiProperty({
    description: 'Navn på uddannelsesprogrammet',
    type: String,
    example: 'Programmering',
  })
  @IsNotEmpty({ message: 'Navn må ikke være tomt' })
  @IsString({ message: 'Navn skal være en tekststreng' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name: string;

  @ApiProperty({
    description: 'URL-venligt slug for uddannelsesprogrammet',
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

  @ApiPropertyOptional({
    description: 'Beskrivelse af uddannelsesprogrammet',
    type: String,
    example: 'Lær at programmere i forskellige sprog og teknologier',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en tekststreng' })
  @MaxLength(1000, { message: 'Beskrivelse må højst være 1000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for uddannelsesprogrammet',
    type: [String],
    example: ['programmering', 'kode', 'udvikling'],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Hvert tag skal være en tekststreng' })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Kategorier for uddannelsesprogrammet',
    type: [String],
    example: ['teknologi', 'it', 'software'],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Hver kategori skal være en tekststreng' })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'URL til fagområdets billede',
    type: String,
    example: 'https://example.com/images/programming.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Billede-URL skal være en tekststreng' })
  image?: string;

  @ApiPropertyOptional({
    description: 'URL til fagområdets banner',
    type: String,
    example: 'https://example.com/images/programming-banner.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Banner-URL skal være en tekststreng' })
  banner?: string;
}

export class UpdateEducationProgramDto {
  @ApiPropertyOptional({
    description: 'Navn på uddannelsesprogrammet',
    type: String,
    example: 'Programmering',
  })
  @IsOptional()
  @IsString({ message: 'Navn skal være en tekststreng' })
  @MaxLength(100, { message: 'Navn må højst være 100 tegn' })
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-venligt slug for uddannelsesprogrammet',
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

  @ApiPropertyOptional({
    description: 'Beskrivelse af uddannelsesprogrammet',
    type: String,
    example: 'Lær at programmere i forskellige sprog og teknologier',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en tekststreng' })
  @MaxLength(1000, { message: 'Beskrivelse må højst være 1000 tegn' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for uddannelsesprogrammet',
    type: [String],
    example: ['programmering', 'kode', 'udvikling'],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Hvert tag skal være en tekststreng' })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Kategorier for uddannelsesprogrammet',
    type: [String],
    example: ['teknologi', 'it', 'software'],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Hver kategori skal være en tekststreng' })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'URL til uddannelsesprogrammets billede',
    type: String,
    example: 'https://example.com/images/programming.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Billede-URL skal være en tekststreng' })
  image?: string;

  @ApiPropertyOptional({
    description: 'URL til fagområdets banner',
    type: String,
    example: 'https://example.com/images/programming-banner.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Banner-URL skal være en tekststreng' })
  banner?: string;
}

export class EducationProgramResponseDto {
  @ApiProperty({
    description: 'Besked om resultatet af operationen',
    type: String,
    example: 'Uddannelsesprogrammet blev slettet',
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

export class PaginatedEducationProgramResponseDto {
  @ApiProperty({
    description: 'Liste af uddannelsesprogrammer',
    type: [EducationProgramDto],
  })
  data: EducationProgramDto[];

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

  @ApiPropertyOptional({
    description: 'Filtrér efter tags (kommasepareret liste)',
    type: String,
    example: 'programmering,kode,udvikling',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Filtrér efter kategorier (kommasepareret liste)',
    type: String,
    example: 'teknologi,it,software',
  })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiPropertyOptional({
    description: 'Filtrér efter sværhedsgrad',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  })
  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

  @ApiPropertyOptional({
    description: 'Filtrér efter kursusstatus',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({
    description: 'Søgeterm for fuld-tekst søgning',
    type: String,
    example: 'programmering',
  })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({
    description:
      'Filtrér efter indholdstyper (kommasepareret liste: course, module, lesson)',
    type: String,
    example: 'course,module',
  })
  @IsOptional()
  @IsString()
  contentTypes?: string;
}
