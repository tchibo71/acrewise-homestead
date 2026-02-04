import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { writeLog } from "@/components/utils/offlineStorage";

// ============================================================================
// OFFLINE-FIRST HOOK - INSTANT WRITES, BACKGROUND SYNC
// ============================================================================
// USAGE:
// const { createOffline, updateOffline, deleteOffline } = useOfflineLog('ChecklistItem', userEmail);
// await createOffline({ title: "New task", ... }); // Returns instantly
// ============================================================================

export function useOfflineLog(entityType, userEmail) {
  const queryClient = useQueryClient();

  // CREATE operation - instant local write, background sync
  const createOffline = useMutation({
    mutationFn: async (data) => {
      // SYNCHRONOUS: Write to IndexedDB first (instant)
      const logId = await writeLog(entityType, 'create', data, userEmail);
      
      // ASYNC: Try to sync immediately if online (non-blocking)
      if (navigator.onLine) {
        try {
          const result = await base44.entities[entityType].create(data);
          // Success - log will be marked synced by background worker
          return result;
        } catch (error) {
          // Fail silently - background worker will retry
          console.warn('Immediate sync failed, will retry in background:', error);
          throw error; // Let mutation know it failed
        }
      }
      
      // Offline - return optimistic data
      return { id: `temp-${logId}`, ...data };
    },
    onSuccess: () => {
      // Optimistically update cache
      queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
    }
  });

  // UPDATE operation - instant local write, background sync
  const updateOffline = useMutation({
    mutationFn: async ({ id, data }) => {
      // SYNCHRONOUS: Write to IndexedDB first (instant)
      await writeLog(entityType, 'update', { id, ...data }, userEmail);
      
      // ASYNC: Try to sync immediately if online (non-blocking)
      if (navigator.onLine) {
        try {
          const result = await base44.entities[entityType].update(id, data);
          return result;
        } catch (error) {
          console.warn('Immediate sync failed, will retry in background:', error);
          throw error;
        }
      }
      
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
    }
  });

  // DELETE operation - instant local write, background sync
  const deleteOffline = useMutation({
    mutationFn: async (id) => {
      // SYNCHRONOUS: Write to IndexedDB first (instant)
      await writeLog(entityType, 'delete', { id }, userEmail);
      
      // ASYNC: Try to sync immediately if online (non-blocking)
      if (navigator.onLine) {
        try {
          await base44.entities[entityType].delete(id);
        } catch (error) {
          console.warn('Immediate sync failed, will retry in background:', error);
          throw error;
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
    }
  });

  return {
    createOffline: createOffline.mutateAsync,
    updateOffline: updateOffline.mutateAsync,
    deleteOffline: deleteOffline.mutateAsync,
    isCreating: createOffline.isPending,
    isUpdating: updateOffline.isPending,
    isDeleting: deleteOffline.isPending
  };
}