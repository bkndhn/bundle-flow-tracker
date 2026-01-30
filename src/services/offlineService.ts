// Offline Service - IndexedDB queue + localStorage caching
// Handles offline dispatch/receive and auto-sync when online

import { GoodsMovement, Staff } from '@/types';

const DB_NAME = 'goods-tracker-offline';
const DB_VERSION = 1;
const DISPATCH_QUEUE_STORE = 'dispatch-queue';
const RECEIVE_QUEUE_STORE = 'receive-queue';

const CACHE_KEYS = {
  movements: 'offline-cache-movements',
  staff: 'offline-cache-staff',
  lastSync: 'offline-last-sync',
};

// Debug logging
const DEBUG = true;
const log = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[OfflineService] ${message}`, ...args);
  }
};

// IndexedDB initialization
let db: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      log('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      log('IndexedDB opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create dispatch queue store
      if (!database.objectStoreNames.contains(DISPATCH_QUEUE_STORE)) {
        database.createObjectStore(DISPATCH_QUEUE_STORE, { keyPath: 'localId', autoIncrement: true });
        log('Created dispatch queue store');
      }

      // Create receive queue store
      if (!database.objectStoreNames.contains(RECEIVE_QUEUE_STORE)) {
        database.createObjectStore(RECEIVE_QUEUE_STORE, { keyPath: 'localId', autoIncrement: true });
        log('Created receive queue store');
      }
    };
  });
};

// Check if online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Queue a dispatch for offline sync
export interface OfflineDispatch {
  localId?: number;
  data: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>;
  timestamp: string;
  synced: boolean;
}

export const queueDispatch = async (dispatch: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DISPATCH_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(DISPATCH_QUEUE_STORE);
    
    const item: OfflineDispatch = {
      data: dispatch,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const request = store.add(item);
    
    request.onsuccess = () => {
      log('Dispatch queued for offline sync:', request.result);
      resolve(request.result as number);
    };
    
    request.onerror = () => {
      log('Failed to queue dispatch:', request.error);
      reject(request.error);
    };
  });
};

// Queue a receive for offline sync
export interface OfflineReceive {
  localId?: number;
  movementId: string;
  receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  };
  timestamp: string;
  synced: boolean;
}

export const queueReceive = async (
  movementId: string,
  receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  }
): Promise<number> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECEIVE_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(RECEIVE_QUEUE_STORE);
    
    const item: OfflineReceive = {
      movementId,
      receiveData,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const request = store.add(item);
    
    request.onsuccess = () => {
      log('Receive queued for offline sync:', request.result);
      resolve(request.result as number);
    };
    
    request.onerror = () => {
      log('Failed to queue receive:', request.error);
      reject(request.error);
    };
  });
};

// Get all pending dispatches
export const getPendingDispatches = async (): Promise<OfflineDispatch[]> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DISPATCH_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(DISPATCH_QUEUE_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const pending = (request.result as OfflineDispatch[]).filter(d => !d.synced);
      resolve(pending);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Get all pending receives
export const getPendingReceives = async (): Promise<OfflineReceive[]> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECEIVE_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(RECEIVE_QUEUE_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const pending = (request.result as OfflineReceive[]).filter(r => !r.synced);
      resolve(pending);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Mark dispatch as synced
export const markDispatchSynced = async (localId: number): Promise<void> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DISPATCH_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(DISPATCH_QUEUE_STORE);
    const getRequest = store.get(localId);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result as OfflineDispatch;
      if (item) {
        item.synced = true;
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Mark receive as synced
export const markReceiveSynced = async (localId: number): Promise<void> => {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECEIVE_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(RECEIVE_QUEUE_STORE);
    const getRequest = store.get(localId);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result as OfflineReceive;
      if (item) {
        item.synced = true;
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Clear synced items (cleanup)
export const clearSyncedItems = async (): Promise<void> => {
  const database = await initOfflineDB();
  
  // Clear synced dispatches
  const dispatchTx = database.transaction([DISPATCH_QUEUE_STORE], 'readwrite');
  const dispatchStore = dispatchTx.objectStore(DISPATCH_QUEUE_STORE);
  const dispatchRequest = dispatchStore.getAll();
  
  dispatchRequest.onsuccess = () => {
    const items = dispatchRequest.result as OfflineDispatch[];
    items.filter(i => i.synced).forEach(i => {
      if (i.localId) dispatchStore.delete(i.localId);
    });
  };

  // Clear synced receives
  const receiveTx = database.transaction([RECEIVE_QUEUE_STORE], 'readwrite');
  const receiveStore = receiveTx.objectStore(RECEIVE_QUEUE_STORE);
  const receiveRequest = receiveStore.getAll();
  
  receiveRequest.onsuccess = () => {
    const items = receiveRequest.result as OfflineReceive[];
    items.filter(i => i.synced).forEach(i => {
      if (i.localId) receiveStore.delete(i.localId);
    });
  };
  
  log('Cleared synced items from queue');
};

// LocalStorage caching for read data
export const cacheMovements = (movements: GoodsMovement[]): void => {
  try {
    localStorage.setItem(CACHE_KEYS.movements, JSON.stringify(movements));
    localStorage.setItem(CACHE_KEYS.lastSync, new Date().toISOString());
    log('Cached movements:', movements.length);
  } catch (e) {
    log('Failed to cache movements:', e);
  }
};

export const getCachedMovements = (): GoodsMovement[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.movements);
    if (cached) {
      return JSON.parse(cached) as GoodsMovement[];
    }
  } catch (e) {
    log('Failed to get cached movements:', e);
  }
  return null;
};

export const cacheStaff = (staff: Staff[]): void => {
  try {
    localStorage.setItem(CACHE_KEYS.staff, JSON.stringify(staff));
    log('Cached staff:', staff.length);
  } catch (e) {
    log('Failed to cache staff:', e);
  }
};

export const getCachedStaff = (): Staff[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.staff);
    if (cached) {
      return JSON.parse(cached) as Staff[];
    }
  } catch (e) {
    log('Failed to get cached staff:', e);
  }
  return null;
};

export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(CACHE_KEYS.lastSync);
};

// Get pending queue count for UI indicator
export const getPendingQueueCount = async (): Promise<{ dispatches: number; receives: number }> => {
  const dispatches = await getPendingDispatches();
  const receives = await getPendingReceives();
  return {
    dispatches: dispatches.length,
    receives: receives.length,
  };
};
