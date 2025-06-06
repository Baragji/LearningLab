import * as React from "react";
import { Divider, DividerProps } from "@mui/material";

// Separator props that support Shadcn styling
export interface SeparatorProps extends Omit<DividerProps, "orientation"> {
  /**
   * Orientering af separatoren
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Om separatoren skal være dekorativ (ikke semantisk)
   * @default true
   */
  decorative?: boolean;

  /**
   * Custom className for Shadcn compatibility
   */
  className?: string;
}

/**
 * Separator-komponent til visuel opdeling med support for Shadcn styling
 */
export const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  (props, ref) => {
    const {
      orientation = "horizontal",
      decorative = true,
      className,
      sx,
      ...rest
    } = props;

    // Shadcn-compatible styling
    const getSeparatorSx = () => {
      const baseSx = {
        border: 'none',
        backgroundColor: 'divider',
        ...(sx || {}),
      };
      
      if (orientation === 'vertical') {
        return {
          ...baseSx,
          width: '1px',
          height: '100%',
          minHeight: '20px',
        };
      }
      
      return {
        ...baseSx,
        height: '1px',
        width: '100%',
      };
    };

    return (
      <Divider
        ref={ref}
        orientation={orientation}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        className={className}
        sx={getSeparatorSx()}
        {...rest}
      />
    );
  },
);

Separator.displayName = "Separator";