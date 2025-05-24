import React, { useEffect, useState } from 'react';
import { Quiz } from '@repo/core/src/types/quiz.types';
import { useQuiz } from '../../contexts/QuizContext';

// Extended Quiz type for our application
interface ExtendedQuiz extends Quiz {
  passingScore?: number;
}

interface ScoreToastProps {
  onClose?: () => void;
}

const ScoreToast: React.FC<ScoreToastProps> = ({ onClose }) => {
  const { score, quiz } = useQuiz();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (score !== null) {
      setVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [score, onClose]);

  if (score === null || !visible) return null;

  const isPassing = quiz?.passingScore ? score >= quiz.passingScore : score >= 70;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`h-1 ${isPassing ? 'bg-green-500' : 'bg-red-500'}`}></div>

      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            isPassing ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {isPassing ? (
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isPassing ? 'Godt klaret!' : 'Prøv igen!'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Du fik {score}% rigtige svar.
              {quiz?.passingScore && (
                <span> Beståelseskrav: {quiz.passingScore}%.</span>
              )}
            </p>
          </div>

          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="bg-white dark:bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <span className="sr-only">Luk</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreToast;
