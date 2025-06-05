import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cosineSimilarity from 'compute-cosine-similarity';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export interface VectorStoreInterface {
  addDocument(document: Omit<VectorDocument, 'createdAt'>): Promise<void>;
  searchSimilar(
    queryEmbedding: number[],
    limit?: number,
    threshold?: number,
  ): Promise<SearchResult[]>;
  deleteDocument(id: string): Promise<boolean>;
  getDocument(id: string): Promise<VectorDocument | null>;
  updateDocument(
    id: string,
    updates: Partial<VectorDocument>,
  ): Promise<boolean>;
  clear(): Promise<void>;
}

@Injectable()
export class VectorStoreService implements VectorStoreInterface {
  private readonly logger = new Logger(VectorStoreService.name);
  private documents: Map<string, VectorDocument> = new Map();
  private readonly storeType: string;

  constructor(private configService: ConfigService) {
    this.storeType =
      this.configService.get<string>('VECTOR_STORE_TYPE') || 'memory';
    this.logger.log(`Vector store initialized with type: ${this.storeType}`);
  }

  async addDocument(
    document: Omit<VectorDocument, 'createdAt'>,
  ): Promise<void> {
    const vectorDoc: VectorDocument = {
      ...document,
      createdAt: new Date(),
    };

    this.documents.set(document.id, vectorDoc);
    this.logger.debug(`Added document with ID: ${document.id}`);
  }

  async searchSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const document of this.documents.values()) {
      try {
        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, document.embedding);

        if (similarity >= threshold) {
          results.push({
            document,
            similarity,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Failed to calculate similarity for document ${document.id}:`,
          error,
        );
      }
    }

    // Sort by similarity (highest first) and limit results
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.logger.debug(`Deleted document with ID: ${id}`);
    }
    return deleted;
  }

  async getDocument(id: string): Promise<VectorDocument | null> {
    return this.documents.get(id) || null;
  }

  async updateDocument(
    id: string,
    updates: Partial<VectorDocument>,
  ): Promise<boolean> {
    const existing = this.documents.get(id);
    if (!existing) {
      return false;
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Prevent createdAt changes
    };

    this.documents.set(id, updated);
    this.logger.debug(`Updated document with ID: ${id}`);
    return true;
  }

  async clear(): Promise<void> {
    this.documents.clear();
    this.logger.log('Cleared all documents from vector store');
  }

  // Utility methods
  getDocumentCount(): number {
    return this.documents.size;
  }

  getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  // Method to export data for backup or migration
  exportData(): VectorDocument[] {
    return this.getAllDocuments();
  }

  // Method to import data from backup or migration
  async importData(documents: VectorDocument[]): Promise<void> {
    this.documents.clear();
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
    this.logger.log(`Imported ${documents.length} documents`);
  }

  // Search by metadata filters
  async searchByMetadata(
    filters: Record<string, any>,
    limit: number = 10,
  ): Promise<VectorDocument[]> {
    const results: VectorDocument[] = [];

    for (const document of this.documents.values()) {
      let matches = true;

      for (const [key, value] of Object.entries(filters)) {
        if (document.metadata[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(document);
      }

      if (results.length >= limit) {
        break;
      }
    }

    return results;
  }

  /**
   * Get statistics about the vector store
   */
  getStats(): {
    totalDocuments: number;
    storeType: string;
  } {
    return {
      totalDocuments: this.documents.size,
      storeType: this.storeType,
    };
  }
}
