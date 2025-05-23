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
    // Get the user ID from localStorage if available
    const userDataStr = localStorage.getItem('userData');
    const userId = userDataStr ? JSON.parse(userDataStr).id : 0;
    
    const offlineData: QueuedRequest = {
      userId,
      quizId,
      score,
      status: 'COMPLETED',
    };
    
    // Store in localStorage for later sync
    const offlineUpdates = JSON.parse(localStorage.getItem('offlineQuizUpdates') || '[]');
    offlineUpdates.push(offlineData);
    localStorage.setItem('offlineQuizUpdates', JSON.stringify(offlineUpdates));
    
    // Return a mock response
    return {
      id: 0,
      userId,
      quizId,
      status: 'COMPLETED',
      score,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProgress;
  }
};

export interface QueuedRequest {
  userId: number;
  lessonId?: number;
  quizId?: number;
  status: string;
  score?: number;
  quizAttemptId?: number;
}

/**
 * Syncs offline quiz progress updates when the user comes back online
 */
export async function syncOfflineQuizUpdates() {
  // Hent køen fra localStorage
  const queued: QueuedRequest[] = 
    JSON.parse(localStorage.getItem('offlineQuizUpdates') || '[]');

  if (queued.length === 0) {
    console.log('Ingen offline-opdateringer at synce.');
    return;
  }

  const failed: QueuedRequest[] = [];

  for (const req of queued) {
    try {
      await apiClient.post('/user-progress', req);
    } catch (err) {
      console.error('Fejl ved sync af én opdatering:', err);
      failed.push(req);
    }
  }

  // Opdater køen i localStorage med dem, der fejlede
  if (failed.length > 0) {
    localStorage.setItem('offlineQuizUpdates', JSON.stringify(failed));
  } else {
    localStorage.removeItem('offlineQuizUpdates');
  }
}

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