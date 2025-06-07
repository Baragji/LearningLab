#!/usr/bin/env tsx

/**
 * Context Window Management for MCP Servers
 * Handles large codebase chunking and token optimization
 */

import { readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface ContextStrategy {
  maxTokens: number;
  chunkingStrategy: 'semantic' | 'size' | 'file' | 'directory';
  fallbackBehavior: 'truncate' | 'summarize' | 'reject';
  priorityPatterns: string[];
  excludePatterns: string[];
}

interface ChunkMetadata {
  id: string;
  type: 'code' | 'config' | 'docs' | 'test';
  priority: number;
  tokenCount: number;
  files: string[];
  summary: string;
}

class ContextWindowManager {
  private strategies: Map<string, ContextStrategy> = new Map();
  private tokenCache: Map<string, number> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // DeepView strategy for large codebase analysis
    this.strategies.set('deepview', {
      maxTokens: 1000000, // Gemini 2.5 Pro limit
      chunkingStrategy: 'semantic',
      fallbackBehavior: 'summarize',
      priorityPatterns: [
        'src/**/*.ts',
        'src/**/*.tsx', 
        'apps/**/*.ts',
        'apps/**/*.tsx',
        'packages/**/*.ts',
        '*.md',
        'package.json',
        'tsconfig.json'
      ],
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        '*.log',
        '*.env*',
        'coverage/**'
      ]
    });

    // Code assistant strategy for focused development
    this.strategies.set('code-assistant', {
      maxTokens: 128000, // GPT-4 limit
      chunkingStrategy: 'file',
      fallbackBehavior: 'truncate',
      priorityPatterns: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ],
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        'test/**',
        '*.test.ts'
      ]
    });

    // Sequential thinking strategy for planning
    this.strategies.set('sequential-thinking', {
      maxTokens: 32000,
      chunkingStrategy: 'directory',
      fallbackBehavior: 'summarize',
      priorityPatterns: [
        '.Planer/**/*.md',
        'docs/**/*.md',
        'README.md'
      ],
      excludePatterns: [
        'node_modules/**',
        'src/**'
      ]
    });
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // For code, it's typically higher due to syntax
    const baseTokens = Math.ceil(text.length / 3.5);
    
    // Adjust for code vs text
    const codeIndicators = (text.match(/[{}();,]/g) || []).length;
    const codeMultiplier = codeIndicators > text.length * 0.05 ? 1.2 : 1.0;
    
    return Math.ceil(baseTokens * codeMultiplier);
  }

  /**
   * Get file content with caching
   */
  private getFileContent(filePath: string): string {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Could not read file: ${filePath}`);
      return '';
    }
  }

  /**
   * Generate semantic chunks based on code structure
   */
  private generateSemanticChunks(content: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    const lines = content.split('\n');
    let currentChunk = '';
    let currentTokens = 0;
    let inFunction = false;
    let braceCount = 0;

    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);
      
      // Track code structure
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      // Check if we're starting a new function/class
      const isFunctionStart = /^(export\s+)?(async\s+)?function|^(export\s+)?class|^(export\s+)?interface/.test(line.trim());
      
      if (isFunctionStart) {
        inFunction = true;
      }

      // If adding this line would exceed token limit and we're at a good break point
      if (currentTokens + lineTokens > maxTokens && 
          (!inFunction || braceCount === 0) && 
          currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
        currentTokens = lineTokens;
        inFunction = false;
      } else {
        currentChunk += line + '\n';
        currentTokens += lineTokens;
      }

      // Reset function tracking when we close all braces
      if (braceCount === 0) {
        inFunction = false;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate file-based chunks
   */
  private generateFileChunks(files: string[], maxTokens: number): ChunkMetadata[] {
    const chunks: ChunkMetadata[] = [];
    let currentChunk: ChunkMetadata = {
      id: `chunk-${chunks.length}`,
      type: 'code',
      priority: 1,
      tokenCount: 0,
      files: [],
      summary: ''
    };

    for (const file of files) {
      const content = this.getFileContent(file);
      const tokens = this.estimateTokens(content);

      if (currentChunk.tokenCount + tokens > maxTokens && currentChunk.files.length > 0) {
        chunks.push(currentChunk);
        currentChunk = {
          id: `chunk-${chunks.length}`,
          type: this.getFileType(file),
          priority: this.getFilePriority(file),
          tokenCount: tokens,
          files: [file],
          summary: this.generateFileSummary(file, content)
        };
      } else {
        currentChunk.files.push(file);
        currentChunk.tokenCount += tokens;
        currentChunk.type = this.getFileType(file);
        currentChunk.priority = Math.max(currentChunk.priority, this.getFilePriority(file));
      }
    }

    if (currentChunk.files.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private getFileType(filePath: string): 'code' | 'config' | 'docs' | 'test' {
    if (filePath.includes('test') || filePath.includes('spec')) return 'test';
    if (filePath.endsWith('.md') || filePath.includes('docs')) return 'docs';
    if (filePath.includes('config') || filePath.endsWith('.json') || filePath.endsWith('.yml')) return 'config';
    return 'code';
  }

  private getFilePriority(filePath: string): number {
    if (filePath.includes('src/')) return 5;
    if (filePath.includes('apps/')) return 4;
    if (filePath.includes('packages/')) return 3;
    if (filePath.endsWith('.md')) return 2;
    return 1;
  }

  private generateFileSummary(filePath: string, content: string): string {
    const lines = content.split('\n');
    const firstLines = lines.slice(0, 5).join('\n');
    
    // Extract key information
    const exports = content.match(/export\s+(class|function|interface|const)\s+(\w+)/g) || [];
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    
    return `File: ${filePath}
Exports: ${exports.slice(0, 3).join(', ')}${exports.length > 3 ? '...' : ''}
Imports: ${imports.length} dependencies
Lines: ${lines.length}
Preview: ${firstLines.slice(0, 100)}...`;
  }

  /**
   * Optimize context for specific MCP server
   */
  public optimizeContext(serverId: string, projectPath: string): {
    chunks: ChunkMetadata[];
    totalTokens: number;
    strategy: ContextStrategy;
    recommendations: string[];
  } {
    const strategy = this.strategies.get(serverId);
    if (!strategy) {
      throw new Error(`No strategy found for server: ${serverId}`);
    }

    // Get all relevant files
    const files = this.getRelevantFiles(projectPath, strategy);
    
    // Generate chunks based on strategy
    const chunks = this.generateFileChunks(files, strategy.maxTokens * 0.8); // Leave 20% buffer
    
    // Sort by priority
    chunks.sort((a, b) => b.priority - a.priority);
    
    // Calculate total tokens
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(chunks, strategy, totalTokens);

    return {
      chunks,
      totalTokens,
      strategy,
      recommendations
    };
  }

  private getRelevantFiles(projectPath: string, strategy: ContextStrategy): string[] {
    try {
      // Use git to get tracked files (excludes .gitignore patterns)
      const gitFiles = execSync('git ls-files', { 
        cwd: projectPath, 
        encoding: 'utf-8' 
      }).split('\n').filter(Boolean);

      return gitFiles.filter(file => {
        const fullPath = join(projectPath, file);
        
        // Check exclude patterns
        if (strategy.excludePatterns.some(pattern => 
          file.includes(pattern.replace('/**', '')) || 
          file.match(pattern.replace('/**', '.*'))
        )) {
          return false;
        }

        // Check if file exists and is readable
        try {
          statSync(fullPath);
          return true;
        } catch {
          return false;
        }
      });
    } catch (error) {
      console.warn('Could not get git files, falling back to manual discovery');
      return [];
    }
  }

  private generateRecommendations(
    chunks: ChunkMetadata[], 
    strategy: ContextStrategy, 
    totalTokens: number
  ): string[] {
    const recommendations: string[] = [];

    if (totalTokens > strategy.maxTokens) {
      recommendations.push(`Total tokens (${totalTokens}) exceed limit (${strategy.maxTokens}). Consider chunking or filtering.`);
    }

    if (chunks.length > 10) {
      recommendations.push(`Large number of chunks (${chunks.length}). Consider increasing chunk size or filtering files.`);
    }

    const testChunks = chunks.filter(c => c.type === 'test').length;
    if (testChunks > chunks.length * 0.3) {
      recommendations.push(`High proportion of test files (${testChunks}/${chunks.length}). Consider excluding tests for production analysis.`);
    }

    const lowPriorityChunks = chunks.filter(c => c.priority <= 2).length;
    if (lowPriorityChunks > chunks.length * 0.5) {
      recommendations.push(`Many low-priority files. Focus on core application files for better analysis.`);
    }

    return recommendations;
  }

  /**
   * Generate repomix configuration for optimal codebase packaging
   */
  public generateRepomixConfig(serverId: string): object {
    const strategy = this.strategies.get(serverId);
    if (!strategy) {
      throw new Error(`No strategy found for server: ${serverId}`);
    }

    return {
      include: strategy.priorityPatterns,
      exclude: strategy.excludePatterns,
      output: {
        format: "xml",
        filename: `codebase-${serverId}.xml`,
        maxFileSize: "1MB",
        removeComments: false,
        removeEmptyLines: true
      },
      security: {
        enableSecurityCheck: true
      }
    };
  }
}

// CLI Interface
async function main() {
  const manager = new ContextWindowManager();
  const command = process.argv[2];
  const serverId = process.argv[3] || 'deepview';
  const projectPath = process.cwd();

  switch (command) {
    case 'analyze':
      console.log(`🔍 Analyzing context for ${serverId}...`);
      const result = manager.optimizeContext(serverId, projectPath);
      
      console.log(`\n📊 Analysis Results:`);
      console.log(`Total Chunks: ${result.chunks.length}`);
      console.log(`Total Tokens: ${result.totalTokens.toLocaleString()}`);
      console.log(`Token Limit: ${result.strategy.maxTokens.toLocaleString()}`);
      console.log(`Utilization: ${((result.totalTokens / result.strategy.maxTokens) * 100).toFixed(1)}%`);
      
      if (result.recommendations.length > 0) {
        console.log(`\n⚠️  Recommendations:`);
        result.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      console.log(`\n📋 Top Priority Chunks:`);
      result.chunks.slice(0, 5).forEach((chunk, i) => {
        console.log(`  ${i + 1}. ${chunk.type} (${chunk.tokenCount.toLocaleString()} tokens, priority ${chunk.priority})`);
        console.log(`     Files: ${chunk.files.slice(0, 3).join(', ')}${chunk.files.length > 3 ? '...' : ''}`);
      });
      break;

    case 'repomix':
      console.log(`📦 Generating repomix config for ${serverId}...`);
      const config = manager.generateRepomixConfig(serverId);
      const configPath = `repomix-${serverId}.config.json`;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Config saved to ${configPath}`);
      console.log(`\nTo generate codebase file:`);
      console.log(`npx repomix --config ${configPath}`);
      break;

    default:
      console.log(`
🧠 Context Window Manager

Usage:
  npm run context-manager analyze [server]   - Analyze context requirements
  npm run context-manager repomix [server]   - Generate repomix config

Servers: deepview, code-assistant, sequential-thinking

Examples:
  npm run context-manager analyze deepview
  npm run context-manager repomix code-assistant
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ContextWindowManager };