import React from 'react';
import { useQuiz } from '../../context/QuizContext';

const QuizNavigation: React.FC = () => {
  const { 
    goToNextQuestion, 
    goToPreviousQuestion, 
    isFirstQuestion, 
    isLastQuestion,
    currentQuestionIndex,
    totalQuestions,
    hasAnsweredCurrentQuestion,
    submitQuiz,
    isSubmitted
  } = useQuiz();

  const handlePrevious = () => {
    console.log('Previous button clicked');
    if (!isFirstQuestion) {
      goToPreviousQuestion();
    }
  };
  
  const handleNext = () => {
    console.log('Next button clicked');
    // Allow navigation even if the question hasn't been answered
    // This makes the UI more flexible
    if (!isLastQuestion) {
      goToNextQuestion();
    }
  };
  
  const handleSubmit = () => {
    console.log('Submit button clicked');
    if (!isSubmitted) {
      submitQuiz();
    }
  };
  
  return (
    <div className="flex justify-between items-center mt-6">
      <button
        onClick={handlePrevious}
        disabled={isFirstQuestion}
        className={`px-4 py-2 rounded-md flex items-center ${
          isFirstQuestion
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow active:shadow-inner active:translate-y-0.5 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750'
        } border border-gray-300 dark:border-gray-600 shadow-sm transition-all duration-150`}
      >
        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Forrige
      </button>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Spørgsmål {currentQuestionIndex + 1} af {totalQuestions}
      </div>
      
      {isLastQuestion ? (
        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          className={`px-4 py-2 rounded-md flex items-center ${
            isSubmitted
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow active:shadow-inner active:translate-y-0.5 dark:bg-blue-500 dark:hover:bg-blue-600'
          } shadow-sm transition-all duration-150`}
        >
          Afslut Quiz
          <svg className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-md flex items-center bg-blue-600 text-white hover:bg-blue-700 hover:shadow active:shadow-inner active:translate-y-0.5 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm transition-all duration-150"
        >
          Næste
          <svg className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default QuizNavigation;