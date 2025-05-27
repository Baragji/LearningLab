// apps/api/src/controllers/dto/certificate/certificate.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CertificateDto {
  @ApiProperty({
    description: 'Unik ID for certifikatet',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID for brugeren der har modtaget certifikatet',
    type: Number,
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'ID for den quiz certifikatet er udstedt for',
    type: Number,
    example: 1,
  })
  quizId: number;

  @ApiProperty({
    description: 'Score opnået i quizzen',
    type: Number,
    example: 85,
  })
  score: number;

  @ApiProperty({
    description: 'Dato for udstedelse af certifikatet',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  issueDate: Date;

  @ApiProperty({
    description: 'Unik identifikator for certifikatet',
    type: String,
    example: 'CERT-12345-ABCDE',
  })
  certificateId: string;

  @ApiProperty({
    description: 'Certifikatets titel',
    type: String,
    example: 'TypeScript Grundkursus Certifikat',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Certifikatets beskrivelse',
    type: String,
    example:
      'Dette certifikat bekræfter, at brugeren har bestået TypeScript Grundkursus med en score på 85%.',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Dato for oprettelse af certifikatet',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Dato for seneste opdatering af certifikatet',
    type: Date,
    example: '2023-05-20T12:15:00Z',
  })
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Brugeren der har modtaget certifikatet',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
      email: { type: 'string', example: 'john.doe@example.com' },
    },
  })
  user?: any;

  @ApiPropertyOptional({
    description: 'Quizzen certifikatet er udstedt for',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'TypeScript Grundkursus Quiz' },
    },
  })
  quiz?: any;
}

export class CreateCertificateDto {
  @ApiProperty({
    description: 'ID for brugeren der skal modtage certifikatet',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Bruger-ID skal være et tal' })
  @IsPositive({ message: 'Bruger-ID skal være et positivt tal' })
  userId: number;

  @ApiProperty({
    description: 'ID for den quiz certifikatet udstedes for',
    type: Number,
    example: 1,
  })
  @IsNumber({}, { message: 'Quiz-ID skal være et tal' })
  @IsPositive({ message: 'Quiz-ID skal være et positivt tal' })
  quizId: number;

  @ApiProperty({
    description: 'Score opnået i quizzen',
    type: Number,
    example: 85,
  })
  @IsNumber({}, { message: 'Score skal være et tal' })
  @IsPositive({ message: 'Score skal være et positivt tal' })
  score: number;

  @ApiProperty({
    description: 'Certifikatets titel',
    type: String,
    example: 'TypeScript Grundkursus Certifikat',
  })
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom' })
  title: string;

  @ApiPropertyOptional({
    description: 'Certifikatets beskrivelse',
    type: String,
    example:
      'Dette certifikat bekræfter, at brugeren har bestået TypeScript Grundkursus med en score på 85%.',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  description?: string | null;
}

export class UpdateCertificateDto {
  @ApiPropertyOptional({
    description: 'Certifikatets titel',
    type: String,
    example: 'TypeScript Grundkursus Certifikat - Opdateret',
  })
  @IsOptional()
  @IsString({ message: 'Titel skal være en streng' })
  @IsNotEmpty({ message: 'Titel må ikke være tom hvis angivet' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Certifikatets beskrivelse',
    type: String,
    example:
      'Dette certifikat bekræfter, at brugeren har bestået TypeScript Grundkursus med en score på 85%.',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Beskrivelse skal være en streng' })
  description?: string | null;
}
