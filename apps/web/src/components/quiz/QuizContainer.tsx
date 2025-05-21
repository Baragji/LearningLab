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
    currentQuestionIndex,
    userAnswers, 
    isSubmitted,
    score,
    selectAnswer
  } = useQuiz();
  
  // Initialize quiz when component mounts
  useEffect(() => {
    console.log('Initializing quiz data', { quizId: quiz.id, questionsCount: questions.length });
    // Only initialize if we have questions
    if (questions.length > 0) {
      setQuiz({
        ...quiz,
        questions,
        answerOptions
      });
    }
  }, [quiz, questions, answerOptions, setQuiz]);
  
  useEffect(() => {
    // For debugging: Log current state
    console.log('Current state:', { 
      currentQuestion,
      userAnswers,
      isSubmitted,
      score
    });
  }, [currentQuestion, userAnswers, isSubmitted, score]);
  
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
  
  // Force re-initialization if we have questions but no current question
  useEffect(() => {
    if (!currentQuestion && questions.length > 0) {
      console.log('Forcing re-initialization of quiz data');
      setQuiz({
        ...quiz,
        questions,
        answerOptions
      });
    }
  }, [currentQuestion, questions, quiz, answerOptions, setQuiz]);

  // Show loading state if no current question
  if (!currentQuestion) {
    console.log('Current question is null, showing loading state', {
      quizLoaded: !!quiz,
      questionsCount: questions.length
    });
    
    // If we have questions but no current question, try to show the first question
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      const firstQuestionOptions = answerOptions[firstQuestion.id] || [];
      
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {firstQuestion.text}
          </h3>
          
          <div className="space-y-3">
            {firstQuestionOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center p-4 border rounded-md cursor-pointer transition-colors border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md"
                onClick={() => selectAnswer(firstQuestion.id, option.id)}
              >
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-200">{option.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // If we have no questions, show loading state
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Indlæser quiz...</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Hvis quizzen ikke indlæses, prøv at genindlæse siden.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Genindlæs siden
          </button>
        </div>
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