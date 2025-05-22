// apps/api/src/controllers/dto/contentBlock/contentBlock.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ContentBlockDto {
  @ApiProperty({
    description: 'Unik ID for indholdsblokken',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Typen af indholdsblok',
    enum: ContentBlockType,
    example: ContentBlockType.TEXT,
  })
  type: ContentBlockType;

  @ApiProperty({
    description: 'Indholdet af blokken (tekst, URL, etc.)',
    type: String,
    example: 'Dette er et eksempel på indhold i en tekstblok',
  })
  content: string;

  @ApiProperty({
    description: 'Indholdsblokens rækkefølge i lektionen',
    type: Number,
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'ID for den lektion, indholdsblokken tilhører',
    type: Number,
    example: 1,
  })
  lessonId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af indholdsblokken',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af indholdsblokken',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Lektionen som indholdsblokken tilhører',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'Introduktion til TypeScript' },
      description: {
        type: 'string',
        example: 'Lær om de grundlæggende typer i TypeScript',
      },
    },
  })
  lesson?: any;
}

export class CreateContentBlockDto {
  @ApiProperty({
    description: 'Typen af indholdsblok',
    enum: ContentBlockType,
    example: ContentBlockType.TEXT,
  })
  @IsEnum(ContentBlockType, { message: 'Ugyldig indholdstype' })
  type: ContentBlockType;

  @ApiProperty({
    description: 'Indholdet af blokken (tekst, URL, etc.)',
    type: String,
    example: 'Dette er et eksempel på indhold i en tekstblok',
  })
  @IsString({ message: 'Indhold skal være en streng' })
  @IsNotEmpty({ message: 'Indhold må ikke være tomt' })
  content: string;

  @ApiPropertyOptional({
    description:
      'Indholdsblokens rækkefølge i lektionen (valgfri, auto-genereres hvis ikke angivet)',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiProperty({
    description: 'ID for den lektion, indholdsblokken tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Lektion-ID skal være et tal' })
  @IsPositive({ message: 'Lektion-ID skal være et positivt tal' })
  lessonId: number;
}

export class UpdateContentBlockDto {
  @ApiPropertyOptional({
    description: 'Typen af indholdsblok',
    enum: ContentBlockType,
    example: ContentBlockType.TEXT,
  })
  @IsOptional()
  @IsEnum(ContentBlockType, { message: 'Ugyldig indholdstype' })
  type?: ContentBlockType;

  @ApiPropertyOptional({
    description: 'Indholdet af blokken (tekst, URL, etc.)',
    type: String,
    example: 'Dette er et opdateret eksempel på indhold i en tekstblok',
  })
  @IsOptional()
  @IsString({ message: 'Indhold skal være en streng' })
  @IsNotEmpty({ message: 'Indhold må ikke være tomt hvis angivet' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Indholdsblokens rækkefølge i lektionen',
    type: Number,
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiPropertyOptional({
    description: 'ID for den lektion, indholdsblokken tilhører',
    type: Number,
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Lektion-ID skal være et tal' })
  @IsPositive({ message: 'Lektion-ID skal være et positivt tal' })
  lessonId?: number;
}

export class UpdateContentBlocksOrderDto {
  @ApiProperty({
    description: "Array af indholdsblok-ID'er i den ønskede rækkefølge",
    type: [Number],
    example: [3, 1, 2],
  })
  @IsNotEmpty({ message: 'contentBlockIds må ikke være tom' })
  contentBlockIds: number[];
}
