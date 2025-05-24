// apps/api/src/controllers/certificate.module.ts
import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Module({
  controllers: [CertificateController],
  providers: [PrismaService],
})
export class CertificateModule {}
