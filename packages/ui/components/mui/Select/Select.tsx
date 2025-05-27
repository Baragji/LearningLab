// packages/ui/components/mui/Select/Select.tsx
import React, { forwardRef, ReactNode } from 'react';
import { 
  Select as MuiSelect, 
  SelectProps as MuiSelectProps,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Box,
  CircularProgress,
  InputAdornment,
  InputBaseComponentProps
} from '@mui/material';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
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

  /**
   * Grupperede options til select-feltet
   */
  groups?: SelectGroup[];

  /**
   * Placeholder tekst når ingen værdi er valgt
   */
  placeholder?: string;

  /**
   * Om select-feltet er i loading-tilstand
   * @default false
   */
  isLoading?: boolean;

  /**
   * Ikon der vises i starten af select-feltet
   */
  startIcon?: ReactNode;

  /**
   * CSS klasse til FormControl
   */
  formControlClassName?: string;

  /**
   * Render funktion til at tilpasse visningen af valgte værdier
   */
  renderValue?: (selected: unknown) => ReactNode;

  /**
   * Om select-feltet er påkrævet
   * @default false
   */
  required?: boolean;
}

/**
 * Select-komponent til brugerinput
 * 
 * Denne komponent er en konsolideret version af Select fra apps/web.
 * Den understøtter alle funktioner fra den oprindelige komponent og bruger MUI som basis.
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
    groups = [],
    children,
    id,
    placeholder,
    isLoading = false,
    startIcon,
    formControlClassName,
    renderValue: customRenderValue,
    required = false,
    multiple,
    ...rest
  } = props;

  // Generer et unikt ID hvis ikke angivet
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  const labelId = `${selectId}-label`;

  // Default renderValue funktion for multiple select
  const defaultRenderValue = (selected: unknown): React.ReactNode => {
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return placeholder || '';
    }

    if (multiple && Array.isArray(selected)) {
      // Find labels for selected values
      const selectedLabels = selected.map(value => {
        const option = options.find(opt => opt.value === value);
        return option ? option.label : String(value);
      });

      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedLabels.map((label) => (
            <Chip key={String(label)} label={String(label)} size="small" />
          ))}
        </Box>
      );
    }

    // For single select
    const option = options.find(opt => opt.value === selected);
    return option ? option.label : String(selected);
  };

  // Input props for loading and startIcon
  const inputProps: Partial<InputBaseComponentProps> = {
    ...(rest.inputProps || {}),
  };

  if (startIcon || isLoading) {
    inputProps.startAdornment = (
      <InputAdornment position="start">
        {isLoading ? <CircularProgress size={20} /> : startIcon}
      </InputAdornment>
    );
  }

  return (
    <FormControl 
      variant={variant} 
      fullWidth={fullWidth} 
      size={size} 
      error={error}
      ref={ref}
      className={formControlClassName}
      required={required}
      disabled={isLoading || rest.disabled}
    >
      {label && <InputLabel id={labelId}>{label}</InputLabel>}
      <MuiSelect
        labelId={labelId}
        id={selectId}
        label={label}
        displayEmpty={!!placeholder}
        renderValue={customRenderValue || defaultRenderValue}
        inputProps={inputProps}
        {...rest}
      >
        {placeholder && !multiple && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        
        {children || (
          <>
            {/* Render flat options */}
            {options.map((option) => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.icon && (
                  <Box component="span" sx={{ mr: 1, display: 'inline-flex', alignItems: 'center' }}>
                    {option.icon}
                  </Box>
                )}
                {option.label}
              </MenuItem>
            ))}
            
            {/* Render grouped options */}
            {groups.map((group) => [
              <MenuItem 
                key={`group-${group.label}`} 
                disabled 
                sx={{ 
                  fontWeight: 'bold', 
                  opacity: 0.7,
                  pointerEvents: 'none'
                }}
              >
                {group.label}
              </MenuItem>,
              ...group.options.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  sx={{ pl: 4 }}
                >
                  {option.icon && (
                    <Box component="span" sx={{ mr: 1, display: 'inline-flex', alignItems: 'center' }}>
                      {option.icon}
                    </Box>
                  )}
                  {option.label}
                </MenuItem>
              ))
            ])}
          </>
        )}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
});

Select.displayName = 'Select';