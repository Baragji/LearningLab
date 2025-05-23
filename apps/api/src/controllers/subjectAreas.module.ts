// apps/api/src/controllers/subjectAreas.module.ts
import { Module } from '@nestjs/common';
import { SubjectAreaController } from './subjectArea.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';
import { SubjectAreaService } from './services/subject-area.service';

@Module({
  imports: [PersistenceModule],
  controllers: [SubjectAreaController],
  providers: [SubjectAreaService],
  exports: [SubjectAreaService],
})
export class SubjectAreasModule {}
