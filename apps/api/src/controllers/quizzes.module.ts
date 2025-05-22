// apps/api/src/controllers/quizzes.module.ts
import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [QuizController],
  providers: [],
})
export class QuizzesModule {}
