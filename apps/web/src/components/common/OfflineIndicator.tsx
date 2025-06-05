import React, { useState, useEffect } from "react";
import useOfflineStatus from "../../hooks/useOfflineStatus";

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingUpdates, hasPendingUpdates } = useOfflineStatus();
  const [showIndicator, setShowIndicator] = useState<boolean>(false);

  useEffect(() => {
    // Show indicator when offline or has pending updates
    if (!isOnline || hasPendingUpdates) {
      setShowIndicator(true);
    } else {
      // Hide indicator after 5 seconds if online and no pending updates
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, hasPendingUpdates]);

  // Don't render anything if online and no pending updates and indicator is hidden
  if (isOnline && !hasPendingUpdates && !showIndicator) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 px-4 py-2 rounded-md shadow-md transition-all duration-300 ${
        isOnline ? "bg-blue-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-300" : "bg-red-300"} animate-pulse`}
        ></div>
        <span className="text-sm font-medium">
          {!isOnline
            ? "Offline"
            : pendingUpdates > 0
              ? `Synkroniserer data (${pendingUpdates})`
              : "Online"}
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
