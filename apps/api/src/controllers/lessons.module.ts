// apps/api/src/controllers/lessons.module.ts
import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [LessonController],
  providers: [],
})
export class LessonsModule {}
