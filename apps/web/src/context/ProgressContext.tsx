"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProgress } from '@repo/core/src/types/quiz.types';
import { getCourseProgress } from '../services/userProgressApi';

interface ProgressContextType {
  courseProgress: Record<number, UserProgress | null>;
  isLoadingProgress: boolean;
  refreshCourseProgress: (courseId: number) => Promise<void>;
  error: Error | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [courseProgress, setCourseProgress] = useState<Record<number, UserProgress | null>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const refreshCourseProgress = async (courseId: number) => {
    setIsLoadingProgress(true);
    setError(null);
    
    try {
      const progress = await getCourseProgress(courseId);
      setCourseProgress(prev => ({
        ...prev,
        [courseId]: progress,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch course progress');
      setError(error);
      console.error('Error fetching course progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };
  
  const value = {
    courseProgress,
    isLoadingProgress,
    refreshCourseProgress,
    error,
  };
  
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};