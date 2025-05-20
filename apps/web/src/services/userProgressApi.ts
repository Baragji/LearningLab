import { UserProgress, QuizResult } from '@repo/core/src/types/quiz.types';
import { apiClient } from './apiClient';

/**
 * Updates the user's quiz progress
 * @param quizId The ID of the quiz
 * @param score The score achieved (percentage)
 * @param answers The user's answers
 * @returns The updated user progress
 */
export const updateQuizProgress = async (
  quizId: number,
  score: number,
  answers: Array<{
    questionId: number;
    selectedOptionId: number;
    isCorrect: boolean;
  }>
): Promise<UserProgress> => {
  try {
    const response = await apiClient.patch<UserProgress>('/user-progress', {
      quizId,
      score,
      answers,
      completedAt: new Date().toISOString(),
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating quiz progress:', error);
    
    // Implement offline support by storing the data locally
    // This is a simplified version - in a real app, you would use a more robust solution
    const offlineData = {
      quizId,
      score,
      answers,
      completedAt: new Date().toISOString(),
    };
    
    // Store in localStorage for later sync
    const offlineUpdates = JSON.parse(localStorage.getItem('offlineQuizUpdates') || '[]');
    offlineUpdates.push(offlineData);
    localStorage.setItem('offlineQuizUpdates', JSON.stringify(offlineUpdates));
    
    // Return a mock response
    return {
      id: 0,
      userId: 0,
      quizId,
      status: 'COMPLETED',
      score,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProgress;
  }
};

/**
 * Syncs offline quiz progress updates when the user comes back online
 */
export const syncOfflineQuizUpdates = async (): Promise<void> => {
  const offlineUpdates = JSON.parse(localStorage.getItem('offlineQuizUpdates') || '[]');
  
  if (offlineUpdates.length === 0) {
    return;
  }
  
  try {
    // Process each offline update
    for (const update of offlineUpdates) {
      await apiClient.patch('/user-progress', update);
    }
    
    // Clear offline updates after successful sync
    localStorage.removeItem('offlineQuizUpdates');
  } catch (error) {
    console.error('Error syncing offline quiz updates:', error);
    // Keep the offline updates for the next sync attempt
  }
};

/**
 * Gets the user's progress for a specific course
 * @param courseId The ID of the course
 * @returns The user's progress for the course
 */
export const getCourseProgress = async (courseId: number): Promise<UserProgress> => {
  try {
    const response = await apiClient.get<UserProgress>(`/user-progress/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting course progress:', error);
    throw error;
  }
};

/**
 * Gets the user's quiz results for a specific quiz
 * @param quizId The ID of the quiz
 * @returns The user's quiz results
 */
export const getQuizResults = async (quizId: number): Promise<QuizResult[]> => {
  try {
    const response = await apiClient.get<QuizResult[]>(`/user-progress/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting quiz results:', error);
    throw error;
  }
};