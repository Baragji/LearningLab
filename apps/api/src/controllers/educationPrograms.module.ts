// apps/api/src/controllers/educationPrograms.module.ts
import { Module } from '@nestjs/common';
import { EducationProgramController } from './educationProgram.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';
import { EducationProgramService } from './services/education-program.service';

@Module({
  imports: [PersistenceModule],
  controllers: [EducationProgramController],
  providers: [EducationProgramService],
  exports: [EducationProgramService],
})
export class EducationProgramsModule {}
