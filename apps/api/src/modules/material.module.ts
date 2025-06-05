import { Module } from '@nestjs/common';
import { MaterialController } from '../controllers/material.controller';
import { MaterialService } from '../services/material.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { FileUploadModule } from './file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [MaterialController],
  providers: [MaterialService, PrismaService],
  exports: [MaterialService],
})
export class MaterialModule {}
