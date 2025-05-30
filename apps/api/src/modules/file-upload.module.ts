import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileController } from '../controllers/file.controller';
import { FileUploadService } from '../services/file-upload.service';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uploadPath = configService.get<string>('UPLOAD_PATH') || './uploads';
        
        // Ensure upload directory exists
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              // Create subdirectories based on file type
              let subDir = 'misc';
              
              if (file.mimetype.startsWith('image/')) {
                subDir = 'images';
              } else if (file.mimetype.startsWith('video/')) {
                subDir = 'videos';
              } else if (file.mimetype.startsWith('audio/')) {
                subDir = 'audio';
              } else if (file.mimetype === 'application/pdf') {
                subDir = 'documents';
              } else if (
                file.mimetype.includes('word') ||
                file.mimetype.includes('excel') ||
                file.mimetype.includes('powerpoint') ||
                file.mimetype === 'text/plain' ||
                file.mimetype === 'text/csv'
              ) {
                subDir = 'documents';
              }
              
              const fullPath = join(uploadPath, subDir);
              
              // Ensure subdirectory exists
              if (!existsSync(fullPath)) {
                mkdirSync(fullPath, { recursive: true });
              }
              
              cb(null, fullPath);
            },
            filename: (req, file, cb) => {
              // Generate unique filename
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              const ext = extname(file.originalname);
              const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
              cb(null, `${uniqueSuffix}-${name}${ext}`);
            },
          }),
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 5, // Maximum 5 files per request
          },
          fileFilter: (req, file, cb) => {
            const allowedMimeTypes = [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
              'text/csv',
              'video/mp4',
              'video/webm',
              'audio/mpeg',
              'audio/wav',
            ];
            
            if (allowedMimeTypes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error(`File type ${file.mimetype} is not allowed`), false);
            }
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [FileController],
  providers: [FileUploadService, PrismaService],
  exports: [FileUploadService],
})
export class FileUploadModule {}