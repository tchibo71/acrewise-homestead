// Offline-first logging system - IndexedDB for instant local writes, background sync
// DESIGN: Write synchronously to IndexedDB (0ms perceived delay), sync in background

const DB_NAME = 'HomesteadHarmonyOffline';
const DB_VERSION = 2;
const DRAFTS_STORE = 'drafts';
const LOGS_STORE = 'logs'; // New: instant logging with background sync

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Drafts store (existing)
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const store = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('formType', 'formType', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('userEmail', 'userEmail', { unique: false });
      }
      
      // Logs store (new) - for instant write, background sync
      if (!db.objectStoreNames.contains(LOGS_STORE)) {
        const store = db.createObjectStore(LOGS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('entityType', 'entityType', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false }); // pending, syncing, synced, failed
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('userEmail', 'userEmail', { unique: false });
      }
    };
  });
};

// Save draft to IndexedDB
export const saveDraft = async (formType, formData, userEmail) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    const draft = {
      formType,
      formData,
      userEmail,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    const request = store.add(draft);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save draft:', error);
    throw error;
  }
};

// Get all drafts for a user
export const getDrafts = async (userEmail) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('userEmail');
    
    const request = index.getAll(userEmail);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get drafts:', error);
    return [];
  }
};

// Get drafts by form type
export const getDraftsByType = async (formType, userEmail) => {
  try {
    const allDrafts = await getDrafts(userEmail);
    return allDrafts.filter(d => d.formType === formType && !d.synced);
  } catch (error) {
    console.error('Failed to get drafts by type:', error);
    return [];
  }
};

// Delete a draft
export const deleteDraft = async (draftId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    const request = store.delete(draftId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete draft:', error);
    throw error;
  }
};

// Mark draft as synced
export const markDraftSynced = async (draftId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    const getRequest = store.get(draftId);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const draft = getRequest.result;
        if (draft) {
          draft.synced = true;
          draft.syncedAt = new Date().toISOString();
          const putRequest = store.put(draft);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Failed to mark draft as synced:', error);
  }
};

// Get all unsynced drafts for sync operation
export const getUnsyncedDrafts = async (userEmail) => {
  try {
    const allDrafts = await getDrafts(userEmail);
    return allDrafts.filter(d => !d.synced);
  } catch (error) {
    console.error('Failed to get unsynced drafts:', error);
    return [];
  }
};

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Storage info
export const getStorageInfo = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
};

// ============================================================================
// OFFLINE-FIRST LOGGING SYSTEM
// ============================================================================
// STRATEGY:
// 1. SYNCHRONOUS: Write to IndexedDB instantly (0ms user wait)
// 2. QUEUED: Mark as "pending" sync status
// 3. BACKGROUND: Auto-sync every 30s when online (no UI blocking)
// 4. SIMPLE: Last-write-wins, no complex conflict resolution
// ============================================================================

// Write log entry SYNCHRONOUSLY to IndexedDB (instant, non-blocking)
export const writeLog = async (entityType, operation, data, userEmail) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);
    
    const logEntry = {
      entityType,      // e.g., "ChecklistItem", "Livestock", "Production"
      operation,       // "create", "update", "delete"
      data,            // The actual entity data
      userEmail,
      timestamp: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'pending' : 'pending', // Always pending initially
      retryCount: 0,
      lastError: null
    };
    
    const request = store.add(logEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result); // Returns log ID instantly
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to write log:', error);
    throw error;
  }
};

// Get all pending logs (for background sync)
export const getPendingLogs = async (userEmail) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([LOGS_STORE], 'readonly');
    const store = transaction.objectStore(LOGS_STORE);
    const index = store.index('syncStatus');
    
    const request = index.getAll('pending');
    
    const allPending = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    // Filter by user email
    return allPending.filter(log => log.userEmail === userEmail);
  } catch (error) {
    console.error('Failed to get pending logs:', error);
    return [];
  }
};

// Update log sync status (used during background sync)
export const updateLogStatus = async (logId, status, error = null) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);
    
    const getRequest = store.get(logId);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const log = getRequest.result;
        if (log) {
          log.syncStatus = status; // pending, syncing, synced, failed
          log.lastError = error;
          log.retryCount = (log.retryCount || 0) + (status === 'failed' ? 1 : 0);
          log.syncedAt = status === 'synced' ? new Date().toISOString() : log.syncedAt;
          
          const putRequest = store.put(log);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Failed to update log status:', error);
  }
};

// Clean up synced logs older than 7 days (housekeeping)
export const cleanupSyncedLogs = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);
    const index = store.index('syncStatus');
    
    const request = index.getAll('synced');
    
    const syncedLogs = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldLogs = syncedLogs.filter(log => 
      log.syncedAt && new Date(log.syncedAt) < sevenDaysAgo
    );
    
    // Delete old synced logs
    for (const log of oldLogs) {
      await new Promise((resolve, reject) => {
        const deleteRequest = store.delete(log.id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }
    
    return oldLogs.length;
  } catch (error) {
    console.error('Failed to cleanup logs:', error);
    return 0;
  }
};

// Get sync statistics (for UI display)
export const getSyncStats = async (userEmail) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([LOGS_STORE], 'readonly');
    const store = transaction.objectStore(LOGS_STORE);
    
    const allLogs = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    const userLogs = allLogs.filter(log => log.userEmail === userEmail);
    
    return {
      total: userLogs.length,
      pending: userLogs.filter(l => l.syncStatus === 'pending').length,
      syncing: userLogs.filter(l => l.syncStatus === 'syncing').length,
      synced: userLogs.filter(l => l.syncStatus === 'synced').length,
      failed: userLogs.filter(l => l.syncStatus === 'failed').length
    };
  } catch (error) {
    console.error('Failed to get sync stats:', error);
    return { total: 0, pending: 0, syncing: 0, synced: 0, failed: 0 };
  }
};