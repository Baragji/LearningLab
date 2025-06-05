import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { OllamaService } from './ollama.service';

export type AIProvider = 'openai' | 'ollama';

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIGenerationResult {
  content: string;
  usage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
  model: string;
  provider: AIProvider;
}

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly provider: AIProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
    private readonly ollamaService: OllamaService,
  ) {
    this.provider = this.configService.get<AIProvider>('AI_PROVIDER', 'ollama');
    this.logger.log(`AI Provider initialized: ${this.provider}`);
  }

  /**
   * Get the current AI provider
   */
  getCurrentProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Check if AI services are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (this.provider === 'ollama') {
        return await this.ollamaService.healthCheck();
      } else {
        // For OpenAI, we assume it's available if API key is configured
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        return !!apiKey;
      }
    } catch (error) {
      this.logger.error(
        `AI provider ${this.provider} is not available:`,
        (error as Error).message,
      );
      return false;
    }
  }

  /**
   * Generate text completion using the configured provider
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AIGenerationResult> {
    try {
      if (this.provider === 'ollama') {
        const content = await this.ollamaService.generateCompletion(prompt, {
          model: options?.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        });

        return {
          content,
          model: options?.model || this.ollamaService.getDefaultModel(),
          provider: 'ollama',
        };
      } else {
        const content = await this.openaiService.createChatCompletion(
          [
            {
              role: 'user',
              content: prompt,
            },
          ],
          {
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
            model: options?.model,
          },
        );

        const usage = this.openaiService.getUsageStats();
        return {
          content,
          usage: {
            totalTokens: usage.totalTokens,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          },
          model:
            options?.model ||
            this.configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo'),
          provider: 'openai',
        };
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate completion:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Generate chat completion with conversation context
   */
  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AICompletionOptions,
  ): Promise<AIGenerationResult> {
    try {
      if (this.provider === 'ollama') {
        // For Ollama, convert messages to a single prompt
        const prompt = messages
          .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join('\n\n');

        const content = await this.ollamaService.generateCompletion(prompt, {
          model: options?.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        });

        return {
          content,
          model: options?.model || this.ollamaService.getDefaultModel(),
          provider: 'ollama',
        };
      } else {
        const content = await this.openaiService.createChatCompletion(
          messages as any,
          {
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
            model: options?.model,
          },
        );

        const usage = this.openaiService.getUsageStats();
        return {
          content,
          usage: {
            totalTokens: usage.totalTokens,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          },
          model:
            options?.model ||
            this.configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo'),
          provider: 'openai',
        };
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate chat completion:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Generate embeddings using the configured provider
   */
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    try {
      if (this.provider === 'ollama') {
        return await this.ollamaService.generateEmbedding(text, model);
      } else {
        return await this.openaiService.createEmbedding(text);
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate embedding:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Generate multiple embeddings in batch
   */
  async generateEmbeddings(
    texts: string[],
    model?: string,
  ): Promise<number[][]> {
    try {
      if (this.provider === 'ollama') {
        return await this.ollamaService.generateEmbeddings(texts, model);
      } else {
        // For OpenAI, generate embeddings one by one
        const embeddings: number[][] = [];
        for (const text of texts) {
          const embedding = await this.openaiService.createEmbedding(text);
          embeddings.push(embedding);
        }
        return embeddings;
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate embeddings:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Generate questions based on content
   */
  async generateQuestions(
    content: string,
    questionCount: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ): Promise<any[]> {
    try {
      if (this.provider === 'ollama') {
        const prompt = `
Generate ${questionCount} ${difficulty} multiple-choice questions based on the following content.
Each question should have 4 options with only one correct answer.
Return the response as a JSON array with this structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Content:
${content}
`;

        const response = await this.ollamaService.generateCompletion(prompt);
        return JSON.parse(response);
      } else {
        return await this.openaiService.generateQuestions(
          content,
          questionCount,
          difficulty,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate questions:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Get available models for the current provider
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      if (this.provider === 'ollama') {
        const models = await this.ollamaService.getModels();
        return models.map((model) => model.name);
      } else {
        // Return common OpenAI models
        return [
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k',
          'gpt-4',
          'gpt-4-32k',
          'gpt-4-turbo-preview',
        ];
      }
    } catch (error) {
      this.logger.error(
        'Failed to get available models:',
        (error as Error).message,
      );
      return [];
    }
  }

  /**
   * Get default model for the current provider
   */
  getDefaultModel(): string {
    if (this.provider === 'ollama') {
      return this.ollamaService.getDefaultModel();
    } else {
      return this.configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo');
    }
  }

  /**
   * Get default embedding model for the current provider
   */
  getDefaultEmbeddingModel(): string {
    if (this.provider === 'ollama') {
      return this.ollamaService.getDefaultEmbeddingModel();
    } else {
      return this.configService.get<string>(
        'OPENAI_EMBEDDING_MODEL',
        'text-embedding-ada-002',
      );
    }
  }
}
