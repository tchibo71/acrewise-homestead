// Offline draft storage using IndexedDB for rural areas with poor connectivity

const DB_NAME = 'HomesteadHarmonyOffline';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const store = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('formType', 'formType', { unique: false });
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