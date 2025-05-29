import React from 'react';
import { Question, AnswerOption } from '@repo/core';

interface IncorrectAnswersListProps {
  incorrectAnswers: Array<{
    question: Question;
    selectedOption: AnswerOption;
    correctOption: AnswerOption;
  }>;
}

const IncorrectAnswersList: React.FC<IncorrectAnswersListProps> = ({ incorrectAnswers }) => {
  if (incorrectAnswers.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300">
          Alle svar var korrekte! Godt klaret!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {incorrectAnswers.map(({ question, selectedOption, correctOption }) => (
        <div 
          key={question.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            {question.text}
          </h4>
          
          <div className="space-y-3">
            {/* User's incorrect answer */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-red-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Dit svar:</span> {selectedOption.text}
                </p>
              </div>
            </div>
            
            {/* Correct answer */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-green-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Korrekt svar:</span> {correctOption.text}
                </p>
              </div>
            </div>
          </div>
          
          {/* Explanation if available */}
          {question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Forklaring:</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IncorrectAnswersList;