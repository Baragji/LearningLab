// This file provides backward compatibility for imports from the old context directory
// All context implementations have been moved to the contexts/ directory

// Re-export everything from the new contexts directory
export * from '../contexts/AuthContext';
export * from '../contexts/ThemeContext';
export * from '../contexts/ProgressContext';
export * from '../contexts/QuizContext';

// Log a deprecation warning when this file is imported
console.warn(
  'Warning: Importing from @/context is deprecated. Please update your imports to use @/contexts instead.'
);