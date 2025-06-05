// packages/ui/components/mui/Button/Button.tsx
import * as React from "react";
import { Button as MuiButton, CircularProgress } from "@mui/material";
import type { ButtonProps as MuiButtonProps } from "@mui/material";

// Definerer vores egne props
export type ButtonProps = Omit<MuiButtonProps, "color"> & {
  /**
   * Variant af knappen
   * @default 'contained'
   */
  variant?: "contained" | "outlined" | "text";

  /**
   * Farve af knappen
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";

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
};

/**
 * Button-komponent til brugerinput
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      children,
      variant = "contained",
      color = "primary",
      isLoading = false,
      loadingText = "Loading...",
      disabled,
      startIcon,
      ...rest
    } = props;

    return (
      <MuiButton
        ref={ref}
        variant={variant}
        color={color}
        disabled={isLoading || disabled}
        startIcon={
          isLoading ? <CircularProgress size={20} color="inherit" /> : startIcon
        }
        {...rest}
      >
        {isLoading ? loadingText : children}
      </MuiButton>
    );
  },
);

Button.displayName = "Button";
