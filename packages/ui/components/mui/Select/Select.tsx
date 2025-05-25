// packages/ui/components/mui/Select/Select.tsx
import React, { forwardRef } from 'react';
import { 
  Select as MuiSelect, 
  SelectProps as MuiSelectProps,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<MuiSelectProps, 'variant'> {
  /**
   * Variant af select-feltet
   * @default 'outlined'
   */
  variant?: 'outlined' | 'filled' | 'standard';
  
  /**
   * Om select-feltet skal fylde hele bredden
   * @default true
   */
  fullWidth?: boolean;
  
  /**
   * Størrelse af select-feltet
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  
  /**
   * Label til select-feltet
   */
  label?: string;
  
  /**
   * Hjælpetekst der vises under select-feltet
   */
  helperText?: React.ReactNode;
  
  /**
   * Om select-feltet er i fejltilstand
   * @default false
   */
  error?: boolean;
  
  /**
   * Options til select-feltet
   */
  options?: SelectOption[];
}

/**
 * Select-komponent til brugerinput
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  props,
  ref
) {
  const {
    variant = 'outlined',
    fullWidth = true,
    size = 'medium',
    label,
    helperText,
    error,
    options = [],
    children,
    id,
    ...rest
  } = props;

  // Generer et unikt ID hvis ikke angivet
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  const labelId = `${selectId}-label`;

  return (
    <FormControl 
      variant={variant} 
      fullWidth={fullWidth} 
      size={size} 
      error={error}
      ref={ref}
    >
      {label && <InputLabel id={labelId}>{label}</InputLabel>}
      <MuiSelect
        labelId={labelId}
        id={selectId}
        label={label}
        {...rest}
      >
        {children || options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
});

Select.displayName = 'Select';