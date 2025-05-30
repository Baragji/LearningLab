import { IsString, IsOptional, IsInt, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '@prisma/client';

export class CreateContentBlockDto {
  @ApiProperty({
    description: 'Type of content block',
    enum: ContentBlockType,
    example: ContentBlockType.TEXT
  })
  @IsEnum(ContentBlockType)
  @IsNotEmpty()
  type: ContentBlockType;

  @ApiPropertyOptional({
    description: 'Content of the block',
    example: 'This is the lesson content...'
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Order of the content block within the lesson',
    example: 1,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'ID of the lesson this content block belongs to',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  lessonId: number;

  @ApiPropertyOptional({
    description: 'ID of the associated file (if any)',
    example: 1
  })
  @IsInt()
  @IsOptional()
  fileId?: number;
}

export class UpdateContentBlockDto {
  @ApiPropertyOptional({
    description: 'Type of content block',
    enum: ContentBlockType,
    example: ContentBlockType.TEXT
  })
  @IsEnum(ContentBlockType)
  @IsOptional()
  type?: ContentBlockType;

  @ApiPropertyOptional({
    description: 'Content of the block',
    example: 'Updated lesson content...'
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Order of the content block within the lesson',
    example: 2,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'ID of the associated file (if any)',
    example: 1
  })
  @IsInt()
  @IsOptional()
  fileId?: number;
}

export class BulkUpdateContentBlockOrderDto {
  @ApiProperty({
    description: 'Array of content blocks with their new order',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        order: { type: 'number', example: 1, minimum: 0 }
      }
    }
  })
  @IsNotEmpty()
  contentBlocks: Array<{
    id: number;
    order: number;
  }>;
}