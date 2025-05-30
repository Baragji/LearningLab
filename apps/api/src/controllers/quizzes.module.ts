// apps/api/src/controllers/quizzes.module.ts
import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller.nest';
import { QuizService } from './services/quiz.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizzesModule {}
