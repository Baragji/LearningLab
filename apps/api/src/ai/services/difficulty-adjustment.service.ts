import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import {
  AdaptiveLearningService,
  UserPerformanceData,
} from './adaptive-learning.service';

export interface DifficultyLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  numericValue: number; // 1-10 scale
  description: string;
  characteristics: string[];
}

export interface DifficultyAdjustmentRule {
  id: string;
  name: string;
  condition: (
    performance: UserPerformanceData[],
    currentLevel: DifficultyLevel,
  ) => boolean;
  adjustment: {
    direction: 'increase' | 'decrease' | 'maintain';
    magnitude: number; // 0.1 - 2.0 multiplier
    reason: string;
  };
  priority: number; // 1-10, higher = more important
}

export interface DifficultyAdjustmentResult {
  userId: number;
  previousLevel: DifficultyLevel;
  newLevel: DifficultyLevel;
  adjustmentReason: string;
  confidence: number;
  recommendedActions: string[];
  nextReviewDate: Date;
  performanceMetrics: {
    accuracyTrend: number;
    speedTrend: number;
    consistencyScore: number;
    engagementLevel: number;
  };
}

export interface AdaptiveQuestionConfig {
  baseLevel: DifficultyLevel;
  topicWeights: Map<string, number>; // Topic importance weights
  userStrengths: string[];
  userWeaknesses: string[];
  learningObjectives: string[];
  timeConstraints: {
    sessionDuration: number;
    questionsPerSession: number;
  };
  adaptationSettings: {
    aggressiveness: number; // 0.1-1.0, how quickly to adjust
    stabilityThreshold: number; // How many sessions before major changes
    recoveryMode: boolean; // Special mode for struggling users
  };
}

export interface QuestionDifficultyMetadata {
  questionId: string;
  estimatedDifficulty: number; // 1-10
  topics: string[];
  cognitiveLoad: number; // 1-5
  timeEstimate: number; // seconds
  prerequisites: string[];
  bloomsTaxonomy:
    | 'remember'
    | 'understand'
    | 'apply'
    | 'analyze'
    | 'evaluate'
    | 'create';
  adaptationHistory: {
    userId: number;
    attempts: number;
    successRate: number;
    averageTime: number;
  }[];
}

export interface RealTimeDifficultyAdjustment {
  questionId: string;
  originalDifficulty: number;
  adjustedDifficulty: number;
  adjustmentFactors: {
    userPerformance: number;
    timeSpent: number;
    hintUsage: number;
    previousQuestions: number;
  };
  nextQuestionRecommendation: {
    difficultyRange: [number, number];
    preferredTopics: string[];
    avoidTopics: string[];
  };
}

@Injectable()
export class DifficultyAdjustmentService {
  private readonly logger = new Logger(DifficultyAdjustmentService.name);

  private readonly difficultyLevels: DifficultyLevel[] = [
    {
      level: 'beginner',
      numericValue: 2,
      description: 'Grundlæggende niveau med simple koncepter',
      characteristics: [
        'Direkte spørgsmål',
        'Enkle beregninger',
        'Grundlæggende terminologi',
        'Step-by-step guidance',
      ],
    },
    {
      level: 'intermediate',
      numericValue: 5,
      description: 'Mellemliggende niveau med anvendelse af koncepter',
      characteristics: [
        'Problemløsning',
        'Konceptuel forståelse',
        'Sammenligning og analyse',
        'Mindre komplekse scenarier',
      ],
    },
    {
      level: 'advanced',
      numericValue: 8,
      description: 'Avanceret niveau med kompleks analyse',
      characteristics: [
        'Kritisk tænkning',
        'Komplekse problemstillinger',
        'Syntese af information',
        'Evaluering og vurdering',
      ],
    },
    {
      level: 'expert',
      numericValue: 10,
      description: 'Ekspertniveau med kreativ anvendelse',
      characteristics: [
        'Innovativ problemløsning',
        'Tværfaglig integration',
        'Skabelse af nye løsninger',
        'Abstrakt tænkning',
      ],
    },
  ];

  private readonly adjustmentRules: DifficultyAdjustmentRule[] = [
    {
      id: 'high_accuracy_rule',
      name: 'Høj nøjagtighed over tid',
      condition: (performance, currentLevel) => {
        const recentSessions = performance.slice(-5);
        const avgAccuracy =
          recentSessions.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / recentSessions.length;
        return avgAccuracy > 0.85 && recentSessions.length >= 3;
      },
      adjustment: {
        direction: 'increase',
        magnitude: 1.2,
        reason:
          'Konsistent høj performance indikerer behov for større udfordring',
      },
      priority: 8,
    },
    {
      id: 'low_accuracy_rule',
      name: 'Lav nøjagtighed over tid',
      condition: (performance, currentLevel) => {
        const recentSessions = performance.slice(-3);
        const avgAccuracy =
          recentSessions.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / recentSessions.length;
        return avgAccuracy < 0.6 && recentSessions.length >= 2;
      },
      adjustment: {
        direction: 'decrease',
        magnitude: 0.8,
        reason:
          'Lav performance kræver lettere spørgsmål for at opbygge selvtillid',
      },
      priority: 9,
    },
    {
      id: 'rapid_improvement_rule',
      name: 'Hurtig forbedring',
      condition: (performance, currentLevel) => {
        if (performance.length < 4) return false;
        const recent = performance.slice(-3);
        const older = performance.slice(-6, -3);

        const recentAvg =
          recent.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / recent.length;
        const olderAvg =
          older.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / older.length;

        return recentAvg - olderAvg > 0.2;
      },
      adjustment: {
        direction: 'increase',
        magnitude: 1.3,
        reason: 'Hurtig læringskurve tillader accelereret progression',
      },
      priority: 7,
    },
    {
      id: 'plateau_rule',
      name: 'Performance plateau',
      condition: (performance, currentLevel) => {
        if (performance.length < 6) return false;
        const recent = performance.slice(-6);
        const accuracies = recent.map(
          (p) => p.correctAnswers / p.totalQuestions,
        );

        // Check for plateau (low variance in recent performance)
        const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
        const variance =
          accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) /
          accuracies.length;

        return variance < 0.01 && mean > 0.7; // Low variance, decent performance
      },
      adjustment: {
        direction: 'increase',
        magnitude: 1.1,
        reason: 'Stabil performance indikerer parathed til næste niveau',
      },
      priority: 6,
    },
    {
      id: 'struggling_learner_rule',
      name: 'Kæmpende elev',
      condition: (performance, currentLevel) => {
        const recentSessions = performance.slice(-4);
        const avgAccuracy =
          recentSessions.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / recentSessions.length;
        const hasLongSessions = recentSessions.some(
          (p) => p.totalStudyTime > 60,
        );

        return avgAccuracy < 0.5 && hasLongSessions;
      },
      adjustment: {
        direction: 'decrease',
        magnitude: 0.6,
        reason: 'Betydelige udfordringer kræver grundlæggende gennemgang',
      },
      priority: 10,
    },
    {
      id: 'time_efficiency_rule',
      name: 'Tidseffektivitet',
      condition: (performance, currentLevel) => {
        const recentSessions = performance.slice(-3);
        const avgTimePerQuestion =
          recentSessions.reduce(
            (sum, p) => sum + p.totalStudyTime / p.totalQuestions,
            0,
          ) / recentSessions.length;
        const avgAccuracy =
          recentSessions.reduce(
            (sum, p) => sum + p.correctAnswers / p.totalQuestions,
            0,
          ) / recentSessions.length;

        return avgTimePerQuestion < 30 && avgAccuracy > 0.8; // Fast and accurate
      },
      adjustment: {
        direction: 'increase',
        magnitude: 1.4,
        reason:
          'Hurtig og nøjagtig performance tillader mere komplekse opgaver',
      },
      priority: 7,
    },
  ];

  constructor(
    private aiProviderService: AIProviderService,
    private adaptiveLearningService: AdaptiveLearningService,
  ) {}

  /**
   * Analyze user performance and adjust difficulty level
   */
  async adjustDifficultyLevel(
    userId: number,
    currentLevel: DifficultyLevel,
    performanceHistory: UserPerformanceData[],
    learningObjectives?: string[],
  ): Promise<DifficultyAdjustmentResult> {
    try {
      this.logger.log(
        `Adjusting difficulty for user ${userId}, current level: ${currentLevel.level}`,
      );

      // Apply adjustment rules
      const applicableRules = this.findApplicableRules(
        performanceHistory,
        currentLevel,
      );
      const adjustment = this.calculateAdjustment(
        applicableRules,
        currentLevel,
      );

      // Calculate new difficulty level
      const newLevel = this.calculateNewLevel(currentLevel, adjustment);

      // Calculate performance metrics
      const performanceMetrics =
        this.calculatePerformanceMetrics(performanceHistory);

      // Generate recommendations using AI
      const recommendations = await this.generateAIRecommendations(
        userId,
        currentLevel,
        newLevel,
        performanceHistory,
        learningObjectives,
      );

      // Calculate next review date
      const nextReviewDate = this.calculateNextReviewDate(
        newLevel,
        performanceMetrics,
      );

      const result: DifficultyAdjustmentResult = {
        userId,
        previousLevel: currentLevel,
        newLevel,
        adjustmentReason: adjustment.reason,
        confidence: adjustment.confidence,
        recommendedActions: recommendations,
        nextReviewDate,
        performanceMetrics,
      };

      this.logger.log(
        `Difficulty adjusted for user ${userId}: ${currentLevel.level} -> ${newLevel.level}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to adjust difficulty level', error);
      throw new Error(
        `Failed to adjust difficulty level: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate adaptive question configuration
   */
  async generateAdaptiveQuestionConfig(
    userId: number,
    currentLevel: DifficultyLevel,
    performanceHistory: UserPerformanceData[],
    sessionConstraints: {
      duration: number;
      questionCount: number;
    },
  ): Promise<AdaptiveQuestionConfig> {
    try {
      // Analyze user strengths and weaknesses
      const analysis =
        await this.adaptiveLearningService.analyzeUserPerformance(userId);

      // Calculate topic weights based on performance
      const topicWeights = this.calculateTopicWeights(
        analysis.strengths,
        analysis.weaknesses,
        performanceHistory,
      );

      // Determine adaptation settings
      const adaptationSettings = this.calculateAdaptationSettings(
        performanceHistory,
        currentLevel,
      );

      return {
        baseLevel: currentLevel,
        topicWeights,
        userStrengths: analysis.strengths,
        userWeaknesses: analysis.weaknesses,
        learningObjectives: [...analysis.strengths, ...analysis.weaknesses],
        timeConstraints: {
          sessionDuration: sessionConstraints.duration,
          questionsPerSession: sessionConstraints.questionCount,
        },
        adaptationSettings,
      };
    } catch (error) {
      this.logger.error('Failed to generate adaptive question config', error);
      throw new Error(
        `Failed to generate adaptive question config: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Perform real-time difficulty adjustment during a session
   */
  async performRealTimeAdjustment(
    userId: number,
    questionMetadata: QuestionDifficultyMetadata,
    userResponse: {
      isCorrect: boolean;
      timeSpent: number;
      hintsUsed: number;
      confidence?: number;
    },
    sessionContext: {
      questionsAnswered: number;
      currentAccuracy: number;
      sessionStartTime: Date;
    },
  ): Promise<RealTimeDifficultyAdjustment> {
    try {
      // Calculate adjustment factors
      const adjustmentFactors = this.calculateRealTimeFactors(
        userResponse,
        questionMetadata,
        sessionContext,
      );

      // Calculate adjusted difficulty
      const adjustedDifficulty = this.calculateAdjustedDifficulty(
        questionMetadata.estimatedDifficulty,
        adjustmentFactors,
      );

      // Generate next question recommendation
      const nextQuestionRecommendation =
        this.generateNextQuestionRecommendation(
          adjustedDifficulty,
          questionMetadata,
          sessionContext,
        );

      return {
        questionId: questionMetadata.questionId,
        originalDifficulty: questionMetadata.estimatedDifficulty,
        adjustedDifficulty,
        adjustmentFactors,
        nextQuestionRecommendation,
      };
    } catch (error) {
      this.logger.error('Failed to perform real-time adjustment', error);
      throw new Error(
        `Failed to perform real-time adjustment: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Calibrate question difficulty based on user responses
   */
  async calibrateQuestionDifficulty(
    questionId: string,
    userResponses: {
      userId: number;
      isCorrect: boolean;
      timeSpent: number;
      userLevel: DifficultyLevel;
    }[],
  ): Promise<{
    calibratedDifficulty: number;
    confidence: number;
    recommendedAdjustment: number;
  }> {
    try {
      if (userResponses.length < 3) {
        return {
          calibratedDifficulty: 5, // Default middle difficulty
          confidence: 0.3,
          recommendedAdjustment: 0,
        };
      }

      // Calculate success rate by user level
      const levelSuccessRates = new Map<
        string,
        { correct: number; total: number }
      >();

      userResponses.forEach((response) => {
        const level = response.userLevel.level;
        if (!levelSuccessRates.has(level)) {
          levelSuccessRates.set(level, { correct: 0, total: 0 });
        }

        const stats = levelSuccessRates.get(level)!;
        stats.total++;
        if (response.isCorrect) stats.correct++;
      });

      // Use AI to analyze and calibrate
      const calibrationResult = await this.getAICalibration(
        questionId,
        levelSuccessRates,
        userResponses,
      );

      return calibrationResult;
    } catch (error) {
      this.logger.error('Failed to calibrate question difficulty', error);
      throw new Error(
        `Failed to calibrate question difficulty: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get difficulty level by numeric value
   */
  getDifficultyLevelByValue(numericValue: number): DifficultyLevel {
    // Find closest difficulty level
    return this.difficultyLevels.reduce((closest, level) => {
      const currentDiff = Math.abs(level.numericValue - numericValue);
      const closestDiff = Math.abs(closest.numericValue - numericValue);
      return currentDiff < closestDiff ? level : closest;
    });
  }

  /**
   * Get all available difficulty levels
   */
  getAllDifficultyLevels(): DifficultyLevel[] {
    return [...this.difficultyLevels];
  }

  // Private helper methods
  private findApplicableRules(
    performanceHistory: UserPerformanceData[],
    currentLevel: DifficultyLevel,
  ): DifficultyAdjustmentRule[] {
    return this.adjustmentRules
      .filter((rule) => rule.condition(performanceHistory, currentLevel))
      .sort((a, b) => b.priority - a.priority);
  }

  private calculateAdjustment(
    applicableRules: DifficultyAdjustmentRule[],
    currentLevel: DifficultyLevel,
  ): {
    direction: 'increase' | 'decrease' | 'maintain';
    magnitude: number;
    reason: string;
    confidence: number;
  } {
    if (applicableRules.length === 0) {
      return {
        direction: 'maintain',
        magnitude: 1.0,
        reason: 'Ingen justeringsregler anvendelige',
        confidence: 0.5,
      };
    }

    // Use highest priority rule
    const primaryRule = applicableRules[0];

    // Calculate confidence based on number of applicable rules
    const confidence = Math.min(0.95, 0.6 + applicableRules.length * 0.1);

    return {
      direction: primaryRule.adjustment.direction,
      magnitude: primaryRule.adjustment.magnitude,
      reason: primaryRule.adjustment.reason,
      confidence,
    };
  }

  private calculateNewLevel(
    currentLevel: DifficultyLevel,
    adjustment: { direction: string; magnitude: number },
  ): DifficultyLevel {
    if (adjustment.direction === 'maintain') {
      return currentLevel;
    }

    let newNumericValue = currentLevel.numericValue;

    if (adjustment.direction === 'increase') {
      newNumericValue = Math.min(
        10,
        currentLevel.numericValue * adjustment.magnitude,
      );
    } else {
      newNumericValue = Math.max(
        1,
        currentLevel.numericValue * adjustment.magnitude,
      );
    }

    return this.getDifficultyLevelByValue(newNumericValue);
  }

  private calculatePerformanceMetrics(
    performanceHistory: UserPerformanceData[],
  ): {
    accuracyTrend: number;
    speedTrend: number;
    consistencyScore: number;
    engagementLevel: number;
  } {
    if (performanceHistory.length < 2) {
      return {
        accuracyTrend: 0,
        speedTrend: 0,
        consistencyScore: 0.5,
        engagementLevel: 0.5,
      };
    }

    const recentSessions = performanceHistory.slice(-5);

    // Calculate accuracy trend
    const accuracies = recentSessions.map(
      (p) => p.correctAnswers / p.totalQuestions,
    );
    const accuracyTrend = this.calculateTrend(accuracies);

    // Calculate speed trend (questions per minute)
    const speeds = recentSessions.map(
      (p) => p.totalQuestions / (p.totalStudyTime / 60),
    );
    const speedTrend = this.calculateTrend(speeds);

    // Calculate consistency (inverse of variance)
    const consistencyScore = 1 - this.calculateVariance(accuracies);

    // Calculate engagement level
    const avgStudyTime =
      recentSessions.reduce((sum, p) => sum + p.totalStudyTime, 0) /
      recentSessions.length;
    const engagementLevel = Math.min(1, avgStudyTime / 60); // Normalize to 0-1

    return {
      accuracyTrend,
      speedTrend,
      consistencyScore: Math.max(0, Math.min(1, consistencyScore)),
      engagementLevel,
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i - 1];
    }

    return trend / (values.length - 1);
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));

    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private async generateAIRecommendations(
    userId: number,
    currentLevel: DifficultyLevel,
    newLevel: DifficultyLevel,
    performanceHistory: UserPerformanceData[],
    learningObjectives?: string[],
  ): Promise<string[]> {
    const prompt = `
Generer anbefalinger for sværhedsgrads justering:

Bruger: ${userId}
Tidligere niveau: ${currentLevel.level} (${currentLevel.numericValue})
Nyt niveau: ${newLevel.level} (${newLevel.numericValue})

Seneste performance:
${performanceHistory
  .slice(-3)
  .map(
    (p) =>
      `- Nøjagtighed: ${((p.correctAnswers / p.totalQuestions) * 100).toFixed(1)}%, Tid: ${p.totalStudyTime}min`,
  )
  .join('\n')}

Læringsmål: ${learningObjectives?.join(', ') || 'Ikke specificeret'}

Generer 3-5 specifikke anbefalinger i JSON format:
{
  "recommendations": [
    "Specifik anbefaling 1",
    "Specifik anbefaling 2",
    "Specifik anbefaling 3"
  ]
}
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der genererer specifikke anbefalinger for sværhedsgrads justeringer. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const parsed = JSON.parse(response.content);
      return parsed.recommendations || [];
    } catch (error) {
      this.logger.warn(
        'Failed to generate AI recommendations, using fallback',
        error,
      );

      // Fallback recommendations
      const recommendations = [];

      if (newLevel.numericValue > currentLevel.numericValue) {
        recommendations.push('Fokuser på at mestre nye koncepter gradvist');
        recommendations.push('Øv dig med flere komplekse problemstillinger');
        recommendations.push('Søg hjælp hvis du støder på udfordringer');
      } else if (newLevel.numericValue < currentLevel.numericValue) {
        recommendations.push('Gennemgå grundlæggende koncepter igen');
        recommendations.push('Tag dig tid til at forstå hvert trin');
        recommendations.push(
          'Øv dig med lettere opgaver for at opbygge selvtillid',
        );
      } else {
        recommendations.push('Fortsæt med dit nuværende tempo');
        recommendations.push('Fokuser på konsistens i din læring');
      }

      return recommendations;
    }
  }

  private calculateNextReviewDate(
    newLevel: DifficultyLevel,
    performanceMetrics: any,
  ): Date {
    const baseReviewDays = {
      beginner: 2,
      intermediate: 3,
      advanced: 5,
      expert: 7,
    };

    let reviewDays = baseReviewDays[newLevel.level];

    // Adjust based on performance
    if (performanceMetrics.consistencyScore < 0.5) {
      reviewDays = Math.max(1, reviewDays - 1); // Review sooner if inconsistent
    }

    if (performanceMetrics.engagementLevel > 0.8) {
      reviewDays += 1; // Can wait longer if highly engaged
    }

    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + reviewDays);

    return reviewDate;
  }

  private calculateTopicWeights(
    strengths: string[],
    weaknesses: string[],
    performanceHistory: UserPerformanceData[],
  ): Map<string, number> {
    const weights = new Map<string, number>();

    // Higher weight for weaknesses (need more practice)
    weaknesses.forEach((topic) => {
      weights.set(topic, 0.8);
    });

    // Lower weight for strengths (less practice needed)
    strengths.forEach((topic) => {
      weights.set(topic, 0.3);
    });

    // Default weight for other topics
    const allTopics = new Set([...strengths, ...weaknesses]);
    performanceHistory.forEach((session) => {
      [...session.strengths, ...session.weaknesses].forEach((topic) => {
        if (!weights.has(topic)) {
          weights.set(topic, 0.5);
        }
      });
    });

    return weights;
  }

  private calculateAdaptationSettings(
    performanceHistory: UserPerformanceData[],
    currentLevel: DifficultyLevel,
  ): {
    aggressiveness: number;
    stabilityThreshold: number;
    recoveryMode: boolean;
  } {
    const recentPerformance = performanceHistory.slice(-5);
    const avgAccuracy =
      recentPerformance.reduce(
        (sum, p) => sum + p.correctAnswers / p.totalQuestions,
        0,
      ) / recentPerformance.length;

    // More aggressive adaptation for consistent performers
    const aggressiveness =
      avgAccuracy > 0.8 ? 0.8 : avgAccuracy > 0.6 ? 0.6 : 0.4;

    // Longer stability for struggling learners
    const stabilityThreshold =
      avgAccuracy < 0.5 ? 8 : avgAccuracy < 0.7 ? 5 : 3;

    // Recovery mode for consistently low performance
    const recoveryMode = avgAccuracy < 0.5 && recentPerformance.length >= 3;

    return {
      aggressiveness,
      stabilityThreshold,
      recoveryMode,
    };
  }

  private calculateRealTimeFactors(
    userResponse: any,
    questionMetadata: QuestionDifficultyMetadata,
    sessionContext: any,
  ): {
    userPerformance: number;
    timeSpent: number;
    hintUsage: number;
    previousQuestions: number;
  } {
    // Performance factor (0.5 = poor, 1.0 = excellent)
    const userPerformance = userResponse.isCorrect
      ? userResponse.confidence || 0.8
      : 0.3;

    // Time factor (0.5 = too slow, 1.0 = optimal, 1.2 = very fast)
    const expectedTime = questionMetadata.timeEstimate;
    const timeFactor =
      expectedTime > 0
        ? Math.min(1.2, expectedTime / userResponse.timeSpent)
        : 1.0;

    // Hint usage factor (1.0 = no hints, 0.5 = many hints)
    const hintFactor = Math.max(0.5, 1.0 - userResponse.hintsUsed * 0.2);

    // Session context factor
    const sessionFactor =
      sessionContext.currentAccuracy > 0.8
        ? 1.1
        : sessionContext.currentAccuracy < 0.5
          ? 0.8
          : 1.0;

    return {
      userPerformance,
      timeSpent: timeFactor,
      hintUsage: hintFactor,
      previousQuestions: sessionFactor,
    };
  }

  private calculateAdjustedDifficulty(
    originalDifficulty: number,
    factors: any,
  ): number {
    const combinedFactor =
      factors.userPerformance * 0.4 +
      factors.timeSpent * 0.3 +
      factors.hintUsage * 0.2 +
      factors.previousQuestions * 0.1;

    const adjustedDifficulty = originalDifficulty * combinedFactor;

    return Math.max(1, Math.min(10, adjustedDifficulty));
  }

  private generateNextQuestionRecommendation(
    adjustedDifficulty: number,
    questionMetadata: QuestionDifficultyMetadata,
    sessionContext: any,
  ): {
    difficultyRange: [number, number];
    preferredTopics: string[];
    avoidTopics: string[];
  } {
    // Calculate difficulty range
    const range: [number, number] = [
      Math.max(1, adjustedDifficulty - 1),
      Math.min(10, adjustedDifficulty + 1),
    ];

    // Prefer topics from current question if performing well
    const preferredTopics =
      sessionContext.currentAccuracy > 0.7 ? questionMetadata.topics : [];

    // Avoid topics if struggling
    const avoidTopics =
      sessionContext.currentAccuracy < 0.5 ? questionMetadata.topics : [];

    return {
      difficultyRange: range,
      preferredTopics,
      avoidTopics,
    };
  }

  private async getAICalibration(
    questionId: string,
    levelSuccessRates: Map<string, { correct: number; total: number }>,
    userResponses: any[],
  ): Promise<{
    calibratedDifficulty: number;
    confidence: number;
    recommendedAdjustment: number;
  }> {
    try {
      const successRateData = Array.from(levelSuccessRates.entries())
        .map(
          ([level, stats]) =>
            `${level}: ${((stats.correct / stats.total) * 100).toFixed(1)}%`,
        )
        .join(', ');

      const prompt = `
Kalibrer spørgsmåls sværhedsgrad baseret på brugerdata:

Spørgsmål ID: ${questionId}
Antal svar: ${userResponses.length}
Succesrate per niveau: ${successRateData}

Generer kalibrering i JSON format:
{
  "calibratedDifficulty": 5.5,
  "confidence": 0.8,
  "recommendedAdjustment": 0.2
}
`;

      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI der kalibrerer spørgsmåls sværhedsgrad. Svar kun med valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI calibration, using statistical fallback',
        error,
      );

      // Statistical fallback
      const totalResponses = userResponses.length;
      const correctResponses = userResponses.filter((r) => r.isCorrect).length;
      const successRate = correctResponses / totalResponses;

      // Estimate difficulty based on success rate
      const calibratedDifficulty =
        successRate > 0.8
          ? 3
          : successRate > 0.6
            ? 5
            : successRate > 0.4
              ? 7
              : 9;

      return {
        calibratedDifficulty,
        confidence: Math.min(0.9, totalResponses / 10),
        recommendedAdjustment: 0,
      };
    }
  }
}
