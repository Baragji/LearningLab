// packages/ui/components/mui/Dialog/Dialog.tsx
import React from 'react';
import {
  Dialog as MuiDialog,
  DialogProps as MuiDialogProps,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export interface DialogProps extends Omit<MuiDialogProps, 'title'> {
  /**
   * Titel på dialogen
   */
  title?: React.ReactNode;
  
  /**
   * Beskrivelse eller undertitel på dialogen
   */
  description?: React.ReactNode;
  
  /**
   * Indhold til footer-sektionen
   */
  footer?: React.ReactNode;
  
  /**
   * Om der skal vises en luk-knap
   * @default true
   */
  closeButton?: boolean;
  
  /**
   * Om der skal vises en bekræft-knap
   * @default false
   */
  confirmButton?: boolean;
  
  /**
   * Tekst på bekræft-knappen
   * @default 'Bekræft'
   */
  confirmText?: string;
  
  /**
   * Tekst på annuller-knappen
   * @default 'Annuller'
   */
  cancelText?: string;
  
  /**
   * Callback når bekræft-knappen klikkes
   */
  onConfirm?: () => void;
}

/**
 * Dialog-komponent til at vise modalt indhold
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({
    title,
    description,
    footer,
    children,
    closeButton = true,
    confirmButton = false,
    confirmText = 'Bekræft',
    cancelText = 'Annuller',
    onConfirm,
    onClose,
    ...props
  }, ref) => {
    const handleConfirm = () => {
      if (onConfirm) {
        onConfirm();
      }
      if (onClose) {
        // @ts-ignore - MUI's onClose expects a different signature
        onClose({}, 'backdropClick');
      }
    };

    return (
      <MuiDialog
        ref={ref}
        onClose={onClose}
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        {...props}
      >
        {title && <DialogTitle id="dialog-title">{title}</DialogTitle>}
        <DialogContent>
          {description && (
            <DialogContentText id="dialog-description">
              {description}
            </DialogContentText>
          )}
          {children}
        </DialogContent>
        {(footer || closeButton || confirmButton) && (
          <DialogActions>
            {footer}
            {closeButton && (
              <Button onClick={(e) => onClose && onClose(e, 'backdropClick')}>
                {cancelText}
              </Button>
            )}
            {confirmButton && (
              <Button onClick={handleConfirm} variant="contained" color="primary">
                {confirmText}
              </Button>
            )}
          </DialogActions>
        )}
      </MuiDialog>
    );
  }
);

Dialog.displayName = 'Dialog';