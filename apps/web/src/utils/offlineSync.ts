import { syncOfflineQuizUpdates } from '../services/userProgressApi';

// Helper to safely parse stored offline updates
const getOfflineUpdates = (): any[] => {
  try {
    const data = localStorage.getItem('offlineQuizUpdates');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Sets up listeners to detect when the user comes back online
 * and syncs offline quiz updates
 * @returns A cleanup function to remove event listeners
 */
export const setupOfflineSyncListeners = (): (() => void) | undefined => {
  // Check if window is defined (for SSR)
  if (typeof window !== 'undefined') {
    // Function to sync when coming online
    const handleOnline = async () => {
      console.log('Connection restored. Syncing offline data...');
      try {
        await syncOfflineQuizUpdates();
        console.log('Offline data synced successfully');
      } catch (error) {
        console.error('Failed to sync offline data:', error);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);

    // Initial check - if already online and has offline data, sync it
    if (navigator.onLine) {
      const offlineUpdates = getOfflineUpdates();
      if (offlineUpdates.length > 0) {
        handleOnline();
      }
    }

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
};

/**
 * Checks if there are any pending offline quiz updates
 */
export const hasPendingOfflineUpdates = (): boolean => {
  if (typeof window !== 'undefined') {
    const offlineUpdates = getOfflineUpdates();
    return offlineUpdates.length > 0;
  }
  return false;
};

/**
 * Gets the count of pending offline quiz updates
 */
export const getPendingOfflineUpdatesCount = (): number => {
  if (typeof window !== 'undefined') {
    const offlineUpdates = getOfflineUpdates();
    return offlineUpdates.length;
  }
  return 0;
};