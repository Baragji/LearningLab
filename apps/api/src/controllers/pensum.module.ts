// apps/api/src/controllers/pensum.module.ts
import { Module } from '@nestjs/common';
import { PensumController } from './pensum.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [PensumController],
  providers: [],
  exports: [],
})
export class PensumModule {}
