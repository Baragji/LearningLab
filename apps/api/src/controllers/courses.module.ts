// apps/api/src/controllers/courses.module.ts
import { Module } from '@nestjs/common';
import { CourseController } from './course.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [CourseController],
  providers: [],
})
export class CoursesModule {}
