// apps/api/src/controllers/quizAttempts.module.ts
import { Module } from '@nestjs/common';
import { QuizAttemptController } from './quizAttempt.controller.nest';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuizAttemptController],
  providers: [],
  exports: [],
})
export class QuizAttemptsModule {}
