import * as React from "react";
import {
  LinearProgress,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import type { LinearProgressProps, CircularProgressProps } from "@mui/material";

// Definerer vores egne props
export type ProgressProps = {
  /**
   * Variant af progress
   * @default 'linear'
   */
  variant?: "linear" | "circular";

  /**
   * Værdi af progress (0-100)
   */
  value?: number;

  /**
   * Om progress er indeterminate
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Farve af progress
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";

  /**
   * Størrelse (kun for circular)
   */
  size?: number;

  /**
   * Om værdi skal vises som tekst
   * @default false
   */
  showValue?: boolean;

  /**
   * Label tekst
   */
  label?: string;

  /**
   * Ekstra props til LinearProgress
   */
  linearProps?: Omit<LinearProgressProps, "variant" | "value" | "color">;

  /**
   * Ekstra props til CircularProgress
   */
  circularProps?: Omit<
    CircularProgressProps,
    "variant" | "value" | "color" | "size"
  >;
};

/**
 * Progress-komponent til at vise fremgang
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (props, ref) => {
    const {
      variant = "linear",
      value,
      indeterminate = false,
      color = "primary",
      size = 40,
      showValue = false,
      label,
      linearProps,
      circularProps,
      ...rest
    } = props;

    const progressVariant = indeterminate ? "indeterminate" : "determinate";
    const progressValue = indeterminate ? undefined : value;

    if (variant === "circular") {
      return (
        <Box
          ref={ref}
          display="inline-flex"
          alignItems="center"
          flexDirection="column"
          {...rest}
        >
          {label && (
            <Typography variant="body2" color="text.secondary" mb={1}>
              {label}
            </Typography>
          )}
          <Box position="relative" display="inline-flex">
            <CircularProgress
              variant={progressVariant}
              value={progressValue}
              color={color}
              size={size}
              {...circularProps}
            />
            {showValue && value !== undefined && (
              <Box
                position="absolute"
                top={0}
                left={0}
                bottom={0}
                right={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                >
                  {`${Math.round(value)}%`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box ref={ref} width="100%" {...rest}>
        {label && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {label}
          </Typography>
        )}
        <LinearProgress
          variant={progressVariant}
          value={progressValue}
          color={color}
          {...linearProps}
        />
        {showValue && value !== undefined && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary" align="right">
              {`${Math.round(value)}%`}
            </Typography>
          </Box>
        )}
      </Box>
    );
  },
);

Progress.displayName = "Progress";
