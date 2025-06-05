// packages/ui/components/mui/Layout/Stack.tsx
import React from "react";
import { Stack as MuiStack, StackProps as MuiStackProps } from "@mui/material";

/**
 * Stack-komponent til at arrangere elementer i en linje eller kolonne
 */
export type StackProps = MuiStackProps;

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (props, ref) => {
    return <MuiStack ref={ref} {...props} />;
  },
);

Stack.displayName = "Stack";
