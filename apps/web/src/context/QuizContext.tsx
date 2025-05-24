"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Quiz, 
  Question, 
  AnswerOption, 
  UserAnswer 
} from '@repo/core/src/types/quiz.types';

// Extended Quiz type for our application
interface ExtendedQuiz extends Quiz {
  questions?: Question[];
  answerOptions?: Record<number, AnswerOption[]>;
  passingScore?: number;
}

interface QuizContextType {
  quiz: ExtendedQuiz | null;
  currentQuestionIndex: number;
  userAnswers: Record<number, number>; // questionId -> selectedOptionId
  isSubmitting: boolean;
  isSubmitted: boolean;
  score: number | null;
  
  // Actions
  setQuiz: (quiz: ExtendedQuiz) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  selectAnswer: (questionId: number, optionId: number) => void;
  submitQuiz: () => void;
  resetQuiz: () => void;
  
  // Computed values
  currentQuestion: Question | null;
  totalQuestions: number;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  hasAnsweredCurrentQuestion: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [quiz, setQuiz] = useState<ExtendedQuiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<Record<number, AnswerOption[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Set quiz data
  const handleSetQuiz = (quizData: ExtendedQuiz) => {
    console.log('Setting quiz data in context:', { 
      quizId: quizData.id, 
      hasQuestions: !!quizData.questions,
      questionsCount: quizData.questions?.length || 0
    });
    
    setQuiz(quizData);
    
    if (quizData.questions && quizData.questions.length > 0) {
      console.log('Setting questions:', quizData.questions.length);
      setQuestions(quizData.questions);
    }
    
    if (quizData.answerOptions) {
      console.log('Setting answer options');
      setAnswerOptions(quizData.answerOptions);
    }
    
    // Reset state when loading a new quiz
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  // Navigation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Answer selection
  const selectAnswer = (questionId: number, optionId: number) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: optionId
    });
  };

  // Quiz submission
  const submitQuiz = () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    
    // Calculate score
    let correctAnswers = 0;
    let totalAnswered = 0;
    
    questions.forEach(question => {
      const selectedOptionId = userAnswers[question.id];
      if (selectedOptionId) {
        totalAnswered++;
        const selectedOption = answerOptions[question.id]?.find(
          option => option.id === selectedOptionId
        );
        if (selectedOption?.isCorrect) {
          correctAnswers++;
        }
      }
    });
    
    const calculatedScore = totalAnswered > 0 
      ? Math.round((correctAnswers / questions.length) * 100) 
      : 0;
    
    setScore(calculatedScore);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  // Reset quiz state
  const resetQuiz = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setScore(null);
  };

  // Computed values
  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const hasAnsweredCurrentQuestion = currentQuestion 
    ? !!userAnswers[currentQuestion.id] 
    : false;

  const value = {
    quiz,
    currentQuestionIndex,
    userAnswers,
    isSubmitting,
    isSubmitted,
    score,
    
    setQuiz: handleSetQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    selectAnswer,
    submitQuiz,
    resetQuiz,
    
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    isFirstQuestion,
    hasAnsweredCurrentQuestion
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};