import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getPendingLogs, updateLogStatus, cleanupSyncedLogs } from "@/components/utils/offlineStorage";
import { useQueryClient } from "@tanstack/react-query";

// BACKGROUND SYNC WORKER
// Runs every 30s when online, syncs pending logs without blocking UI
// Simple last-write-wins strategy - no complex conflict resolution

export default function BackgroundSyncWorker({ userEmail, enabled = true }) {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({ syncing: false, lastSync: null, errorCount: 0 });

  useEffect(() => {
    if (!enabled || !userEmail) return;

    const syncPendingLogs = async () => {
      if (!navigator.onLine) return;
      if (stats.syncing) return; // Prevent concurrent syncs

      try {
        setStats(prev => ({ ...prev, syncing: true }));
        
        const pending = await getPendingLogs(userEmail);
        
        if (pending.length === 0) {
          setStats({ syncing: false, lastSync: new Date(), errorCount: 0 });
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Sync each log sequentially (simple, no batching)
        for (const log of pending) {
          try {
            // Mark as syncing
            await updateLogStatus(log.id, 'syncing');

            // Perform the actual API operation
            const entity = base44.entities[log.entityType];
            if (!entity) {
              throw new Error(`Unknown entity: ${log.entityType}`);
            }

            if (log.operation === 'create') {
              await entity.create(log.data);
            } else if (log.operation === 'update') {
              await entity.update(log.data.id, log.data);
            } else if (log.operation === 'delete') {
              await entity.delete(log.data.id);
            }

            // Mark as synced
            await updateLogStatus(log.id, 'synced');
            successCount++;

          } catch (error) {
            console.error('Sync error for log:', log.id, error);
            await updateLogStatus(log.id, 'failed', error.message);
            errorCount++;
            
            // Stop syncing if too many failures (network issue)
            if (errorCount > 3) break;
          }
        }

        // Invalidate queries if anything synced
        if (successCount > 0) {
          queryClient.invalidateQueries();
        }

        setStats({ 
          syncing: false, 
          lastSync: new Date(), 
          errorCount 
        });

      } catch (error) {
        console.error('Background sync error:', error);
        setStats(prev => ({ 
          ...prev, 
          syncing: false, 
          errorCount: prev.errorCount + 1 
        }));
      }
    };

    // Initial sync
    syncPendingLogs();

    // Sync every 30 seconds
    const syncInterval = setInterval(syncPendingLogs, 30000);

    // Cleanup old logs every hour
    const cleanupInterval = setInterval(() => {
      cleanupSyncedLogs();
    }, 60 * 60 * 1000);

    // Sync when coming back online
    const handleOnline = () => {
      setTimeout(syncPendingLogs, 1000); // Small delay
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(syncInterval);
      clearInterval(cleanupInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, [userEmail, enabled, queryClient]);

  // Invisible component - just runs in background
  return null;
}

// Hook for manual sync trigger
export function useManualSync(userEmail) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const triggerSync = async () => {
    if (!navigator.onLine || !userEmail) return { success: false, message: 'Offline' };

    setSyncing(true);
    try {
      const pending = await getPendingLogs(userEmail);
      
      for (const log of pending) {
        await updateLogStatus(log.id, 'syncing');
        
        const entity = base44.entities[log.entityType];
        if (log.operation === 'create') {
          await entity.create(log.data);
        } else if (log.operation === 'update') {
          await entity.update(log.data.id, log.data);
        } else if (log.operation === 'delete') {
          await entity.delete(log.data.id);
        }
        
        await updateLogStatus(log.id, 'synced');
      }

      queryClient.invalidateQueries();
      setSyncing(false);
      return { success: true, count: pending.length };
    } catch (error) {
      setSyncing(false);
      return { success: false, message: error.message };
    }
  };

  return { triggerSync, syncing };
}