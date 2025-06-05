import * as React from "react";
import {
  Alert as MuiAlert,
  AlertTitle,
  Collapse,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { AlertProps as MuiAlertProps } from "@mui/material";

// Definerer vores egne props
export type AlertProps = Omit<MuiAlertProps, "color"> & {
  /**
   * Severity af alert
   * @default 'info'
   */
  severity?: "error" | "warning" | "info" | "success";

  /**
   * Variant af alert
   * @default 'standard'
   */
  variant?: "standard" | "filled" | "outlined";

  /**
   * Titel af alert
   */
  title?: string;

  /**
   * Om alert kan lukkes
   * @default false
   */
  closable?: boolean;

  /**
   * Callback når alert lukkes
   */
  onClose?: () => void;

  /**
   * Om alert er synlig (til controlled mode)
   */
  open?: boolean;

  /**
   * Om alert skal vise ikon
   * @default true
   */
  showIcon?: boolean;
};

/**
 * Alert-komponent til at vise beskeder
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (props, ref) => {
    const {
      children,
      severity = "info",
      variant = "standard",
      title,
      closable = false,
      onClose,
      open = true,
      showIcon = true,
      ...rest
    } = props;

    const [internalOpen, setInternalOpen] = React.useState(true);
    const isOpen = open !== undefined ? open : internalOpen;

    const handleClose = () => {
      if (onClose) {
        onClose();
      } else {
        setInternalOpen(false);
      }
    };

    const action = closable ? (
      <IconButton
        aria-label="close"
        color="inherit"
        size="small"
        onClick={handleClose}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    ) : undefined;

    return (
      <Collapse in={isOpen}>
        <MuiAlert
          ref={ref}
          severity={severity}
          variant={variant}
          action={action}
          icon={showIcon ? undefined : false}
          {...rest}
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          {children}
        </MuiAlert>
      </Collapse>
    );
  },
);

Alert.displayName = "Alert";
