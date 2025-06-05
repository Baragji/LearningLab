import { Injectable, Logger } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { GeneratedQuestion, QualityScoreCriteria } from './types';

/**
 * Service til evaluering af spørgsmålskvalitet
 */
@Injectable()
export class QualityEvaluator {
  private readonly logger = new Logger(QualityEvaluator.name);

  /**
   * Evaluer kvaliteten af genererede spørgsmål
   */
  async evaluateQuestions(
    questions: GeneratedQuestion[],
  ): Promise<GeneratedQuestion[]> {
    const evaluatedQuestions = await Promise.all(
      questions.map(async (question) => ({
        ...question,
        qualityScore: await this.calculateQualityScore(question),
      })),
    );

    // Sorter efter kvalitet (højeste først)
    return evaluatedQuestions.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Beregn kvalitetsscore for et spørgsmål
   */
  private async calculateQualityScore(
    question: GeneratedQuestion,
  ): Promise<number> {
    const criteria: QualityScoreCriteria = {
      textLengthScore: this.evaluateTextLength(question.text),
      questionFormatScore: this.evaluateQuestionFormat(question.text),
      answerOptionsScore: this.evaluateAnswerOptions(question),
      essayRequirementsScore: this.evaluateEssayRequirements(question),
      reasoningScore: this.evaluateReasoning(question.reasoning),
    };

    return this.calculateWeightedScore(criteria, question.type);
  }

  /**
   * Evaluer spørgsmålstekstens længde
   */
  private evaluateTextLength(text: string): number {
    const length = text.length;
    if (length < 20) return 0;
    if (length > 200) return 5;
    if (length > 50 && length <= 150) return 10;
    return 7;
  }

  /**
   * Evaluer spørgsmålsformat
   */
  private evaluateQuestionFormat(text: string): number {
    let score = 0;

    // Indeholder spørgsmålstegn
    if (text.includes('?')) score += 5;

    // Undgå for simple spørgsmål
    const simpleWords = ['hvad', 'hvilken', 'hvem', 'hvor'];
    const hasSimpleStart = simpleWords.some((word) =>
      text.toLowerCase().startsWith(word),
    );
    if (!hasSimpleStart) score += 5;

    // Bonus for specifikke spørgsmålstyper
    const analyticalWords = ['forklar', 'analyser', 'sammenlign', 'vurder'];
    const hasAnalytical = analyticalWords.some((word) =>
      text.toLowerCase().includes(word),
    );
    if (hasAnalytical) score += 5;

    return score;
  }

  /**
   * Evaluer svarmuligheder for multiple choice
   */
  private evaluateAnswerOptions(question: GeneratedQuestion): number {
    if (
      question.type !== QuestionType.MULTIPLE_CHOICE ||
      !question.answerOptions
    ) {
      return 0;
    }

    let score = 0;
    const options = question.answerOptions;

    // Præcis ét korrekt svar
    const correctAnswers = options.filter((opt) => opt.isCorrect);
    if (correctAnswers.length === 1) score += 15;

    // Passende antal muligheder
    if (options.length >= 3 && options.length <= 5) score += 10;

    // Evaluer distraktorer (plausible forkerte svar)
    const avgLength =
      options.reduce((sum, opt) => sum + opt.text.length, 0) / options.length;
    if (avgLength > 5 && avgLength < 50) score += 10;

    // Alle muligheder har meningsfuld tekst
    const allMeaningful = options.every((opt) => opt.text.length > 3);
    if (allMeaningful) score += 5;

    return score;
  }

  /**
   * Evaluer essay krav
   */
  private evaluateEssayRequirements(question: GeneratedQuestion): number {
    if (question.type !== QuestionType.ESSAY) {
      return 0;
    }

    let score = 0;

    if (question.essayMinWords && question.essayMinWords >= 25) score += 10;
    if (question.essayMaxWords && question.essayMaxWords <= 500) score += 10;

    // Rimelig ordgrænse
    if (question.essayMinWords && question.essayMaxWords) {
      const range = question.essayMaxWords - question.essayMinWords;
      if (range >= 50 && range <= 200) score += 5;
    }

    return score;
  }

  /**
   * Evaluer reasoning kvalitet
   */
  private evaluateReasoning(reasoning: string): number {
    if (!reasoning) return 0;

    let score = 0;

    // Længde på reasoning
    if (reasoning.length > 30) score += 5;
    if (reasoning.length > 50) score += 5;

    // Indeholder pædagogiske termer
    const pedagogicalTerms = [
      'forståelse',
      'viden',
      'analyse',
      'anvendelse',
      'evaluering',
    ];
    const hasPedagogicalTerms = pedagogicalTerms.some((term) =>
      reasoning.toLowerCase().includes(term),
    );
    if (hasPedagogicalTerms) score += 5;

    return score;
  }

  /**
   * Beregn vægtet score baseret på spørgsmålstype
   */
  private calculateWeightedScore(
    criteria: QualityScoreCriteria,
    type: QuestionType,
  ): number {
    let totalScore = 50; // Base score

    // Generelle kriterier
    totalScore += criteria.textLengthScore;
    totalScore += criteria.questionFormatScore;
    totalScore += criteria.reasoningScore;

    // Type-specifikke kriterier
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        totalScore += criteria.answerOptionsScore;
        break;
      case QuestionType.ESSAY:
        totalScore += criteria.essayRequirementsScore;
        break;
      case QuestionType.CODE:
        // Kunne tilføje code-specifikke kriterier her
        totalScore += 10; // Bonus for code spørgsmål
        break;
    }

    // Normaliser til 0-100
    return Math.min(100, Math.max(0, totalScore));
  }
}
