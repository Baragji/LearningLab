// packages/ui/components/mui/Layout/Box.tsx
import React from "react";
import { Box as MuiBox, BoxProps as MuiBoxProps } from "@mui/material";

/**
 * Box-komponent til grundlæggende layout og styling
 */
export type BoxProps = MuiBoxProps;

export const Box = React.forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  return <MuiBox ref={ref} {...props} />;
});

Box.displayName = "Box";
