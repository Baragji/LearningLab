import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
  Res,
  ParseIntPipe,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../middleware/auth.middleware';
import { FileUploadService } from '../services/file-upload.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UpdateFileDescriptionDto {
  description: string;
}

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const fileUploadService = new FileUploadService(null as any);
          const uniqueFilename = fileUploadService.generateUniqueFilename(file.originalname);
          cb(null, uniqueFilename);
        }
      }),
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
      }
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body('description') description?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.fileUploadService.validateFile(file);

    const savedFile = await this.fileUploadService.saveFile({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      description,
      uploadedBy: req.user.id
    });

    return {
      message: 'File uploaded successfully',
      file: {
        id: savedFile.id,
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        url: savedFile.url,
        description: savedFile.description,
        createdAt: savedFile.createdAt
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file information by ID' })
  @ApiResponse({ status: 200, description: 'File information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('id', ParseIntPipe) id: number) {
    const file = await this.fileUploadService.getFile(id);
    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      description: file.description,
      uploader: file.uploader,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file by ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    const file = await this.fileUploadService.getFile(id);
    const filePath = this.fileUploadService.getFilePath(file.filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Physical file not found');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('user/my-files')
  @ApiOperation({ summary: 'Get current user\'s files' })
  @ApiResponse({ status: 200, description: 'User files retrieved successfully' })
  async getMyFiles(@Request() req: any) {
    const files = await this.fileUploadService.getFilesByUser(req.user.id);
    return {
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        description: file.description,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }))
    };
  }

  @Get()
  @ApiOperation({ summary: 'Search files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async searchFiles(
    @Query('q') query: string,
    @Query('my') myFiles: string,
    @Request() req: any
  ) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const userId = myFiles === 'true' ? req.user.id : undefined;
    const files = await this.fileUploadService.searchFiles(query, userId);
    
    return {
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        description: file.description,
        uploader: file.uploader,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }))
    };
  }

  @Patch(':id/description')
  @ApiOperation({ summary: 'Update file description' })
  @ApiResponse({ status: 200, description: 'File description updated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateFileDescription(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFileDescriptionDto,
    @Request() req: any
  ) {
    const file = await this.fileUploadService.updateFileDescription(
      id,
      updateDto.description,
      req.user.id
    );

    return {
      message: 'File description updated successfully',
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        description: file.description,
        updatedAt: file.updatedAt
      }
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    await this.fileUploadService.deleteFile(id, req.user.id);
    return {
      message: 'File deleted successfully'
    };
  }
}