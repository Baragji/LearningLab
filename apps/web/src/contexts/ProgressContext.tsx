"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define types for user progress
interface LessonProgress {
  lessonId: number;
  completed: boolean;
  lastAccessed: Date;
  timeSpent: number; // in seconds
}

interface ModuleProgress {
  moduleId: number;
  completed: boolean;
  completedLessons: number;
  totalLessons: number;
}

interface CourseProgress {
  courseId: number;
  completed: boolean;
  completedModules: number;
  totalModules: number;
  progress: number; // percentage
}

interface UserProgress {
  lessonProgress: Record<number, LessonProgress>;
  moduleProgress: Record<number, ModuleProgress>;
  courseProgress: Record<number, CourseProgress>;
}

interface ProgressContextType {
  userProgress: UserProgress;
  isLoading: boolean;
  markLessonCompleted: (lessonId: number) => Promise<void>;
  updateLessonProgress: (lessonId: number, timeSpent: number) => Promise<void>;
  getCourseProgress: (courseId: number) => CourseProgress | null;
  getModuleProgress: (moduleId: number) => ModuleProgress | null;
  getLessonProgress: (lessonId: number) => LessonProgress | null;
}

// Create the context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Provider component
interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const { user, token } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress>({
    lessonProgress: {},
    moduleProgress: {},
    courseProgress: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user progress when user or token changes
  useEffect(() => {
    if (user && token) {
      fetchUserProgress();
    } else {
      setIsLoading(false);
    }
  }, [user, token]);

  // Function to fetch user progress from API
  const fetchUserProgress = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/user-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }

      const data = await response.json();
      setUserProgress(data);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Initialize with empty progress if fetch fails
      setUserProgress({
        lessonProgress: {},
        moduleProgress: {},
        courseProgress: {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to mark a lesson as completed
  const markLessonCompleted = async (lessonId: number) => {
    if (!user || !token) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/user-progress/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark lesson as completed: ${response.status}`);
      }

      // Update local state
      const updatedProgress = await response.json();
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  // Function to update lesson progress (time spent, etc.)
  const updateLessonProgress = async (lessonId: number, timeSpent: number) => {
    if (!user || !token) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/user-progress/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeSpent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update lesson progress: ${response.status}`);
      }

      // Update local state
      const updatedProgress = await response.json();
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  // Helper functions to get specific progress
  const getCourseProgress = (courseId: number): CourseProgress | null => {
    return userProgress.courseProgress[courseId] || null;
  };

  const getModuleProgress = (moduleId: number): ModuleProgress | null => {
    return userProgress.moduleProgress[moduleId] || null;
  };

  const getLessonProgress = (lessonId: number): LessonProgress | null => {
    return userProgress.lessonProgress[lessonId] || null;
  };

  return (
    <ProgressContext.Provider
      value={{
        userProgress,
        isLoading,
        markLessonCompleted,
        updateLessonProgress,
        getCourseProgress,
        getModuleProgress,
        getLessonProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

// Custom hook to use the progress context
export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}