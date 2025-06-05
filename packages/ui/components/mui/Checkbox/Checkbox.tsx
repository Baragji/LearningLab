// packages/ui/components/mui/Checkbox/Checkbox.tsx
import React, { forwardRef } from "react";
import {
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
  FormControlLabel,
  FormControlLabelProps,
  FormHelperText,
  FormControl,
} from "@mui/material";

export interface CheckboxProps extends Omit<MuiCheckboxProps, "color"> {
  /**
   * Farve af checkboxen
   * @default 'primary'
   */
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "default";

  /**
   * Størrelse af checkboxen
   * @default 'medium'
   */
  size?: "small" | "medium";

  /**
   * Label til checkboxen
   */
  label?: React.ReactNode;

  /**
   * Placering af label
   * @default 'end'
   */
  labelPlacement?: FormControlLabelProps["labelPlacement"];

  /**
   * Hjælpetekst der vises under checkboxen
   */
  helperText?: React.ReactNode;

  /**
   * Om checkboxen er i fejltilstand
   * @default false
   */
  error?: boolean;

  /**
   * Om checkboxen er påkrævet
   * @default false
   */
  required?: boolean;

  /**
   * CSS klasse til label
   */
  labelClassName?: string;

  /**
   * CSS klasse til FormControl
   */
  formControlClassName?: string;
}

/**
 * Checkbox-komponent til brugerinput
 *
 * Denne komponent er en konsolideret version af Checkbox fra apps/web.
 * Den understøtter alle funktioner fra den oprindelige komponent og bruger MUI som basis.
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const {
      color = "primary",
      size = "medium",
      label,
      labelPlacement = "end",
      helperText,
      error = false,
      required = false,
      className,
      labelClassName,
      formControlClassName,
      ...rest
    } = props;

    const checkbox = (
      <MuiCheckbox
        ref={ref}
        color={error ? "error" : color}
        size={size}
        required={required}
        className={className}
        {...rest}
      />
    );

    // If we have a label, helper text, or error, wrap in FormControl
    if (label || helperText || error) {
      return (
        <FormControl
          error={error}
          required={required}
          className={formControlClassName}
        >
          {label ? (
            <FormControlLabel
              control={checkbox}
              label={label}
              labelPlacement={labelPlacement}
              className={labelClassName}
            />
          ) : (
            checkbox
          )}
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    return checkbox;
  },
);

Checkbox.displayName = "Checkbox";
