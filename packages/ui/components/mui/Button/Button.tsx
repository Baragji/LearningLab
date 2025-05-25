// packages/ui/components/mui/Button/Button.tsx
import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'color'> {
  /**
   * Variant af knappen
   * @default 'contained'
   */
  variant?: 'contained' | 'outlined' | 'text';
  
  /**
   * Farve af knappen
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  
  /**
   * Størrelse af knappen
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Om knappen skal fylde hele bredden
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Om knappen er i loading-tilstand
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Tekst der vises under loading
   * @default 'Loading...'
   */
  loadingText?: string;
}

/**
 * Primær UI-komponent til brugerinteraktion
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref
) {
  const {
    children,
    variant = 'contained',
    color = 'primary',
    size = 'medium',
    fullWidth = false,
    isLoading = false,
    loadingText = 'Loading...',
    disabled,
    startIcon,
    ...rest
  } = props;

  return (
    <MuiButton
      ref={ref}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={isLoading || disabled}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      {...rest}
    >
      {isLoading ? loadingText : children}
    </MuiButton>
  );
});

Button.displayName = 'Button';