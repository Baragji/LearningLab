// packages/ui/components/Notification/Notification.tsx
import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  isVisible?: boolean;
  onDismiss?: () => void;
  className?: string;
  position?: NotificationPosition;
}

// Importerer NotificationPosition type
import type { NotificationPosition } from './NotificationProvider';

export function Notification({
  type = 'info',
  title,
  message,
  duration = 5000,
  isVisible: initialIsVisible = true,
  onDismiss,
  className = '',
  position = 'top-right',
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(initialIsVisible);
  const [isExiting, setIsExiting] = useState(false);

  // Handle auto-dismiss
  useEffect(() => {
    if (isVisible && duration !== Infinity) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    // Vent på at animationen er færdig før vi fjerner komponenten helt
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match med CSS animation duration
  };

  // Define icon and colors based on type
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-l-4 border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
      progressColor: 'bg-green-500',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-l-4 border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      progressColor: 'bg-red-500',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-l-4 border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      progressColor: 'bg-yellow-500',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-l-4 border-blue-500',
      textColor: 'text-blue-800 dark:text-blue-200',
      progressColor: 'bg-blue-500',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = typeConfig[type];

  // Bestem animation baseret på position
  const getAnimationClasses = () => {
    // Basis animation klasser
    const animationClass = isExiting ? 'animate-notification-exit' : 'animate-notification-enter';
    
    // Tilføj ekstra styling baseret på position
    if (position?.includes('top')) {
      return `${animationClass} transform-origin-top`;
    } else if (position?.includes('bottom')) {
      return `${animationClass} transform-origin-bottom`;
    }
    
    return animationClass;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`shadow-lg rounded-lg ${config.borderColor} ${config.bgColor} overflow-hidden ${className} ${getAnimationClasses()}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="animate-fadeInDown">
            {config.icon}
          </div>
        </div>
        <div className="flex-1">
          <h3
            className={`text-sm font-medium ${config.textColor} animate-fadeInDown`}
            style={{ animationDelay: '50ms' }}
          >
            {title}
          </h3>
          {message && (
            <p
              className={`mt-1 text-sm ${config.textColor} opacity-90 animate-fadeInDown`}
              style={{ animationDelay: '100ms' }}
            >
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          className={`ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus-ring transition-transform duration-200 hover:scale-110 active:scale-95`}
          onClick={handleDismiss}
          aria-label="Luk notifikation"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Progress bar med animation */}
      {duration !== Infinity && isVisible && !isExiting && (
        <div className={`h-1 ${config.progressColor} w-full`}>
          <div 
            className="h-full bg-opacity-50" 
            style={{ 
              width: '100%', 
              animation: `progress ${duration / 1000}s linear forwards` 
            }}
          />
        </div>
      )}
    </div>
  );
}