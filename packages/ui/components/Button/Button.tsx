import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '../../utils/cn';

/**
 * Button variants using class-variance-authority
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-750",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600",
        destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600",
        ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        link: "text-primary-500 underline-offset-4 hover:underline dark:text-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Extended Button props interface
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, the button will take the width of its parent container
   */
  fullWidth?: boolean;
  /**
   * If true, the button will render its children as a slot
   */
  asChild?: boolean;
  /**
   * Optional icon to display before the button text
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional icon to display after the button text
   */
  rightIcon?: React.ReactNode;
  /**
   * If true, the button will show a loading spinner
   */
  isLoading?: boolean;
  /**
   * Text to show when button is in loading state
   */
  loadingText?: string;
}

/**
 * Primary UI component for user interaction
 * Enhanced with Shadcn/UI patterns
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth = false,
    asChild = false, 
    leftIcon,
    rightIcon,
    isLoading = false,
    loadingText,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;
    
    // Apply full width class if needed
    const fullWidthClass = fullWidth ? 'w-full' : '';
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidthClass
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <svg 
            className="mr-2 h-4 w-4 animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
