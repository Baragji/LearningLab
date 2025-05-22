// apps/api/src/controllers/subjectAreas.module.ts
import { Module } from '@nestjs/common';
import { SubjectAreaController } from './subjectArea.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [SubjectAreaController],
  providers: [],
  exports: [],
})
export class SubjectAreasModule {}
