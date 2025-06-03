import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { OpenAIService } from './services/openai.service';
import { OllamaService } from './services/ollama.service';
import { AIProviderService } from './services/ai-provider.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { ContentProcessingService } from './services/content-processing.service';
import { AIFeedbackService } from './services/ai-feedback.service';
import { AdaptiveLearningService } from './services/adaptive-learning.service';
import { LearningAnalyticsService } from './services/learning-analytics.service';
import { DifficultyAdjustmentService } from './services/difficulty-adjustment.service';

@Module({
  controllers: [AIController],
  providers: [
    OpenAIService,
    OllamaService,
    AIProviderService,
    EmbeddingService,
    VectorStoreService,
    ContentProcessingService,
    AIFeedbackService,
    AdaptiveLearningService,
    LearningAnalyticsService,
    DifficultyAdjustmentService,
  ],
  exports: [
    OpenAIService,
    OllamaService,
    AIProviderService,
    EmbeddingService,
    VectorStoreService,
    ContentProcessingService,
    AIFeedbackService,
    AdaptiveLearningService,
    LearningAnalyticsService,
    DifficultyAdjustmentService,
  ],
})
export class AIModule {}
