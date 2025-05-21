import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Collapse, 
  IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';

interface OfflineQuizNotificationProps {
  isOffline: boolean;
  hasPendingUpdates?: boolean;
  pendingUpdates?: number;
  onRetry?: () => void;
  sx?: any;
  className?: string;
}

const OfflineQuizNotification: React.FC<OfflineQuizNotificationProps> = ({
  isOffline,
  hasPendingUpdates = false,
  pendingUpdates = 0,
  onRetry,
  sx = {},
  className
}) => {
  const [open, setOpen] = React.useState(true);

  // Reset open state when isOffline or hasPendingUpdates changes
  React.useEffect(() => {
    if (isOffline || hasPendingUpdates) {
      setOpen(true);
    }
  }, [isOffline, hasPendingUpdates]);

  // Don't show anything if online and no pending updates
  if (!isOffline && !hasPendingUpdates) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mb: 3, ...sx }} className={className}>
      <Collapse in={open}>
        <Alert
          severity={isOffline ? "warning" : "info"}
          icon={isOffline ? <WifiOffIcon /> : <SyncIcon />}
          action={
            <>
              {onRetry && (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={onRetry}
                  sx={{ mr: 1 }}
                >
                  Retry
                </Button>
              )}
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setOpen(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </>
          }
          sx={{ mb: 2 }}
        >
          <AlertTitle>
            {isOffline 
              ? 'You are offline' 
              : 'Synchronizing quiz results'}
          </AlertTitle>
          {isOffline 
            ? 'Your quiz progress will be saved locally and synchronized when you\'re back online.'
            : `Your quiz results are being synchronized (${pendingUpdates} ${pendingUpdates === 1 ? 'result' : 'results'} pending).`}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default OfflineQuizNotification;