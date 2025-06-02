import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './services/openai.service';
import { VectorStoreService } from './services/vector-store.service';
import { EmbeddingService } from './services/embedding.service';
import { ContentProcessingService } from './services/content-processing.service';
import { AIController } from './ai.controller';
import { PersistenceModule } from '../persistence/persistence.module';

// Question Generation Services
import {
  ContentAnalyzer,
  QuestionGenerator,
  QualityEvaluator,
  AIUsageLogger,
  ContentFetcher,
  QuestionGenerationService,
} from './services/question-generation';

@Module({
  imports: [ConfigModule, PersistenceModule],
  providers: [
    // Core AI Services
    OpenAIService,
    VectorStoreService,
    EmbeddingService,
    ContentProcessingService,
    
    // Question Generation Services
    ContentAnalyzer,
    QuestionGenerator,
    QualityEvaluator,
    AIUsageLogger,
    ContentFetcher,
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
