// apps/api/src/controllers/courses.module.ts
import { Module } from '@nestjs/common';
import { CourseController } from './course.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [
    PersistenceModule,
    // Vi bruger den globale CacheModule fra AppModule, så vi behøver ikke importere den her
  ],
  controllers: [CourseController],
  providers: [
    // Vi bruger den globale CacheInterceptor fra AppModule, så vi behøver ikke Reflector her
  ],
})
export class CoursesModule {}
