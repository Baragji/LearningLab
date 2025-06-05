import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly embeddingModel: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    this.defaultModel = this.configService.get<string>(
      'OLLAMA_MODEL',
      'llama2',
    );
    this.embeddingModel = this.configService.get<string>(
      'OLLAMA_EMBEDDING_MODEL',
      'nomic-embed-text',
    );
    this.timeout = this.configService.get<number>('OLLAMA_TIMEOUT', 30000);

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Ollama Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Ollama Request Error:', (error as Error).message);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Ollama Response: ${response.status} ${response.statusText}`,
        );
        return response;
      },
      (error) => {
        this.logger.error('Ollama Response Error:', (error as Error).message);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Check if Ollama server is running and accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        'Ollama health check failed:',
        (error as Error).message,
      );
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<OllamaModelInfo[]> {
    try {
      const response: AxiosResponse<{ models: OllamaModelInfo[] }> =
        await this.httpClient.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      this.logger.error(
        'Failed to get Ollama models:',
        (error as Error).message,
      );
      throw new HttpException(
        'Failed to retrieve available models from Ollama',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some((model) => model.name === modelName);
    } catch (error) {
      this.logger.error(
        `Failed to check model availability for ${modelName}:`,
        (error as Error).message,
      );
      return false;
    }
  }

  /**
   * Generate text completion using Ollama
   */
  async generateCompletion(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<string> {
    const model = options?.model || this.defaultModel;

    // Check if model is available
    const isAvailable = await this.isModelAvailable(model);
    if (!isAvailable) {
      throw new HttpException(
        `Model '${model}' is not available. Please ensure it's installed in Ollama.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const request: OllamaGenerateRequest = {
      model,
      prompt,
      stream: options?.stream || false,
      options: {
        temperature:
          options?.temperature ||
          this.configService.get<number>('OLLAMA_TEMPERATURE', 0.7),
        max_tokens:
          options?.maxTokens ||
          this.configService.get<number>('OLLAMA_MAX_TOKENS', 2000),
      },
    };

    try {
      this.logger.debug(`Generating completion with model: ${model}`);
      const response: AxiosResponse<OllamaGenerateResponse> =
        await this.httpClient.post('/api/generate', request);

      if (!response.data.response) {
        throw new Error('Empty response from Ollama');
      }

      this.logger.debug(
        `Completion generated successfully. Length: ${response.data.response.length}`,
      );
      return response.data.response;
    } catch (error) {
      this.logger.error(
        'Failed to generate completion:',
        (error as Error).message,
      );

      if (error.response?.status === 404) {
        throw new HttpException(
          `Model '${model}' not found. Please install it using: ollama pull ${model}`,
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        'Failed to generate text completion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate embeddings using Ollama
   */
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const embeddingModel = model || this.embeddingModel;

    // Check if embedding model is available
    const isAvailable = await this.isModelAvailable(embeddingModel);
    if (!isAvailable) {
      throw new HttpException(
        `Embedding model '${embeddingModel}' is not available. Please ensure it's installed in Ollama.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const request: OllamaEmbeddingRequest = {
      model: embeddingModel,
      prompt: text,
    };

    try {
      this.logger.debug(`Generating embedding with model: ${embeddingModel}`);
      const response: AxiosResponse<OllamaEmbeddingResponse> =
        await this.httpClient.post('/api/embeddings', request);

      if (!response.data.embedding || response.data.embedding.length === 0) {
        throw new Error('Empty embedding response from Ollama');
      }

      this.logger.debug(
        `Embedding generated successfully. Dimensions: ${response.data.embedding.length}`,
      );
      return response.data.embedding;
    } catch (error) {
      this.logger.error(
        'Failed to generate embedding:',
        (error as Error).message,
      );

      if (error.response?.status === 404) {
        throw new HttpException(
          `Embedding model '${embeddingModel}' not found. Please install it using: ollama pull ${embeddingModel}`,
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        'Failed to generate embedding',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate multiple embeddings in batch
   */
  async generateEmbeddings(
    texts: string[],
    model?: string,
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      try {
        const embedding = await this.generateEmbedding(text, model);
        embeddings.push(embedding);
      } catch (error) {
        this.logger.error(
          `Failed to generate embedding for text: ${text.substring(0, 50)}...`,
          (error as Error).message,
        );
        // Continue with other texts, but log the error
        embeddings.push([]);
      }
    }

    return embeddings;
  }

  /**
   * Pull/download a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      this.logger.log(`Pulling model: ${modelName}`);
      await this.httpClient.post('/api/pull', { name: modelName });
      this.logger.log(`Model ${modelName} pulled successfully`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to pull model ${modelName}:`,
        (error as Error).message,
      );
      return false;
    }
  }

  /**
   * Get default model name
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Get default embedding model name
   */
  getDefaultEmbeddingModel(): string {
    return this.embeddingModel;
  }

  /**
   * Get Ollama base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
