// packages/ui/components/mui/TextField/TextField.tsx
import React, { forwardRef } from 'react';
import { 
  TextField as MuiTextField, 
  TextFieldProps as MuiTextFieldProps,
  InputAdornment,
  IconButton,
  // InputProps, // Remove unused import
} from '@mui/material';

export interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  /**
   * Variant af tekstfeltet
   * @default 'outlined'
   */
  variant?: 'outlined' | 'filled' | 'standard';
  
  /**
   * Om tekstfeltet skal fylde hele bredden
   * @default true
   */
  fullWidth?: boolean;
  
  /**
   * Størrelse af tekstfeltet
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  
  /**
   * Fejlbesked der vises under tekstfeltet
   */
  error?: boolean;
  
  /**
   * Hjælpetekst der vises under tekstfeltet
   */
  helperText?: React.ReactNode;

  /**
   * Ikon der vises i starten af tekstfeltet
   */
  startIcon?: React.ReactNode;

  /**
   * Ikon der vises i slutningen af tekstfeltet
   */
  endIcon?: React.ReactNode;

  /**
   * Callback når der klikkes på ikonet i slutningen af tekstfeltet
   */
  onEndIconClick?: () => void;

  /**
   * Callback når der klikkes på ikonet i starten af tekstfeltet
   */
  onStartIconClick?: () => void;

  /**
   * Om tekstfeltet er i loading-tilstand
   * @default false
   */
  isLoading?: boolean;

  /**
   * Maksimalt antal tegn
   */
  maxLength?: number;
}

/**
 * Tekstfelt-komponent til brugerinput
 * 
 * Denne komponent er en konsolideret version af Input fra apps/web.
 * Den understøtter alle funktioner fra den oprindelige komponent og bruger MUI som basis.
 */
export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(function TextField(
  props,
  ref
) {
  const {
    variant = 'outlined',
    fullWidth = true,
    size = 'medium',
    startIcon,
    endIcon,
    onEndIconClick,
    onStartIconClick,
    isLoading = false,
    maxLength,
    onChange,
    ...rest
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxLength && e.target.value.length > maxLength) {
      e.target.value = e.target.value.slice(0, maxLength);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const finalInputProps: MuiTextFieldProps['InputProps'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rest.InputProps as any) || {}),
  };

  if (startIcon || isLoading) {
    finalInputProps!.startAdornment = startIcon && (
      <InputAdornment position="start">
        {onStartIconClick ? (
          <IconButton edge="start" onClick={onStartIconClick} size="small">
            {startIcon}
          </IconButton>
        ) : (
          startIcon
        )}
      </InputAdornment>
    );
  }

  if (endIcon || isLoading) {
    finalInputProps!.endAdornment = (endIcon || isLoading) && (
      <InputAdornment position="end">
        {isLoading ? (
          <div className="animate-spin h-4 w-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : onEndIconClick ? (
          <IconButton edge="end" onClick={onEndIconClick} size="small">
            {endIcon}
          </IconButton>
        ) : (
          endIcon
        )}
      </InputAdornment>
    );
  }

  return (
    <MuiTextField
      ref={ref}
      variant={variant}
      fullWidth={fullWidth}
      size={size}
      onChange={handleChange}
      InputProps={finalInputProps}
      disabled={isLoading || rest.disabled}
      {...rest}
    />
  );
});

TextField.displayName = 'TextField';