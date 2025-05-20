import React from 'react';
import { useQuiz } from '../../context/QuizContext';

const QuizProgress: React.FC = () => {
  const { currentQuestionIndex, totalQuestions, userAnswers } = useQuiz();
  
  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex / (totalQuestions - 1)) * 100;
  
  // Count answered questions
  const answeredCount = Object.keys(userAnswers).length;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Spørgsmål {currentQuestionIndex + 1} af {totalQuestions}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {answeredCount} besvaret
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuizProgress;