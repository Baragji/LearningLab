import React from 'react';
import useOfflineStatus from '../../hooks/useOfflineStatus';

interface OfflineQuizNotificationProps {
  className?: string;
}

const OfflineQuizNotification: React.FC<OfflineQuizNotificationProps> = ({ className = '' }) => {
  const { isOnline, hasPendingUpdates, pendingUpdates } = useOfflineStatus();
  
  // Don't show anything if online and no pending updates
  if (isOnline && !hasPendingUpdates) {
    return null;
  }
  
  return (
    <div className={`p-4 rounded-md ${className} ${
      isOnline 
        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${
            isOnline 
              ? 'text-blue-800 dark:text-blue-300' 
              : 'text-yellow-800 dark:text-yellow-300'
          }`}>
            {isOnline 
              ? 'Synkroniserer quiz-resultater' 
              : 'Du er offline'}
          </h3>
          <div className={`mt-2 text-sm ${
            isOnline 
              ? 'text-blue-700 dark:text-blue-200' 
              : 'text-yellow-700 dark:text-yellow-200'
          }`}>
            <p>
              {isOnline 
                ? `Dine quiz-resultater bliver synkroniseret (${pendingUpdates} ${pendingUpdates === 1 ? 'resultat' : 'resultater'} venter).` 
                : 'Dine quiz-resultater vil blive gemt lokalt og synkroniseret, når du er online igen.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineQuizNotification;