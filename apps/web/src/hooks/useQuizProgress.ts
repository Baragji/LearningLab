import { useState, useCallback } from 'react';
import { UserProgress } from '@repo/core';
import { updateQuizProgress } from '../services/userProgressApi';

interface UseQuizProgressProps {
  quizId: number;
}

interface UseQuizProgressReturn {
  isUpdating: boolean;
  updateProgress: (
    score: number,
    answers: Array<{
      questionId: number;
      selectedOptionId: number;
      isCorrect: boolean;
    }>
  ) => Promise<UserProgress>;
  error: Error | null;
}

/**
 * Custom hook to handle quiz progress updates
 */
export const useQuizProgress = ({ quizId }: UseQuizProgressProps): UseQuizProgressReturn => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const updateProgress = useCallback(
    async (
      score: number,
      answers: Array<{
        questionId: number;
        selectedOptionId: number;
        isCorrect: boolean;
      }>
    ) => {
      setIsUpdating(true);
      setError(null);
      
      try {
        const result = await updateQuizProgress(quizId, score, answers);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update quiz progress');
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [quizId]
  );
  
  return {
    isUpdating,
    updateProgress,
    error,
  };
};

export default useQuizProgress;