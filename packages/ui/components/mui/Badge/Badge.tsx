import * as React from "react";
import { Chip, ChipProps } from "@mui/material";

// Badge props that support both MUI and Shadcn variants
export interface BadgeProps extends Omit<ChipProps, "variant" | "color"> {
  /**
   * Variant af badge - supports Shadcn variants
   * @default 'default'
   */
  variant?: "default" | "secondary" | "destructive" | "outline";

  /**
   * Farve af badge
   * @default 'default'
   */
  color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

// Helper function to map Shadcn variants to MUI variants
const mapVariantToMui = (variant: BadgeProps['variant']) => {
  switch (variant) {
    case 'outline':
      return 'outlined';
    case 'default':
    case 'secondary':
    case 'destructive':
    default:
      return 'filled';
  }
};

// Helper function to map Shadcn variants to MUI colors
const mapVariantToColor = (variant: BadgeProps['variant'], color?: BadgeProps['color']) => {
  if (color && color !== 'default') return color;
  
  switch (variant) {
    case 'destructive':
      return 'error';
    case 'secondary':
      return 'secondary';
    case 'default':
    default:
      return 'default';
  }
};

/**
 * Badge-komponent til status og label indikatorer med support for Shadcn variants
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (props, ref) => {
    const {
      variant = "default",
      color = "default",
      sx,
      ...rest
    } = props;

    const muiVariant = mapVariantToMui(variant);
    const muiColor = mapVariantToColor(variant, color);
    
    // Special styling for Shadcn variants
    const getShadcnSx = () => {
      const baseSx = {
        borderRadius: 1.5,
        fontSize: '0.75rem',
        fontWeight: 500,
        height: 'auto',
        minHeight: '20px',
        ...(sx || {}),
      };
      
      switch (variant) {
        case 'outline':
          return {
            ...baseSx,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'transparent',
          };
        case 'secondary':
          return {
            ...baseSx,
            backgroundColor: 'grey.100',
            color: 'grey.900',
          };
        case 'destructive':
          return {
            ...baseSx,
            backgroundColor: 'error.main',
            color: 'error.contrastText',
          };
        case 'default':
        default:
          return {
            ...baseSx,
            backgroundColor: 'grey.900',
            color: 'common.white',
          };
      }
    };

    return (
      <Chip
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        sx={getShadcnSx()}
        {...rest}
      />
    );
  },
);

Badge.displayName = "Badge";