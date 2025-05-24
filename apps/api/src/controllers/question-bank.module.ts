// apps/api/src/controllers/question-bank.module.ts
import { Module } from '@nestjs/common';
import { QuestionBankController } from './question-bank.controller';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { QuestionImportService } from '../services/question-import.service';

@Module({
  controllers: [QuestionBankController],
  providers: [PrismaService, QuestionImportService],
  exports: [QuestionImportService],
})
export class QuestionBankModule {}
