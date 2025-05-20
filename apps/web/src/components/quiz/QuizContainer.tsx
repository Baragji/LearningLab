import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();
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
  
  // Call onComplete when quiz is submitted and navigate to results page
  useEffect(() => {
    if (isSubmitted && score !== null) {
      if (onComplete) {
        onComplete(score);
      }
      
      // Navigate to results page after a short delay to allow the score toast to be seen
      const timer = setTimeout(() => {
        const { slug, id } = router.query;
        router.push(`/courses/${slug}/quizzes/${id}/results`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, score, onComplete, router]);
  
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