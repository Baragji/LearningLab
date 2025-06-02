import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../openai.service';
import { QuestionType, Difficulty } from '@prisma/client';
import { 
  ContentAnalysis, 
  GeneratedQuestion, 
  QuestionGenerationRequest,
  AIQuestionResponse,
  AnswerOption 
} from './types';

/**
 * Service til generering af spørgsmål baseret på indhold
 */
@Injectable()
export class QuestionGenerator {
  private readonly logger = new Logger(QuestionGenerator.name);

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Generer spørgsmål baseret på indhold og analyse
   */
  async generateQuestions(
    content: string,
    analysis: ContentAnalysis,
    request: QuestionGenerationRequest,
  ): Promise<GeneratedQuestion[]> {
    const numberOfQuestions = request.numberOfQuestions || 5;
    const questionTypes = request.questionTypes || [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.FILL_IN_BLANK,
    ];
    const targetDifficulty = request.targetDifficulty || 
      this.mapComplexityToDifficulty(analysis.complexity);

    const prompt = this.buildGenerationPrompt(
      content,
      analysis,
      numberOfQuestions,
      questionTypes,
      targetDifficulty,
      request.focusAreas,
    );

    try {
      const response = await this.openaiService.createChatCompletion(
        [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.7,
          max_tokens: 2000,
        },
      );

      return this.parseGeneratedQuestions(response);
    } catch (error) {
      this.logger.error('Fejl ved generering af spørgsmål', error);
      throw new Error('Fejl ved generering af spørgsmål. Prøv igen.');
    }
  }

  /**
   * System prompt for AI
   */
  private getSystemPrompt(): string {
    return `Du er en hjælpsom AI, der genererer quizspørgsmål på dansk ud fra undervisningsmateriale. Spørgsmålene skal være relevante, varierede og i forskellige sværhedsgrader. Svar kun i gyldig JSON som i eksemplet: [{"question": "...", "type": "MULTIPLE_CHOICE", "options": ["..."], "answer": "..."}, ...]`; 
////Lav relevante, præcise spørgsmål der tester forståelse. 
//Returner ALTID og KUN valid JSON som et array.`;
  }

  /**
   * Byg prompt til spørgsmålsgenerering
   */
  private buildGenerationPrompt(
    content: string,
    analysis: ContentAnalysis,
    numberOfQuestions: number,
    questionTypes: QuestionType[],
    targetDifficulty: Difficulty,
    focusAreas?: string[],
  ): string {
    return `
Generer ${numberOfQuestions} uddannelsesspørgsmål baseret på følgende indhold.

Indhold:
${content}

Analyse:
- Hovedemner: ${analysis.mainTopics.join(', ')}
- Nøgletermer: ${analysis.keyTerms.join(', ')}
- Kompleksitet: ${analysis.complexity}

Krav:
- Spørgsmålstyper: ${questionTypes.join(', ')}
- Sværhedsgrad: ${targetDifficulty}
- Fokusområder: ${focusAreas?.join(', ') || 'Alle emner'}

Returner et JSON array med præcis ${numberOfQuestions} spørgsmål.
Hvert spørgsmål skal have følgende struktur:
[
  {
    "text": "Spørgsmålstekst",
    "type": "MULTIPLE_CHOICE|FILL_IN_BLANK|ESSAY|MATCHING|CODE|DRAG_AND_DROP",
    "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
    "points": 1-5,
    "answerOptions": [{ "text": "Svar", "isCorrect": true/false }], // kun for MULTIPLE_CHOICE
    "essayMinWords": 50, // kun for ESSAY
    "essayMaxWords": 200, // kun for ESSAY
    "reasoning": "Forklaring af hvorfor dette spørgsmål er relevant"
  }
]

// VIGTIGT: 
// - Returner KUN et JSON array, ingen anden tekst
//- For MULTIPLE_CHOICE: Inkluder præcis 4 svarmuligheder med kun ét korrekt svar
//- Sørg for at spørgsmålene dækker forskellige aspekter af indholdet
//- Spørgsmålene skal være klare og entydige`;
  }

  /**
   * Parse AI-genererede spørgsmål
   */
  private parseGeneratedQuestions(response: string): GeneratedQuestion[] {
    const cleanedResponse = response.trim();
    
    let questions: AIQuestionResponse[];
    try {
      questions = this.extractJSONFromResponse(cleanedResponse);
    } catch (error) {
      this.logger.error('Kunne ikke parse AI response', { error, response: cleanedResponse });
      throw new Error('Fejl ved parsing af AI-genererede spørgsmål');
    }

    return questions.map((q, index) => this.normalizeQuestion(q, index));
  }

  /**
   * Udtræk JSON fra AI response
   */
  private extractJSONFromResponse(response: string): AIQuestionResponse[] {
    try {
      return JSON.parse(response);
    } catch (firstError) {
      // Prøv at finde JSON array i teksten
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw firstError;
    }
  }

  /**
   * Normaliser et spørgsmål til standard format
   */
  private normalizeQuestion(question: AIQuestionResponse, index: number): GeneratedQuestion {
    const type = this.normalizeQuestionType(question.type);
    const difficulty = this.normalizeDifficulty(question.difficulty);
    
    return {
      text: question.text || `Spørgsmål ${index + 1}`,
      type,
      difficulty,
      points: question.points || this.calculateDefaultPoints(difficulty),
      answerOptions: type === QuestionType.MULTIPLE_CHOICE 
        ? this.normalizeAnswerOptions(question.answerOptions) 
        : undefined,
      essayMinWords: type === QuestionType.ESSAY ? (question.essayMinWords || 50) : undefined,
      essayMaxWords: type === QuestionType.ESSAY ? (question.essayMaxWords || 200) : undefined,
      reasoning: question.reasoning || 'Spørgsmålet tester forståelse af indholdet',
      qualityScore: 0, // Beregnes senere
    };
  }

  /**
   * Normaliser spørgsmålstype til valid enum værdi
   */
  private normalizeQuestionType(type: string): QuestionType {
    const typeMap: Record<string, QuestionType> = {
      'MULTIPLE_CHOICE': QuestionType.MULTIPLE_CHOICE,
      'FILL_IN_BLANK': QuestionType.FILL_IN_BLANK,
      'ESSAY': QuestionType.ESSAY,
      'MATCHING': QuestionType.MATCHING,
      'CODE': QuestionType.CODE,
      'DRAG_AND_DROP': QuestionType.DRAG_AND_DROP,
      'DRAG_DROP': QuestionType.DRAG_AND_DROP, // Alias
    };
    
    return typeMap[type?.toUpperCase()] || QuestionType.MULTIPLE_CHOICE;
  }

  /**
   * Normaliser sværhedsgrad til valid enum værdi
   */
  private normalizeDifficulty(difficulty: string): Difficulty {
    const difficultyMap: Record<string, Difficulty> = {
      'BEGINNER': Difficulty.BEGINNER,
      'INTERMEDIATE': Difficulty.INTERMEDIATE,
      'ADVANCED': Difficulty.ADVANCED,
      'EASY': Difficulty.BEGINNER,
      'MEDIUM': Difficulty.INTERMEDIATE,
      'HARD': Difficulty.ADVANCED,
    };
    
    return difficultyMap[difficulty?.toUpperCase()] || Difficulty.BEGINNER;
  }

  /**
   * Beregn standard point baseret på sværhedsgrad
   */
  private calculateDefaultPoints(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return 1;
      case Difficulty.INTERMEDIATE:
        return 3;
      case Difficulty.ADVANCED:
        return 5;
      default:
        return 2;
    }
  }

  /**
   * Normaliser svarmuligheder for multiple choice
   */
  private normalizeAnswerOptions(options?: AnswerOption[]): AnswerOption[] {
    if (!Array.isArray(options) || options.length === 0) {
      return this.getDefaultAnswerOptions();
    }
    
    // Sørg for at der er præcis ét korrekt svar
    const correctAnswers = options.filter(opt => opt.isCorrect);
    if (correctAnswers.length === 0) {
      options[0].isCorrect = true;
    } else if (correctAnswers.length > 1) {
      options.forEach((opt, index) => {
        opt.isCorrect = index === options.findIndex(o => o.isCorrect);
      });
    }
    
    return options.map(opt => ({
      text: opt.text || 'Svarmulighed',
      isCorrect: Boolean(opt.isCorrect),
    }));
  }

  /**
   * Standard svarmuligheder hvis ingen er givet
   */
  private getDefaultAnswerOptions(): AnswerOption[] {
    return [
      { text: 'Svar A', isCorrect: true },
      { text: 'Svar B', isCorrect: false },
      { text: 'Svar C', isCorrect: false },
      { text: 'Svar D', isCorrect: false },
    ];
  }

  /**
   * Map kompleksitet til sværhedsgrad
   */
  private mapComplexityToDifficulty(complexity: string): Difficulty {
    switch (complexity) {
      case 'beginner':
        return Difficulty.BEGINNER;
      case 'intermediate':
        return Difficulty.INTERMEDIATE;
      case 'advanced':
        return Difficulty.ADVANCED;
      default:
        return Difficulty.BEGINNER;
    }
  }
}