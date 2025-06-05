import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import { EmbeddingService } from './embedding.service';

export interface UserPerformanceData {
  userId: number;
  courseId?: number;
  lessonId?: number;
  totalQuestions: number;
  correctAnswers: number;
  averageResponseTime: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  strengths: string[];
  weaknesses: string[];
  lastActivity: Date;
  streakDays: number;
  totalStudyTime: number;
}

export interface LearningPath {
  id: string;
  userId: number;
  title: string;
  description: string;
  estimatedDuration: number;
  difficultyProgression: string[];
  lessons: LearningPathLesson[];
  prerequisites: string[];
  learningObjectives: string[];
  adaptationReason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPathLesson {
  lessonId: number;
  order: number;
  estimatedTime: number;
  difficultyLevel: string;
  concepts: string[];
  isOptional: boolean;
  prerequisites: number[];
  adaptiveNotes?: string;
}

export interface DifficultyAdjustment {
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  adjustmentReason: string;
  confidence: number;
  suggestedActions: string[];
  timeToReassess: number; // in days
}

export interface ContentRecommendation {
  type: 'lesson' | 'quiz' | 'exercise' | 'review';
  contentId: number;
  title: string;
  description: string;
  estimatedTime: number;
  difficultyLevel: string;
  relevanceScore: number;
  reason: string;
  prerequisites: number[];
  learningObjectives: string[];
}

export interface AdaptiveLearningInsights {
  userId: number;
  overallProgress: number;
  learningVelocity: number;
  retentionRate: number;
  engagementLevel: 'low' | 'medium' | 'high';
  recommendedStudyTime: number;
  nextMilestone: string;
  areasForImprovement: string[];
  strengthAreas: string[];
  personalizedTips: string[];
}

// Export alias for ContentRecommendation to match controller import
export type LearningRecommendation = ContentRecommendation;

@Injectable()
export class AdaptiveLearningService {
  private readonly logger = new Logger(AdaptiveLearningService.name);

  constructor(
    private aiProviderService: AIProviderService,
    private embeddingService: EmbeddingService,
  ) {}

  /**
   * Analyze user performance and suggest difficulty adjustments
   */
  async analyzeDifficultyAdjustment(
    performanceData: UserPerformanceData,
  ): Promise<DifficultyAdjustment> {
    try {
      const {
        userId,
        totalQuestions,
        correctAnswers,
        averageResponseTime,
        difficultyLevel,
      } = performanceData;

      const accuracy = (correctAnswers / totalQuestions) * 100;
      const responseTimeScore = this.calculateResponseTimeScore(
        averageResponseTime,
        difficultyLevel,
      );

      // AI-powered difficulty analysis
      const aiAnalysis = await this.getAIDifficultyRecommendation(
        performanceData,
        accuracy,
        responseTimeScore,
      );

      const adjustment: DifficultyAdjustment = {
        currentLevel: difficultyLevel,
        recommendedLevel: aiAnalysis.recommendedLevel,
        adjustmentReason: aiAnalysis.reason,
        confidence: aiAnalysis.confidence,
        suggestedActions: aiAnalysis.actions,
        timeToReassess: this.calculateReassessmentTime(
          accuracy,
          performanceData.streakDays,
        ),
      };

      this.logger.log(
        `Difficulty adjustment for user ${userId}: ${difficultyLevel} -> ${adjustment.recommendedLevel}`,
      );

      return adjustment;
    } catch (error) {
      this.logger.error('Failed to analyze difficulty adjustment', error);
      throw new Error(
        `Failed to analyze difficulty adjustment: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate personalized learning path
   */
  async generatePersonalizedLearningPath(
    userId: number,
    performanceData: UserPerformanceData,
    availableLessons: any[],
    learningGoals?: string[],
  ): Promise<LearningPath> {
    try {
      // AI-powered path generation
      const pathRecommendation = await this.getAILearningPathRecommendation(
        performanceData,
        availableLessons,
        learningGoals,
      );

      const learningPath: LearningPath = {
        id: `path_${userId}_${Date.now()}`,
        userId,
        title: pathRecommendation.title,
        description: pathRecommendation.description,
        estimatedDuration: pathRecommendation.estimatedDuration,
        difficultyProgression: pathRecommendation.difficultyProgression,
        lessons: pathRecommendation.lessons,
        prerequisites: pathRecommendation.prerequisites,
        learningObjectives: pathRecommendation.objectives,
        adaptationReason: pathRecommendation.reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(
        `Generated personalized learning path for user ${userId}`,
      );

      return learningPath;
    } catch (error) {
      this.logger.error('Failed to generate personalized learning path', error);
      throw new Error(
        `Failed to generate personalized learning path: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get content recommendations based on performance
   */
  async getContentRecommendations(
    performanceData: UserPerformanceData,
    availableContent: any[],
    limit: number = 5,
  ): Promise<ContentRecommendation[]> {
    try {
      // Analyze user's weak areas
      const weakAreas = performanceData.weaknesses;
      const strongAreas = performanceData.strengths;

      // AI-powered content recommendation
      const aiRecommendations = await this.getAIContentRecommendations(
        performanceData,
        availableContent,
        weakAreas,
        strongAreas,
        limit,
      );

      this.logger.log(
        `Generated ${aiRecommendations.length} content recommendations for user ${performanceData.userId}`,
      );

      return aiRecommendations;
    } catch (error) {
      this.logger.error('Failed to get content recommendations', error);
      throw new Error(
        `Failed to get content recommendations: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate adaptive learning insights
   */
  async generateLearningInsights(
    performanceData: UserPerformanceData,
    historicalData: UserPerformanceData[],
  ): Promise<AdaptiveLearningInsights> {
    try {
      const progress = this.calculateOverallProgress(
        performanceData,
        historicalData,
      );
      const velocity = this.calculateLearningVelocity(historicalData);
      const retention = this.calculateRetentionRate(historicalData);
      const engagement = this.calculateEngagementLevel(performanceData);

      // AI-powered insights generation
      const aiInsights = await this.getAILearningInsights(
        performanceData,
        progress,
        velocity,
        retention,
        engagement,
      );

      const insights: AdaptiveLearningInsights = {
        userId: performanceData.userId,
        overallProgress: progress,
        learningVelocity: velocity,
        retentionRate: retention,
        engagementLevel: engagement,
        recommendedStudyTime: aiInsights.recommendedStudyTime,
        nextMilestone: aiInsights.nextMilestone,
        areasForImprovement: aiInsights.areasForImprovement,
        strengthAreas: aiInsights.strengthAreas,
        personalizedTips: aiInsights.personalizedTips,
      };

      this.logger.log(
        `Generated learning insights for user ${performanceData.userId}`,
      );

      return insights;
    } catch (error) {
      this.logger.error('Failed to generate learning insights', error);
      throw new Error(
        `Failed to generate learning insights: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Update learning path based on new performance data
   */
  async updateLearningPath(
    currentPath: LearningPath,
    newPerformanceData: UserPerformanceData,
  ): Promise<LearningPath> {
    try {
      // AI-powered path adaptation
      const adaptationRecommendation = await this.getAIPathAdaptation(
        currentPath,
        newPerformanceData,
      );

      const updatedPath: LearningPath = {
        ...currentPath,
        lessons: adaptationRecommendation.updatedLessons,
        difficultyProgression: adaptationRecommendation.updatedProgression,
        adaptationReason: adaptationRecommendation.reason,
        updatedAt: new Date(),
      };

      this.logger.log(`Updated learning path for user ${currentPath.userId}`);

      return updatedPath;
    } catch (error) {
      this.logger.error('Failed to update learning path', error);
      throw new Error(
        `Failed to update learning path: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get AI-powered difficulty recommendation
   */
  private async getAIDifficultyRecommendation(
    performanceData: UserPerformanceData,
    accuracy: number,
    responseTimeScore: number,
  ): Promise<{
    recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
    reason: string;
    confidence: number;
    actions: string[];
  }> {
    const prompt = `
Analyser brugerens performance og anbefal sværhedsgrad:

Nuværende niveau: ${performanceData.difficultyLevel}
Nøjagtighed: ${accuracy}%
Gennemsnitlig svartid score: ${responseTimeScore}
Læringsstil: ${performanceData.learningStyle}
Styrker: ${performanceData.strengths.join(', ')}
Svagheder: ${performanceData.weaknesses.join(', ')}
Streak dage: ${performanceData.streakDays}
Samlet studietid: ${performanceData.totalStudyTime} minutter

Anbefal det optimale sværhedsgrad baseret på:
1. Performance metrics (nøjagtighed og svartid)
2. Læringsprogression
3. Engagement niveau
4. Læringsstil

Svar i JSON format:
{
  "recommendedLevel": "beginner|intermediate|advanced",
  "reason": "Detaljeret begrundelse",
  "confidence": 0.95,
  "actions": ["handling1", "handling2"]
}
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der analyserer brugerperformance og anbefaler optimal sværhedsgrad. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI difficulty recommendation, using fallback',
        error,
      );
      return this.getFallbackDifficultyRecommendation(
        accuracy,
        performanceData.difficultyLevel,
      );
    }
  }

  /**
   * Get AI-powered learning path recommendation
   */
  private async getAILearningPathRecommendation(
    performanceData: UserPerformanceData,
    availableLessons: any[],
    learningGoals?: string[],
  ): Promise<{
    title: string;
    description: string;
    estimatedDuration: number;
    difficultyProgression: string[];
    lessons: LearningPathLesson[];
    prerequisites: string[];
    objectives: string[];
    reason: string;
  }> {
    const prompt = `
Generer en personaliseret læringssti:

Bruger performance:
- Niveau: ${performanceData.difficultyLevel}
- Læringsstil: ${performanceData.learningStyle}
- Styrker: ${performanceData.strengths.join(', ')}
- Svagheder: ${performanceData.weaknesses.join(', ')}
- Studietid: ${performanceData.totalStudyTime} minutter

Læringsmål: ${learningGoals?.join(', ') || 'Ikke specificeret'}

Tilgængelige lektioner: ${availableLessons.length} lektioner

Opret en optimal læringssti der:
1. Matcher brugerens niveau og læringsstil
2. Adresserer svagheder gradvist
3. Bygger på styrker
4. Har realistisk progression

Svar i JSON format:
{
  "title": "Personaliseret læringssti titel",
  "description": "Beskrivelse af læringsstien",
  "estimatedDuration": 120,
  "difficultyProgression": ["beginner", "intermediate"],
  "lessons": [
    {
      "lessonId": 1,
      "order": 1,
      "estimatedTime": 30,
      "difficultyLevel": "beginner",
      "concepts": ["koncept1"],
      "isOptional": false,
      "prerequisites": [],
      "adaptiveNotes": "Tilpasset til brugerens behov"
    }
  ],
  "prerequisites": ["forudsætning1"],
  "objectives": ["mål1", "mål2"],
  "reason": "Begrundelse for denne læringssti"
}
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der designer personaliserede læringsstier. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI learning path recommendation, using fallback',
        error,
      );
      return this.getFallbackLearningPath(performanceData);
    }
  }

  /**
   * Get AI-powered content recommendations
   */
  private async getAIContentRecommendations(
    performanceData: UserPerformanceData,
    availableContent: any[],
    weakAreas: string[],
    strongAreas: string[],
    limit: number,
  ): Promise<ContentRecommendation[]> {
    const prompt = `
Anbefal indhold baseret på brugerens performance:

Bruger profil:
- Niveau: ${performanceData.difficultyLevel}
- Læringsstil: ${performanceData.learningStyle}
- Svage områder: ${weakAreas.join(', ')}
- Stærke områder: ${strongAreas.join(', ')}

Prioriteter:
1. Styrk svage områder
2. Byg på stærke områder
3. Match læringsstil
4. Passende sværhedsgrad

Anbefal ${limit} stykker indhold i JSON format:
[
  {
    "type": "lesson|quiz|exercise|review",
    "contentId": 1,
    "title": "Indhold titel",
    "description": "Beskrivelse",
    "estimatedTime": 30,
    "difficultyLevel": "beginner",
    "relevanceScore": 0.95,
    "reason": "Hvorfor dette indhold anbefales",
    "prerequisites": [],
    "learningObjectives": ["mål1"]
  }
]
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der anbefaler relevant indhold. Svar kun med valid JSON array på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI content recommendations, using fallback',
        error,
      );
      return this.getFallbackContentRecommendations(performanceData, limit);
    }
  }

  /**
   * Get AI-powered learning insights
   */
  private async getAILearningInsights(
    performanceData: UserPerformanceData,
    progress: number,
    velocity: number,
    retention: number,
    engagement: 'low' | 'medium' | 'high',
  ): Promise<{
    recommendedStudyTime: number;
    nextMilestone: string;
    areasForImprovement: string[];
    strengthAreas: string[];
    personalizedTips: string[];
  }> {
    const prompt = `
Generer læringsindsigter baseret på data:

Bruger metrics:
- Samlet fremgang: ${progress}%
- Læringshastighed: ${velocity}
- Fastholdelsesrate: ${retention}%
- Engagement niveau: ${engagement}
- Nuværende niveau: ${performanceData.difficultyLevel}
- Læringsstil: ${performanceData.learningStyle}
- Styrker: ${performanceData.strengths.join(', ')}
- Svagheder: ${performanceData.weaknesses.join(', ')}

Generer personaliserede indsigter i JSON format:
{
  "recommendedStudyTime": 45,
  "nextMilestone": "Næste milepæl beskrivelse",
  "areasForImprovement": ["område1", "område2"],
  "strengthAreas": ["styrke1", "styrke2"],
  "personalizedTips": ["tip1", "tip2", "tip3"]
}
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der genererer personaliserede læringsindsigter. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI learning insights, using fallback',
        error,
      );
      return this.getFallbackLearningInsights(performanceData);
    }
  }

  /**
   * Get AI-powered path adaptation
   */
  private async getAIPathAdaptation(
    currentPath: LearningPath,
    newPerformanceData: UserPerformanceData,
  ): Promise<{
    updatedLessons: LearningPathLesson[];
    updatedProgression: string[];
    reason: string;
  }> {
    const prompt = `
Tilpas læringssti baseret på ny performance:

Nuværende sti:
- Titel: ${currentPath.title}
- Antal lektioner: ${currentPath.lessons.length}
- Sværhedsgrad progression: ${currentPath.difficultyProgression.join(' -> ')}

Ny performance data:
- Nøjagtighed: ${(newPerformanceData.correctAnswers / newPerformanceData.totalQuestions) * 100}%
- Niveau: ${newPerformanceData.difficultyLevel}
- Nye styrker: ${newPerformanceData.strengths.join(', ')}
- Nye svagheder: ${newPerformanceData.weaknesses.join(', ')}

Tilpas læringsstien for optimal progression i JSON format:
{
  "updatedLessons": [
    {
      "lessonId": 1,
      "order": 1,
      "estimatedTime": 30,
      "difficultyLevel": "beginner",
      "concepts": ["koncept1"],
      "isOptional": false,
      "prerequisites": [],
      "adaptiveNotes": "Tilpasset baseret på ny performance"
    }
  ],
  "updatedProgression": ["beginner", "intermediate"],
  "reason": "Begrundelse for tilpasninger"
}
`;

    try {
      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en AI læringskonsulent der tilpasser læringsstier. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'Failed to get AI path adaptation, using fallback',
        error,
      );
      return {
        updatedLessons: currentPath.lessons,
        updatedProgression: currentPath.difficultyProgression,
        reason: 'Automatisk tilpasning baseret på performance',
      };
    }
  }

  // Helper methods
  private calculateResponseTimeScore(
    averageTime: number,
    difficulty: string,
  ): number {
    const expectedTimes = {
      beginner: 45,
      intermediate: 60,
      advanced: 90,
    };

    const expected = expectedTimes[difficulty] || 60;
    return Math.max(0, Math.min(100, (expected / averageTime) * 100));
  }

  private calculateReassessmentTime(
    accuracy: number,
    streakDays: number,
  ): number {
    if (accuracy >= 90) return 7; // Weekly for high performers
    if (accuracy >= 70) return 5; // Every 5 days for good performers
    return 3; // Every 3 days for struggling learners
  }

  private calculateOverallProgress(
    current: UserPerformanceData,
    historical: UserPerformanceData[],
  ): number {
    if (historical.length === 0) return 0;

    const currentAccuracy =
      (current.correctAnswers / current.totalQuestions) * 100;
    const historicalAccuracy = historical.map(
      (h) => (h.correctAnswers / h.totalQuestions) * 100,
    );
    const averageHistorical =
      historicalAccuracy.reduce((a, b) => a + b, 0) / historicalAccuracy.length;

    return Math.max(0, Math.min(100, currentAccuracy));
  }

  private calculateLearningVelocity(historical: UserPerformanceData[]): number {
    if (historical.length < 2) return 0;

    const recent = historical.slice(-5); // Last 5 sessions
    const accuracies = recent.map(
      (h) => (h.correctAnswers / h.totalQuestions) * 100,
    );

    // Calculate trend
    let trend = 0;
    for (let i = 1; i < accuracies.length; i++) {
      trend += accuracies[i] - accuracies[i - 1];
    }

    return trend / (accuracies.length - 1);
  }

  private calculateRetentionRate(historical: UserPerformanceData[]): number {
    if (historical.length < 2) return 100;

    // Simple retention calculation based on consistency
    const accuracies = historical.map(
      (h) => (h.correctAnswers / h.totalQuestions) * 100,
    );
    const variance = this.calculateVariance(accuracies);

    return Math.max(0, 100 - variance);
  }

  private calculateEngagementLevel(
    performance: UserPerformanceData,
  ): 'low' | 'medium' | 'high' {
    const factors = [
      performance.streakDays >= 7 ? 1 : 0,
      performance.totalStudyTime >= 60 ? 1 : 0,
      performance.correctAnswers / performance.totalQuestions >= 0.7 ? 1 : 0,
    ];

    const score = factors.reduce((a, b) => a + b, 0);

    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Fallback methods
  private getFallbackDifficultyRecommendation(
    accuracy: number,
    currentLevel: string,
  ) {
    if (accuracy >= 90) {
      const nextLevel =
        currentLevel === 'beginner'
          ? 'intermediate'
          : currentLevel === 'intermediate'
            ? 'advanced'
            : 'advanced';
      return {
        recommendedLevel: nextLevel as any,
        reason: 'Høj nøjagtighed indikerer klar til næste niveau',
        confidence: 0.8,
        actions: ['Prøv sværere indhold', 'Udforsk avancerede emner'],
      };
    } else if (accuracy < 60) {
      const prevLevel =
        currentLevel === 'advanced'
          ? 'intermediate'
          : currentLevel === 'intermediate'
            ? 'beginner'
            : 'beginner';
      return {
        recommendedLevel: prevLevel as any,
        reason: 'Lav nøjagtighed indikerer behov for mere grundlæggende øvelse',
        confidence: 0.8,
        actions: [
          'Gennemgå grundlæggende koncepter',
          'Øv mere på nuværende niveau',
        ],
      };
    }

    return {
      recommendedLevel: currentLevel as any,
      reason: 'Nuværende niveau passer godt',
      confidence: 0.7,
      actions: ['Fortsæt på nuværende niveau', 'Fokuser på svage områder'],
    };
  }

  private getFallbackLearningPath(performanceData: UserPerformanceData) {
    return {
      title: `Personaliseret læringssti for ${performanceData.learningStyle} lærende`,
      description:
        'Tilpasset læringssti baseret på din performance og læringsstil',
      estimatedDuration: 120,
      difficultyProgression: [performanceData.difficultyLevel],
      lessons: [],
      prerequisites: [],
      objectives: ['Forbedre svage områder', 'Styrke eksisterende færdigheder'],
      reason: 'Automatisk genereret baseret på brugerdata',
    };
  }

  private getFallbackContentRecommendations(
    performanceData: UserPerformanceData,
    limit: number,
  ): ContentRecommendation[] {
    return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      type: 'lesson' as const,
      contentId: i + 1,
      title: `Anbefalet lektion ${i + 1}`,
      description: 'Automatisk anbefalet indhold',
      estimatedTime: 30,
      difficultyLevel: performanceData.difficultyLevel,
      relevanceScore: 0.7,
      reason: 'Baseret på din læringsprofil',
      prerequisites: [],
      learningObjectives: ['Forbedre forståelse'],
    }));
  }

  private getFallbackLearningInsights(performanceData: UserPerformanceData) {
    return {
      recommendedStudyTime: 45,
      nextMilestone: 'Fortsæt med at øve dig regelmæssigt',
      areasForImprovement: performanceData.weaknesses.slice(0, 3),
      strengthAreas: performanceData.strengths.slice(0, 3),
      personalizedTips: [
        'Øv regelmæssigt for bedre resultater',
        'Fokuser på dine svage områder',
        'Byg videre på dine styrker',
      ],
    };
  }

  /**
   * Analyze user performance data
   */
  async analyzeUserPerformance(
    userId: number,
    courseId?: number,
    timeframe?: string,
  ): Promise<UserPerformanceData> {
    try {
      this.logger.log(`Analyzing performance for user ${userId}`);

      // This would typically fetch real data from database
      // For now, return mock data structure
      return {
        userId,
        courseId,
        totalQuestions: 50,
        correctAnswers: 35,
        averageResponseTime: 45,
        difficultyLevel: 'intermediate',
        learningStyle: 'visual',
        strengths: ['Mathematics', 'Logic'],
        weaknesses: ['Reading Comprehension', 'Writing'],
        lastActivity: new Date(),
        streakDays: 7,
        totalStudyTime: 1200,
      };
    } catch (error) {
      this.logger.error('Failed to analyze user performance', error);
      throw new Error(
        `Failed to analyze performance: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generatePersonalizedRecommendations(
    userId: number,
    performanceData?: UserPerformanceData,
    preferences?: any,
  ): Promise<LearningRecommendation[]> {
    try {
      this.logger.log(`Generating recommendations for user ${userId}`);

      const userData =
        performanceData || (await this.analyzeUserPerformance(userId));

      // Generate recommendations based on performance
      const recommendations: LearningRecommendation[] = [];

      // Add weakness-focused recommendations
      userData.weaknesses.forEach((weakness, index) => {
        recommendations.push({
          type: 'exercise',
          contentId: index + 1,
          title: `Improve ${weakness}`,
          description: `Focus on strengthening your ${weakness} skills`,
          estimatedTime: 30,
          difficultyLevel: userData.difficultyLevel,
          relevanceScore: 0.8,
          reason: `Practice ${weakness} exercises and review ${weakness} concepts`,
          prerequisites: [],
          learningObjectives: [`Improve ${weakness} skills`],
        });
      });

      // Add strength-building recommendations
      userData.strengths.forEach((strength, index) => {
        recommendations.push({
          type: 'lesson',
          contentId: userData.weaknesses.length + index + 1,
          title: `Advance ${strength}`,
          description: `Build upon your strong ${strength} foundation`,
          estimatedTime: 25,
          difficultyLevel: userData.difficultyLevel,
          relevanceScore: 0.9,
          reason: `Advanced ${strength} challenges and apply ${strength} in new contexts`,
          prerequisites: [],
          learningObjectives: [`Advance ${strength} skills`],
        });
      });

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      this.logger.error(
        'Failed to generate personalized recommendations',
        error,
      );
      throw new Error(
        `Failed to generate recommendations: ${(error as Error).message}`,
      );
    }
  }
}
