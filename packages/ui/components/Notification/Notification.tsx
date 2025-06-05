// packages/ui/components/Notification/Notification.tsx
import React, { useEffect, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// Import NotificationPosition type
import type { NotificationPosition } from "./NotificationProvider";

export type NotificationType = "success" | "error" | "warning" | "info";

/**
 * Notification variants using class-variance-authority
 */
const notificationVariants = cva(
  "shadow-lg rounded-lg overflow-hidden border-l-4",
  {
    variants: {
      type: {
        success:
          "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200",
        error:
          "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200",
        warning:
          "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200",
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200",
      },
      animation: {
        enter: "animate-notification-enter",
        exit: "animate-notification-exit",
      },
      origin: {
        top: "transform-origin-top",
        bottom: "transform-origin-bottom",
      },
    },
    defaultVariants: {
      type: "info",
      animation: "enter",
    },
  },
);

/**
 * Extended Notification props interface
 */
export interface NotificationProps
  extends VariantProps<typeof notificationVariants> {
  /**
   * Notification type
   */
  type: NotificationType;
  /**
   * Notification title
   */
  title: string;
  /**
   * Optional notification message
   */
  message?: string;
  /**
   * Duration in milliseconds before auto-dismissing
   */
  duration?: number;
  /**
   * Whether the notification is visible
   */
  isVisible?: boolean;
  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Position of the notification
   */
  position?: NotificationPosition;
  /**
   * Optional action button
   */
  action?: React.ReactNode;
  /**
   * Whether to show a close button
   */
  showCloseButton?: boolean;
}

/**
 * Icons for different notification types
 */
const NotificationIcons = {
  success: (
    <svg
      className="w-5 h-5 text-green-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5 text-red-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Progress bar colors for different notification types
 */
const progressColors = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

/**
 * Enhanced Notification component
 */
export function Notification({
  type = "info",
  title,
  message,
  duration = 5000,
  isVisible: initialIsVisible = true,
  onDismiss,
  className = "",
  position = "top-right",
  action,
  showCloseButton = true,
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
    // Wait for animation to finish before removing component
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match with CSS animation duration
  };

  // Determine animation origin based on position
  const getOrigin = () => {
    if (position?.includes("top")) {
      return "top";
    } else if (position?.includes("bottom")) {
      return "bottom";
    }
    return undefined;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        notificationVariants({
          type,
          animation: isExiting ? "exit" : "enter",
          origin: getOrigin(),
          className,
        }),
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="animate-fadeInDown">{NotificationIcons[type]}</div>
        </div>
        <div className="flex-1">
          <h3
            className="text-sm font-medium animate-fadeInDown"
            style={{ animationDelay: "50ms" }}
          >
            {title}
          </h3>
          {message && (
            <p
              className="mt-1 text-sm opacity-90 animate-fadeInDown"
              style={{ animationDelay: "100ms" }}
            >
              {message}
            </p>
          )}
          {action && (
            <div
              className="mt-2 animate-fadeInDown"
              style={{ animationDelay: "150ms" }}
            >
              {action}
            </div>
          )}
        </div>
        {showCloseButton && (
          <button
            type="button"
            className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus-ring transition-transform duration-200 hover:scale-110 active:scale-95"
            onClick={handleDismiss}
            aria-label="Luk notifikation"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar with animation */}
      {duration !== Infinity && isVisible && !isExiting && (
        <div className={`h-1 ${progressColors[type]} w-full`}>
          <div
            className="h-full bg-opacity-50"
            style={{
              width: "100%",
              animation: `progress ${duration / 1000}s linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
