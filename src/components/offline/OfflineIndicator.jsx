import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUnsyncedDrafts } from "@/components/utils/offlineStorage";

export default function OfflineIndicator({ userEmail }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkDrafts = async () => {
      if (userEmail) {
        const drafts = await getUnsyncedDrafts(userEmail);
        setUnsyncedCount(drafts.length);
      }
    };
    checkDrafts();
    const interval = setInterval(checkDrafts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [userEmail, isOnline]);

  if (isOnline && unsyncedCount === 0) {
    return null; // Don't show indicator when online and no drafts
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <Badge className={`${isOnline ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} flex items-center gap-2 px-3 py-2`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="font-medium">
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>
        {unsyncedCount > 0 && (
          <span className="ml-1 bg-orange-600 text-white px-2 py-0.5 rounded-full text-xs">
            {unsyncedCount} draft{unsyncedCount !== 1 ? 's' : ''}
          </span>
        )}
      </Badge>
    </div>
  );
}