// packages/ui/components/mui/Layout/Container.tsx
import React from "react";
import {
  Container as MuiContainer,
  ContainerProps as MuiContainerProps,
} from "@mui/material";

export interface ContainerProps extends MuiContainerProps {
  /**
   * Om containeren skal være fluid (ingen max-bredde)
   * @default false
   */
  fluid?: boolean;
}

/**
 * Container-komponent til at centrere og begrænse indhold
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ fluid = false, children, ...props }, ref) => {
    return (
      <MuiContainer ref={ref} maxWidth={fluid ? false : "lg"} {...props}>
        {children}
      </MuiContainer>
    );
  },
);

Container.displayName = "Container";
