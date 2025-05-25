// packages/ui/components/mui/Layout/Grid.tsx
import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

/**
 * Grid-komponent til layout med rækker og kolonner
 */
export type GridProps = MuiGridProps;

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (props, ref) => {
    return <MuiGrid ref={ref} {...props} />;
  }
);

Grid.displayName = 'Grid';