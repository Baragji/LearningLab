import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from '../ai-provider.service';
import { ContentAnalysis } from './types';

/**
 * Service til analyse af indhold for at forstå emner og kompleksitet
 */
@Injectable()
export class ContentAnalyzer {
  private readonly logger = new Logger(ContentAnalyzer.name);

  constructor(private readonly aiProviderService: AIProviderService) {}

  /**
   * Analyser indhold for at forstå emner og kompleksitet
   */
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    const prompt = this.buildAnalysisPrompt(content);

    try {
      const response = await this.aiProviderService.generateChatCompletion(
        [
          {
            role: 'system',
            content: 'Du er en ekspert i uddannelsesindhold analyse. Returner altid valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 500,
        },
      );

      return this.parseAnalysisResponse(response.content, content);
    } catch (error) {
      this.logger.error('Fejl ved analyse af indhold', error);
      return this.getFallbackAnalysis(content);
    }
  }

  /**
   * Byg prompt til indholdsanalyse
   */
  private buildAnalysisPrompt(content: string): string {
    return `
Analyser følgende uddannelsesindhold og returner en JSON struktur med:
- mainTopics: Array af hovedemner (max 5)
- keyTerms: Array af nøgletermer og begreber (max 10)
- complexity: 'beginner', 'intermediate', eller 'advanced'
- contentType: 'text', 'code', eller 'mixed'
- estimatedReadingTime: Estimeret læsetid i minutter

Indhold:
${content}

Returner kun JSON uden yderligere tekst:`;
  }

  /**
   * Parse AI response til ContentAnalysis
   */
  private parseAnalysisResponse(responseContent: string, content: string): ContentAnalysis {
    try {
      const parsed = JSON.parse(responseContent);
      return {
        mainTopics: Array.isArray(parsed.mainTopics) 
          ? parsed.mainTopics.slice(0, 5) 
          : ['Generelt emne'],
        keyTerms: Array.isArray(parsed.keyTerms) 
          ? parsed.keyTerms.slice(0, 10) 
          : ['grundlæggende'],
        complexity: this.validateComplexity(parsed.complexity),
        contentType: this.validateContentType(parsed.contentType),
        estimatedReadingTime: parsed.estimatedReadingTime || this.estimateReadingTime(content),
      };
    } catch (error) {
      this.logger.warn('Kunne ikke parse content analysis, bruger fallback', error);
      return this.getFallbackAnalysis(content);
    }
  }

  /**
   * Valider kompleksitet værdi
   */
  private validateComplexity(complexity: string): 'beginner' | 'intermediate' | 'advanced' {
    const valid = ['beginner', 'intermediate', 'advanced'];
    return valid.includes(complexity) ? complexity as any : 'beginner';
  }

  /**
   * Valider indholdstype værdi
   */
  private validateContentType(contentType: string): 'text' | 'code' | 'mixed' {
    const valid = ['text', 'code', 'mixed'];
    return valid.includes(contentType) ? contentType as any : 'text';
  }

  /**
   * Estimer læsetid baseret på indhold
   */
  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Fallback analyse hvis AI fejler
   */
  private getFallbackAnalysis(content: string): ContentAnalysis {
    return {
      mainTopics: ['Generelt emne'],
      keyTerms: ['grundlæggende'],
      complexity: 'beginner',
      contentType: 'text',
      estimatedReadingTime: this.estimateReadingTime(content),
    };
  }
}