// apps/api/src/controllers/userProgress.module.ts
import { Module } from '@nestjs/common';
import { UserProgressController } from './userProgress.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [UserProgressController],
  providers: [],
  exports: [],
})
export class UserProgressModule {}
