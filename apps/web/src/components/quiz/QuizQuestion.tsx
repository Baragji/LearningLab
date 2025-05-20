import React from 'react';
import { Question, AnswerOption } from '@repo/core/src/types/quiz.types';
import { useQuiz } from '../../context/QuizContext';

// Extended Question type for our application
interface ExtendedQuestion extends Question {
  explanation?: string;
}

interface QuizQuestionProps {
  question: ExtendedQuestion;
  options: AnswerOption[];
  selectedOptionId?: number;
  isSubmitted?: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  options,
  selectedOptionId,
  isSubmitted = false
}) => {
  const { selectAnswer, isSubmitted: quizSubmitted } = useQuiz();
  const showFeedback = isSubmitted || quizSubmitted;

  const handleOptionSelect = (optionId: number) => {
    if (!showFeedback) {
      selectAnswer(question.id, optionId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        {question.text}
      </h3>
      
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.isCorrect;
          
          let optionClasses = "flex items-center p-4 border rounded-md cursor-pointer transition-colors";
          
          if (!showFeedback) {
            optionClasses += isSelected
              ? " border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
              : " border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750";
          } else {
            if (isSelected && isCorrect) {
              optionClasses += " border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400";
            } else if (isSelected && !isCorrect) {
              optionClasses += " border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400";
            } else if (!isSelected && isCorrect) {
              optionClasses += " border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400";
            } else {
              optionClasses += " border-gray-200 dark:border-gray-700";
            }
          }
          
          return (
            <div
              key={option.id}
              className={optionClasses}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-200">{option.text}</p>
              </div>
              
              {showFeedback && (
                <div className="ml-3">
                  {isCorrect ? (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isSelected ? (
                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showFeedback && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Forklaring</h4>
          <p className="text-blue-700 dark:text-blue-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;