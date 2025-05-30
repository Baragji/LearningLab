import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { File } from '@prisma/client';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

export interface FileUploadResult {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface CreateFileDto {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  description?: string;
  uploadedBy: number;
}

@Injectable()
export class FileUploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor(private prisma: PrismaService) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await mkdirAsync(this.uploadPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum allowed size of ${this.maxFileSize} bytes`
      );
    }
  }

  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    return `${timestamp}-${random}-${nameWithoutExt}${extension}`;
  }

  async saveFile(createFileDto: CreateFileDto): Promise<File> {
    try {
      const url = `/uploads/${createFileDto.filename}`;
      
      const file = await this.prisma.file.create({
        data: {
          ...createFileDto,
          url
        }
      });

      return file;
    } catch (error) {
      console.error('Failed to save file to database:', error);
      throw new BadRequestException('Failed to save file information');
    }
  }

  async getFile(id: number): Promise<File & { uploader: { id: number; name: string; email: string } | null }> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return this.prisma.file.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async deleteFile(id: number, userId: number): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    if (file.uploadedBy !== userId) {
      throw new BadRequestException('You can only delete your own files');
    }

    // Check if file is used in any content blocks
    const contentBlocksUsingFile = await this.prisma.contentBlock.count({
      where: { fileId: id }
    });

    if (contentBlocksUsingFile > 0) {
      throw new BadRequestException(
        'Cannot delete file as it is being used in content blocks'
      );
    }

    try {
      // Delete physical file
      const filePath = path.join(this.uploadPath, file.filename);
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }

      // Delete database record
      await this.prisma.file.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  async updateFileDescription(id: number, description: string, userId: number): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    if (file.uploadedBy !== userId) {
      throw new BadRequestException('You can only update your own files');
    }

    return this.prisma.file.update({
      where: { id },
      data: { description }
    });
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  async searchFiles(query: string, userId?: number): Promise<(File & { uploader: { id: number; name: string; email: string } | null })[]> {
    const whereClause: any = {
      OR: [
        { originalName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (userId) {
      whereClause.uploadedBy = userId;
    }

    return this.prisma.file.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}