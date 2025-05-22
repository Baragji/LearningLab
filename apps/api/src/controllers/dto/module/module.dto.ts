// apps/api/src/controllers/dto/module/module.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ModuleDto {
  @ApiProperty({
    description: 'Unik ID for modulet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Modulets titel',
    type: String,
    example: 'Introduktion til TypeScript',
  })
  title: string;

  @ApiProperty({
    description: 'Modulets beskrivelse',
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  description: string;

  @ApiProperty({
    description: 'Modulets rækkefølge i kurset',
    type: Number,
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'ID for det kursus, modulet tilhører',
    type: Number,
    example: 1,
  })
  courseId: number;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af modulet',
    type: Date,
    example: '2023-05-20T12:00:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af modulet',
    type: Date,
    example: '2023-05-21T14:30:00Z',
  })
  updatedAt?: Date;
}

export class CreateModuleDto {
  @ApiProperty({
    description: 'Modulets titel',
    type: String,
    example: 'Introduktion til TypeScript',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  title: string;

  @ApiProperty({
    description: 'Modulets beskrivelse',
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom' })
  description: string;

  @ApiPropertyOptional({
    description:
      'Modulets rækkefølge i kurset (valgfri, auto-genereres hvis ikke angivet)',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiProperty({
    description: 'ID for det kursus, modulet tilhører',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId: number;
}

export class UpdateModuleDto {
  @ApiPropertyOptional({
    description: 'Modulets titel',
    type: String,
    example: 'Introduktion til TypeScript',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Modulets beskrivelse',
    type: String,
    example: 'Lær grundlæggende TypeScript-koncepter og -typer',
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  @IsNotEmpty({ message: 'Beskrivelse må ikke være tom hvis angivet' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Modulets rækkefølge i kurset',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rækkefølge skal være et tal' })
  @IsPositive({ message: 'Rækkefølge skal være et positivt tal' })
  order?: number;

  @ApiPropertyOptional({
    description: 'ID for det kursus, modulet tilhører',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kursus-ID skal være et tal' })
  @IsPositive({ message: 'Kursus-ID skal være et positivt tal' })
  courseId?: number;
}

export class UpdateModulesOrderDto {
  @ApiProperty({
    description: "Array af modul-ID'er i den ønskede rækkefølge",
    type: [Number],
    example: [3, 1, 2],
  })
  @IsNotEmpty({ message: 'moduleIds må ikke være tom' })
  moduleIds: number[];
}
