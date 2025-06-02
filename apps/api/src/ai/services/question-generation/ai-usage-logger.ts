import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma/prisma.service';
import { QuestionGenerationRequest } from './types';

/**
 * Service til logging af AI usage for monitoring og omkostningsstyring
 */
@Injectable()
export class AIUsageLogger {
  private readonly logger = new Logger(AIUsageLogger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log AI usage for monitoring
   */
  async logUsage(
    operation: string,
    request: QuestionGenerationRequest,
    questionsGenerated: number,
    success: boolean = true,
    error?: string,
  ): Promise<void> {
    try {
      await this.prisma.aIUsageLog.create({
        data: {
          operation,
          model: this.getModelName(),
          tokensUsed: this.estimateTokenUsage(request.content),
          requestData: {
            contentType: request.contentType,
            contentId: request.contentId,
            numberOfQuestions: request.numberOfQuestions,
            questionTypes: request.questionTypes,
            targetDifficulty: request.targetDifficulty,
          },
          responseData: {
            questionsGenerated,
            error,
          },
          success,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn('Kunne ikke logge AI usage', error);
    }
  }

  /**
   * Hent aggregeret usage statistik
   */
  async getUsageStats(startDate?: Date, endDate?: Date) {
    const where = {
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [totalUsage, successRate, avgQuestionsPerRequest] = await Promise.all([
      // Total token usage
      this.prisma.aIUsageLog.aggregate({
        where,
        _sum: { tokensUsed: true },
        _count: true,
      }),
      
      // Success rate
      this.prisma.aIUsageLog.groupBy({
        by: ['success'],
        where,
        _count: true,
      }),
      
      // Average questions per request - we'll calculate from responseData
      this.prisma.aIUsageLog.findMany({
        where: { ...where, success: true },
        select: { responseData: true },
      }),
    ]);

    // Calculate average questions per request from responseData
    const avgQuestions = this.calculateAverageQuestions(avgQuestionsPerRequest);

    return {
      totalTokensUsed: totalUsage._sum.tokensUsed || 0,
      totalRequests: totalUsage._count,
      successRate: this.calculateSuccessRate(successRate),
      avgQuestionsPerRequest: avgQuestions,
      estimatedCost: this.estimateCost(totalUsage._sum.tokensUsed || 0),
    };
  }

  /**
   * Estimer token usage baseret på indhold
   */
  private estimateTokenUsage(content: string): number {
    // Rough estimate: 1 token per 4 characters
    const contentTokens = Math.ceil(content.length / 4);
    // Add overhead for prompts and responses
    const overhead = 500;
    return contentTokens + overhead;
  }

  /**
   * Hent model navn fra konfiguration
   */
  private getModelName(): string {
    // Dette kunne komme fra ConfigService
    return process.env.OPENAI_MODEL || 'gpt-4';
  }

  /**
   * Beregn success rate fra grupperet data
   */
  private calculateSuccessRate(data: any[]): number {
    const total = data.reduce((sum, item) => sum + item._count, 0);
    const successful = data.find(item => item.success === true)?._count || 0;
    return total > 0 ? (successful / total) * 100 : 0;
  }

  /**
   * Beregn gennemsnitligt antal spørgsmål fra responseData
   */
  private calculateAverageQuestions(logs: any[]): number {
    if (logs.length === 0) return 0;
    
    const totalQuestions = logs.reduce((sum, log) => {
      const responseData = log.responseData as any;
      const questionsGenerated = responseData?.questionsGenerated || 0;
      return sum + questionsGenerated;
    }, 0);
    
    return totalQuestions / logs.length;
  }

  /**
   * Estimer omkostning baseret på tokens
   */
  private estimateCost(tokens: number): number {
    // GPT-4 pricing (example)
    const costPer1kTokens = 0.03; // $0.03 per 1K tokens
    return (tokens / 1000) * costPer1kTokens;
  }
}