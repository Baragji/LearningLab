import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import {
  VectorStoreService,
  VectorDocument,
  SearchResult,
} from './vector-store.service';
import { v4 as uuidv4 } from 'uuid';

export interface EmbeddingRequest {
  content: string;
  metadata?: Record<string, any>;
  id?: string;
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private aiProviderService: AIProviderService,
    private vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Create and store an embedding for the given content
   */
  async createAndStoreEmbedding(request: EmbeddingRequest): Promise<string> {
    try {
      const { content, metadata = {}, id = uuidv4() } = request;

      // Check if document already exists
      const existing = await this.vectorStoreService.getDocument(id);
      if (existing) {
        this.logger.warn(`Document with ID ${id} already exists. Updating...`);
      }

      // Create embedding
      const embedding = await this.aiProviderService.generateEmbedding(content);

      // Store in vector database
      const document: Omit<VectorDocument, 'createdAt'> = {
        id,
        content,
        embedding,
        metadata: {
          ...metadata,
          contentLength: content.length,
          embeddingModel: 'text-embedding-ada-002',
        },
      };

      await this.vectorStoreService.addDocument(document);

      this.logger.log(`Created and stored embedding for document: ${id}`);
      return id;
    } catch (error) {
      this.logger.error('Failed to create and store embedding', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create and store embedding: ${errorMessage}`);
    }
  }

  /**
   * Perform semantic search using natural language query
   */
  async semanticSearch(
    request: SemanticSearchRequest,
  ): Promise<SearchResult[]> {
    try {
      const { query, limit = 10, threshold = 0.7, filters } = request;

      // Create embedding for the search query
      const queryEmbedding =
        await this.aiProviderService.generateEmbedding(query);

      // Search in vector store
      let results = await this.vectorStoreService.searchSimilar(
        queryEmbedding,
        limit * 2, // Get more results to allow for filtering
        threshold,
      );

      // Apply metadata filters if provided
      if (filters && Object.keys(filters).length > 0) {
        results = results.filter((result) => {
          for (const [key, value] of Object.entries(filters)) {
            if (result.document.metadata[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }

      // Limit final results
      results = results.slice(0, limit);

      this.logger.log(
        `Semantic search for "${query}" returned ${results.length} results`,
      );
      return results;
    } catch (error) {
      this.logger.error('Failed to perform semantic search', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to perform semantic search: ${errorMessage}`);
    }
  }

  /**
   * Update an existing document's embedding
   */
  async updateEmbedding(
    id: string,
    newContent: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    try {
      // Create new embedding
      const embedding =
        await this.aiProviderService.generateEmbedding(newContent);

      // Update document
      const updates: Partial<VectorDocument> = {
        content: newContent,
        embedding,
        metadata: {
          ...metadata,
          contentLength: newContent.length,
          embeddingModel: 'text-embedding-ada-002',
          updatedAt: new Date().toISOString(),
        },
      };

      const success = await this.vectorStoreService.updateDocument(id, updates);

      if (success) {
        this.logger.log(`Updated embedding for document: ${id}`);
      } else {
        this.logger.warn(`Document not found for update: ${id}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to update embedding for document ${id}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update embedding: ${errorMessage}`);
    }
  }

  /**
   * Delete a document and its embedding
   */
  async deleteEmbedding(id: string): Promise<boolean> {
    try {
      const success = await this.vectorStoreService.deleteDocument(id);

      if (success) {
        this.logger.log(`Deleted embedding for document: ${id}`);
      } else {
        this.logger.warn(`Document not found for deletion: ${id}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to delete embedding for document ${id}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete embedding: ${errorMessage}`);
    }
  }

  /**
   * Get similar documents to a given document
   */
  async findSimilarDocuments(
    documentId: string,
    limit: number = 5,
    threshold: number = 0.8,
  ): Promise<SearchResult[]> {
    try {
      const document = await this.vectorStoreService.getDocument(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const results = await this.vectorStoreService.searchSimilar(
        document.embedding,
        limit + 1, // +1 to account for the document itself
        threshold,
      );

      // Filter out the original document
      const filteredResults = results.filter(
        (result) => result.document.id !== documentId,
      );

      return filteredResults.slice(0, limit);
    } catch (error) {
      this.logger.error(
        `Failed to find similar documents for ${documentId}`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find similar documents: ${errorMessage}`);
    }
  }

  /**
   * Batch process multiple documents
   */
  async batchCreateEmbeddings(requests: EmbeddingRequest[]): Promise<string[]> {
    const results: string[] = [];
    const errors: string[] = [];

    for (const request of requests) {
      try {
        const id = await this.createAndStoreEmbedding(request);
        results.push(id);
      } catch (error) {
        this.logger.error(`Failed to process batch item:`, error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMessage);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Batch processing completed with ${errors.length} errors`,
      );
    }

    this.logger.log(
      `Batch processed ${results.length}/${requests.length} documents successfully`,
    );
    return results;
  }

  /**
   * Get an embedding by ID
   */
  async getEmbedding(id: string): Promise<VectorDocument | null> {
    try {
      return await this.vectorStoreService.getDocument(id);
    } catch (error) {
      this.logger.error(`Failed to get embedding for document ${id}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get embedding: ${errorMessage}`);
    }
  }

  /**
   * Get statistics about the embedding store
   */
  async getStats(): Promise<{
    totalDocuments: number;
    aiUsageStats: any;
  }> {
    return {
      totalDocuments: this.vectorStoreService.getDocumentCount(),
      aiUsageStats: null, // Usage stats not available
    };
  }
}
