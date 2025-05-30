import { IsString, IsOptional, IsInt, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFileDto {
  @ApiPropertyOptional({
    description: 'Description of the file',
    example: 'This is a lesson document',
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Original name of the file',
    example: 'lesson-1-document.pdf',
    maxLength: 255
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalName?: string;
}

export class FileSearchDto {
  @ApiProperty({
    description: 'Search query for files',
    example: 'lesson document'
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'User ID to filter files by (admin only)',
    example: 1
  })
  @IsInt()
  @IsOptional()
  userId?: number;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'ID of the uploaded file',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Generated filename',
    example: '1234567890-document.pdf'
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf'
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  size: number;

  @ApiProperty({
    description: 'URL to access the file',
    example: '/uploads/1234567890-document.pdf'
  })
  url: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-01T12:00:00Z'
  })
  createdAt: Date;
}