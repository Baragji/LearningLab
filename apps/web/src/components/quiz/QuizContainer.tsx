import React, { useEffect } from 'react';
import { Quiz, Question, AnswerOption } from '@repo/core/src/types/quiz.types';
import { useQuiz } from '../../context/QuizContext';
import QuizQuestion from './QuizQuestion';
import QuizNavigation from './QuizNavigation';
import QuizProgress from './QuizProgress';
import ScoreToast from './ScoreToast';

interface QuizContainerProps {
  quiz: Quiz;
  questions: Question[];
  answerOptions: Record<number, AnswerOption[]>;
  onComplete?: (score: number) => void;
}

const QuizContainer: React.FC<QuizContainerProps> = ({
  quiz,
  questions,
  answerOptions,
  onComplete
}) => {
  const { 
    setQuiz, 
    currentQuestion, 
    userAnswers, 
    isSubmitted,
    score
  } = useQuiz();
  
  // Initialize quiz when component mounts
  useEffect(() => {
    setQuiz({
      ...quiz,
      questions,
      answerOptions
    });
  }, [quiz, questions, answerOptions, setQuiz]);
  
  // Call onComplete when quiz is submitted
  useEffect(() => {
    if (isSubmitted && score !== null && onComplete) {
      onComplete(score);
    }
  }, [isSubmitted, score, onComplete]);
  
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const currentOptions = answerOptions[currentQuestion.id] || [];
  const selectedOptionId = userAnswers[currentQuestion.id];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {quiz.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {quiz.description}
        </p>
      </div>
      
      <QuizProgress />
      
      <QuizQuestion
        question={currentQuestion}
        options={currentOptions}
        selectedOptionId={selectedOptionId}
        isSubmitted={isSubmitted}
      />
      
      <QuizNavigation />
      
      {isSubmitted && <ScoreToast />}
    </div>
  );
};

export default QuizContainer;