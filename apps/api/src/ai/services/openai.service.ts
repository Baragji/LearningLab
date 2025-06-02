import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CreateEmbeddingResponse } from 'openai/resources/embeddings';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

export interface AIUsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly embeddingModel: string;
  private usageStats: AIUsageStats = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    cost: 0,
  };

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL = this.configService.get<string>('OPENAI_API_BASE');
    
    // Check if we're using Ollama
    const isOllama = baseURL && baseURL.includes('localhost:11434');
    
    if (!isOllama && !apiKey) {
      throw new Error('OPENAI_API_KEY is required when not using Ollama');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'ollama', // Ollama doesn't need a real API key
      ...(baseURL && { baseURL }),
    });

    // Default to llama2 for Ollama, gpt-3.5-turbo for OpenAI
    const defaultModel = isOllama ? 'llama2' : 'gpt-3.5-turbo';
    this.model = this.configService.get<string>('OPENAI_MODEL') || defaultModel;
    this.embeddingModel = this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-ada-002';

    this.logger.log(`OpenAI service initialized with model: ${this.model}${baseURL ? ` and baseURL: ${baseURL}` : ''}`);
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      // Update usage stats
      this.updateUsageStats({
        totalTokens: response.usage.total_tokens,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: 0,
        cost: this.calculateEmbeddingCost(response.usage.total_tokens),
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to create embedding', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create embedding: ${errorMessage}`);
    }
  }

  async createChatCompletion(
    messages: ChatCompletionCreateParamsNonStreaming['messages'],
    options?: Partial<ChatCompletionCreateParamsNonStreaming>,
  ): Promise<string> {
    try {
      // Check if we're using Ollama (baseURL contains localhost:11434)
      const baseURL = this.configService.get<string>('OPENAI_API_BASE');
      const isOllama = baseURL && baseURL.includes('localhost:11434');
      
      if (isOllama) {
        // For Ollama, make direct HTTP request
        const requestBody = {
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
        };
        
        this.logger.log(`Making Ollama request to: ${baseURL}/chat/completions`);
        this.logger.log(`Request body: ${JSON.stringify(requestBody, null, 2)}`);
        
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        this.logger.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Ollama error response: ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        
        const data = await response.json();
        this.logger.log(`Ollama response: ${JSON.stringify(data, null, 2)}`);
        return data.choices[0]?.message?.content || '';
      } else {
        // Use OpenAI client for regular OpenAI API
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          ...options,
        });

        // Update usage stats
        if (response.usage) {
          this.updateUsageStats({
            totalTokens: response.usage.total_tokens,
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            cost: this.calculateChatCost(response.usage.total_tokens),
          });
        }

        return response.choices[0]?.message?.content || '';
      }
    } catch (error) {
      this.logger.error('Failed to create chat completion', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create chat completion: ${errorMessage}`);
    }
  }

  async generateQuestions(
    content: string,
    questionCount: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ): Promise<any[]> {
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

    try {
      const response = await this.createChatCompletion([
        {
          role: 'system',
          content: 'You are an expert educator who creates high-quality quiz questions. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to generate questions', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate questions: ${errorMessage}`);
    }
  }

  getUsageStats(): AIUsageStats {
    return { ...this.usageStats };
  }

  resetUsageStats(): void {
    this.usageStats = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
    };
  }

  private updateUsageStats(stats: AIUsageStats): void {
    this.usageStats.totalTokens += stats.totalTokens;
    this.usageStats.promptTokens += stats.promptTokens;
    this.usageStats.completionTokens += stats.completionTokens;
    this.usageStats.cost += stats.cost;
  }

  private calculateEmbeddingCost(tokens: number): number {
    // OpenAI pricing for text-embedding-ada-002: $0.0001 / 1K tokens
    return (tokens / 1000) * 0.0001;
  }

  private calculateChatCost(tokens: number): number {
    // OpenAI pricing for gpt-3.5-turbo: $0.002 / 1K tokens
    return (tokens / 1000) * 0.002;
  }
}
