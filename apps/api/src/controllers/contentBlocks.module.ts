// apps/api/src/controllers/contentBlocks.module.ts
import { Module } from '@nestjs/common';
import { ContentBlockController } from './contentBlock.controller.nest';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [ContentBlockController],
  providers: [],
})
export class ContentBlocksModule {}
