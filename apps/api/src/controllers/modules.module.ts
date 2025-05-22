// apps/api/src/controllers/modules.module.ts
import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [ModuleController],
  providers: [],
})
export class ModulesModule {}
