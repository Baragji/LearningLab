import { Injectable, Logger } from '@nestjs/common';
import { AIProviderService } from './ai-provider.service';
import { EmbeddingService } from './embedding.service';

export interface QuizResponse {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionText: string;
  options: string[];
  explanation?: string;
}

export interface FeedbackRequest {
  userId: number;
  quizResponses: QuizResponse[];
  lessonId?: number;
  courseId?: number;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SingleQuestionFeedbackRequest {
  userId: number;
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  questionText: string;
  questionTopic?: string;
  confidence?: number;
  timeSpent?: number;
}

export interface PersonalizedFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedFeedback: QuestionFeedback[];
  nextSteps: string[];
  estimatedStudyTime: number;
  motivationalMessage: string;
}

export interface QuestionFeedback {
  questionId: string;
  feedback: string;
  conceptsToReview: string[];
  additionalResources: string[];
  difficultyAdjustment: 'easier' | 'same' | 'harder';
}

export interface LearningAssistanceRequest {
  userId: number;
  question: string;
  context?: string;
  lessonId?: number;
  courseId?: number;
  learningStyle?: string;
}

export interface LearningAssistanceResponse {
  answer: string;
  explanation: string;
  relatedConcepts: string[];
  suggestedActions: string[];
  confidence: number;
}

// Export alias for PersonalizedFeedback to match controller import
export type FeedbackResponse = PersonalizedFeedback;

@Injectable()
export class AIFeedbackService {
  private readonly logger = new Logger(AIFeedbackService.name);

  constructor(
    private aiProviderService: AIProviderService,
    private embeddingService: EmbeddingService,
  ) {}

  /**
   * Generate personalized feedback based on quiz responses
   */
  async generateQuizFeedback(
    request: FeedbackRequest,
  ): Promise<PersonalizedFeedback> {
    try {
      const { userId, quizResponses, learningStyle, difficultyLevel } = request;

      // Calculate overall performance metrics
      const correctAnswers = quizResponses.filter((r) => r.isCorrect).length;
      const totalQuestions = quizResponses.length;
      const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

      // Analyze patterns in incorrect answers
      const incorrectResponses = quizResponses.filter((r) => !r.isCorrect);

      // Generate detailed feedback for each question
      const detailedFeedback = await this.generateDetailedQuestionFeedback(
        quizResponses,
        learningStyle,
      );

      // Generate overall insights
      const insights = await this.generateOverallInsights(
        quizResponses,
        overallScore,
        learningStyle,
        difficultyLevel,
      );

      this.logger.log(
        `Generated feedback for user ${userId} with score ${overallScore}%`,
      );

      return {
        overallScore,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses,
        recommendations: insights.recommendations,
        detailedFeedback,
        nextSteps: insights.nextSteps,
        estimatedStudyTime: this.calculateEstimatedStudyTime(
          incorrectResponses.length,
        ),
        motivationalMessage: this.generateMotivationalMessage(
          overallScore,
          learningStyle,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to generate quiz feedback', error);
      throw new Error(
        `Failed to generate quiz feedback: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Provide learning assistance for specific questions
   */
  async provideLearningAssistance(
    request: LearningAssistanceRequest,
  ): Promise<LearningAssistanceResponse> {
    try {
      const { userId, question, context, learningStyle } = request;

      // Search for relevant content using embeddings
      const relevantContent = await this.findRelevantContent(question, context);

      // Generate contextual assistance
      const assistancePrompt = this.buildAssistancePrompt(
        question,
        context,
        relevantContent,
        learningStyle,
      );

      const response = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en hjælpsom AI-lærer, der giver personaliseret læringsassistance. Svar på dansk og tilpas dit svar til brugerens læringsstil.',
        },
        {
          role: 'user',
          content: assistancePrompt,
        },
      ]);

      const parsedResponse = this.parseAssistanceResponse(response.content);

      this.logger.log(`Provided learning assistance for user ${userId}`);

      return parsedResponse;
    } catch (error) {
      this.logger.error('Failed to provide learning assistance', error);
      throw new Error(
        `Failed to provide learning assistance: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get feedback history for a user
   */
  async getFeedbackHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      // This would typically fetch from a database
      // For now, return empty array as placeholder
      this.logger.log(`Fetching feedback history for user ${userId}`);
      return [];
    } catch (error) {
      this.logger.error('Failed to get feedback history', error);
      throw new Error(
        `Failed to get feedback history: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate detailed feedback for individual questions
   */
  private async generateDetailedQuestionFeedback(
    responses: QuizResponse[],
    learningStyle?: string,
  ): Promise<QuestionFeedback[]> {
    const feedback: QuestionFeedback[] = [];

    for (const response of responses) {
      if (!response.isCorrect) {
        const questionFeedback = await this.generateSingleQuestionFeedback(
          response,
          learningStyle,
        );
        feedback.push(questionFeedback);
      }
    }

    return feedback;
  }

  /**
   * Generate feedback for a single question
   */
  private async generateSingleQuestionFeedback(
    response: QuizResponse,
    learningStyle?: string,
  ): Promise<QuestionFeedback> {
    const prompt = `
Analyser dette quiz-svar og giv konstruktiv feedback:

Spørgsmål: ${response.questionText}
Brugerens svar: ${response.userAnswer}
Korrekte svar: ${response.correctAnswer}
Læringsstil: ${learningStyle || 'ikke specificeret'}

Giv feedback der:
1. Forklarer hvorfor svaret var forkert
2. Hjælper brugeren med at forstå det korrekte koncept
3. Foreslår specifikke trin til forbedring
4. Tilpasser sig brugerens læringsstil

Svar i JSON format:
{
  "feedback": "Detaljeret feedback",
  "conceptsToReview": ["koncept1", "koncept2"],
  "additionalResources": ["ressource1", "ressource2"],
  "difficultyAdjustment": "easier|same|harder"
}
`;

    try {
      const aiResponse = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en ekspert lærer der giver konstruktiv feedback. Svar kun med valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const parsed = JSON.parse(aiResponse.content);

      return {
        questionId: response.questionId,
        ...parsed,
      };
    } catch (error) {
      this.logger.warn('Failed to generate AI feedback, using fallback', error);
      return {
        questionId: response.questionId,
        feedback: 'Det korrekte svar var: ' + response.correctAnswer,
        conceptsToReview: [],
        additionalResources: [],
        difficultyAdjustment: 'same',
      };
    }
  }

  /**
   * Generate overall insights from quiz performance
   */
  private async generateOverallInsights(
    responses: QuizResponse[],
    score: number,
    learningStyle?: string,
    difficultyLevel?: string,
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    const correctAnswers = responses.filter((r) => r.isCorrect);
    const incorrectAnswers = responses.filter((r) => !r.isCorrect);

    const prompt = `
Analyser denne quiz-performance og giv indsigter:

Samlet score: ${score}%
Korrekte svar: ${correctAnswers.length}/${responses.length}
Læringsstil: ${learningStyle || 'ikke specificeret'}
Sværhedsgrad: ${difficultyLevel || 'ikke specificeret'}

Forkerte svar:
${incorrectAnswers.map((r) => `- ${r.questionText}: ${r.userAnswer} (korrekt: ${r.correctAnswer})`).join('\n')}

Giv indsigter i JSON format:
{
  "strengths": ["styrke1", "styrke2"],
  "weaknesses": ["svaghed1", "svaghed2"],
  "recommendations": ["anbefaling1", "anbefaling2"],
  "nextSteps": ["næste_skridt1", "næste_skridt2"]
}
`;

    try {
      const aiResponse = await this.aiProviderService.generateChatCompletion([
        {
          role: 'system',
          content:
            'Du er en læringskonsulent der analyserer quiz-performance. Svar kun med valid JSON på dansk.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return JSON.parse(aiResponse.content);
    } catch (error) {
      this.logger.warn('Failed to generate AI insights, using fallback', error);
      return {
        strengths: score >= 70 ? ['God grundlæggende forståelse'] : [],
        weaknesses: score < 70 ? ['Behov for mere øvelse'] : [],
        recommendations: ['Gennemgå materialet igen', 'Øv med flere spørgsmål'],
        nextSteps: ['Fortsæt til næste lektion', 'Gentag svære emner'],
      };
    }
  }

  /**
   * Find relevant content using semantic search
   */
  private async findRelevantContent(
    question: string,
    context?: string,
  ): Promise<string[]> {
    try {
      const searchQuery = context ? `${question} ${context}` : question;
      const results = await this.embeddingService.semanticSearch({
        query: searchQuery,
        limit: 3,
        threshold: 0.7,
      });

      return results.map((result) => result.document.content);
    } catch (error) {
      this.logger.warn('Failed to find relevant content', error);
      return [];
    }
  }

  /**
   * Build assistance prompt
   */
  private buildAssistancePrompt(
    question: string,
    context?: string,
    relevantContent?: string[],
    learningStyle?: string,
  ): string {
    let prompt = `Brugerens spørgsmål: ${question}\n`;

    if (context) {
      prompt += `Kontekst: ${context}\n`;
    }

    if (learningStyle) {
      prompt += `Læringsstil: ${learningStyle}\n`;
    }

    if (relevantContent && relevantContent.length > 0) {
      prompt += `\nRelevant indhold:\n${relevantContent.join('\n\n')}\n`;
    }

    prompt += `\nGiv et hjælpsomt svar der:\n1. Besvarer spørgsmålet klart og præcist\n2. Giver en forklaring der passer til læringsstilen\n3. Foreslår relaterede koncepter at udforske\n4. Anbefaler konkrete handlinger\n\nSvar i JSON format:\n{\n  "answer": "Hovedsvar",\n  "explanation": "Detaljeret forklaring",\n  "relatedConcepts": ["koncept1", "koncept2"],\n  "suggestedActions": ["handling1", "handling2"],\n  "confidence": 0.95\n}`;

    return prompt;
  }

  /**
   * Parse assistance response
   */
  private parseAssistanceResponse(
    response: string,
  ): LearningAssistanceResponse {
    try {
      return JSON.parse(response);
    } catch (error) {
      this.logger.warn('Failed to parse AI response, using fallback', error);
      return {
        answer: response,
        explanation: 'Automatisk genereret svar',
        relatedConcepts: [],
        suggestedActions: ['Læs mere om emnet', 'Øv med flere eksempler'],
        confidence: 0.5,
      };
    }
  }

  /**
   * Calculate estimated study time based on performance
   */
  private calculateEstimatedStudyTime(incorrectAnswers: number): number {
    // Base time: 5 minutes per incorrect answer
    const baseTime = incorrectAnswers * 5;
    // Add buffer time
    return Math.max(baseTime, 10); // Minimum 10 minutes
  }

  /**
   * Generate feedback for a single question
   */
  async generateFeedback(
    request: SingleQuestionFeedbackRequest,
  ): Promise<FeedbackResponse> {
    try {
      const {
        userId,
        questionId,
        userAnswer,
        correctAnswer,
        questionText,
        questionTopic,
        confidence,
        timeSpent,
      } = request;

      const isCorrect =
        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      // Generate AI-powered feedback
      const feedbackText = await this.generateAIFeedback({
        questionText,
        userAnswer,
        correctAnswer,
        isCorrect,
        questionTopic,
        confidence,
        timeSpent,
      });

      return {
        overallScore: isCorrect ? 100 : 0,
        strengths: isCorrect ? [questionTopic || 'Good understanding'] : [],
        weaknesses: isCorrect ? [] : [questionTopic || 'Needs improvement'],
        recommendations: isCorrect
          ? []
          : await this.generateSuggestions(questionTopic),
        detailedFeedback: [
          {
            questionId: questionId.toString(),
            feedback: feedbackText,
            conceptsToReview: isCorrect
              ? []
              : [questionTopic || 'Review concepts'],
            additionalResources: [],
            difficultyAdjustment: 'same' as const,
          },
        ],
        nextSteps: isCorrect
          ? ['Continue to next topic']
          : ['Review and practice more'],
        estimatedStudyTime: isCorrect ? 0 : 15,
        motivationalMessage: this.generateMotivationalMessage(
          isCorrect ? 100 : 0,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to generate single question feedback', error);
      throw new Error(
        `Failed to generate feedback: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate AI-powered feedback for a single question
   */
  private async generateAIFeedback(params: {
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    questionTopic?: string;
    confidence?: number;
    timeSpent?: number;
  }): Promise<string> {
    const {
      questionText,
      userAnswer,
      correctAnswer,
      isCorrect,
      questionTopic,
    } = params;

    if (isCorrect) {
      return `Excellent! Your answer "${userAnswer}" is correct. ${questionTopic ? `You demonstrate good understanding of ${questionTopic}.` : ''}`;
    } else {
      return `Your answer "${userAnswer}" is not quite right. The correct answer is "${correctAnswer}". ${questionTopic ? `Consider reviewing the concepts related to ${questionTopic}.` : ''}`;
    }
  }

  /**
   * Generate suggestions for improvement
   */
  private async generateSuggestions(questionTopic?: string): Promise<string[]> {
    if (!questionTopic) {
      return [
        'Review the material and try again',
        'Take your time to read the question carefully',
      ];
    }

    return [
      `Study more about ${questionTopic}`,
      `Practice similar questions on ${questionTopic}`,
      `Review the key concepts of ${questionTopic}`,
    ];
  }

  /**
   * Generate motivational message based on performance
   */
  private generateMotivationalMessage(
    score: number,
    learningStyle?: string,
  ): string {
    if (score >= 90) {
      return 'Fantastisk arbejde! Du har virkelig styr på dette emne. 🌟';
    } else if (score >= 70) {
      return 'Godt klaret! Du er på rette vej. Fortsæt det gode arbejde! 👍';
    } else if (score >= 50) {
      return 'Du gør fremskridt! Med lidt mere øvelse bliver du endnu bedre. 💪';
    } else {
      return 'Alle starter et sted. Fortsæt med at øve dig - du kommer til at mestre det! 🚀';
    }
  }
}
