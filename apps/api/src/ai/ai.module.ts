import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './services/openai.service';
import { VectorStoreService } from './services/vector-store.service';
import { EmbeddingService } from './services/embedding.service';
import { ContentProcessingService } from './services/content-processing.service';
import { QuestionGenerationService } from './services/question-generation.service';
import { AIController } from './ai.controller';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [ConfigModule, PersistenceModule],
  providers: [
    OpenAIService,
    VectorStoreService,
    EmbeddingService,
    ContentProcessingService,
    QuestionGenerationService,
  ],
  controllers: [AIController],
  exports: [
    OpenAIService,
    VectorStoreService,
    EmbeddingService,
    ContentProcessingService,
    QuestionGenerationService,
  ],
})
export class AIModule {}
