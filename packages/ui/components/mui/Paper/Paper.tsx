// packages/ui/components/mui/Paper/Paper.tsx
import React from "react";
import { Paper as MuiPaper, PaperProps as MuiPaperProps } from "@mui/material";

export interface PaperProps extends MuiPaperProps {
  /**
   * Om der skal være padding i indholdet
   * @default false
   */
  noPadding?: boolean;
}

/**
 * Paper-komponent til at skabe overflade-elevation og baggrund
 */
export const Paper = React.forwardRef<HTMLDivElement, PaperProps>(
  ({ noPadding = false, children, ...props }, ref) => {
    return (
      <MuiPaper
        ref={ref}
        sx={{
          padding: noPadding ? 0 : 2,
          ...props.sx,
        }}
        {...props}
      >
        {children}
      </MuiPaper>
    );
  },
);

Paper.displayName = "Paper";
