// apps/api/src/controllers/topics.module.ts
import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller.nest';
import { TopicService } from './services/topic.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicsModule {}
