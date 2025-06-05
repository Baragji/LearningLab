import { useState, useEffect } from "react";
import {
  hasPendingOfflineUpdates,
  getPendingOfflineUpdatesCount,
} from "../utils/offlineSync";

interface OfflineStatusHook {
  isOnline: boolean;
  pendingUpdates: number;
  hasPendingUpdates: boolean;
}

/**
 * Custom hook to track online/offline status and pending updates
 */
export const useOfflineStatus = (): OfflineStatusHook => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingUpdates, setPendingUpdates] = useState<number>(0);

  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window !== "undefined") {
      // Set initial state
      setIsOnline(navigator.onLine);
      setPendingUpdates(getPendingOfflineUpdatesCount());

      // Update state when online/offline status changes
      const handleOnline = () => {
        setIsOnline(true);
        // Check for pending updates
        setPendingUpdates(getPendingOfflineUpdatesCount());
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      // Check for pending updates periodically
      const checkPendingUpdates = () => {
        setPendingUpdates(getPendingOfflineUpdatesCount());
      };

      // Set up event listeners
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Check for pending updates every 10 seconds
      const interval = setInterval(checkPendingUpdates, 10000);

      // Clean up
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        clearInterval(interval);
      };
    }
  }, []);

  return {
    isOnline,
    pendingUpdates,
    hasPendingUpdates: pendingUpdates > 0,
  };
};

export default useOfflineStatus;
