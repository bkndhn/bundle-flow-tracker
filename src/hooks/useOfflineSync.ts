// Custom hook for offline sync functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GoodsMovement, Staff } from '@/types';
import {
  initOfflineDB,
  isOnline,
  queueDispatch,
  queueReceive,
  getPendingDispatches,
  getPendingReceives,
  markDispatchSynced,
  markReceiveSynced,
  clearSyncedItems,
  cacheMovements,
  cacheStaff,
  getCachedMovements,
  getCachedStaff,
  getPendingQueueCount,
  OfflineDispatch,
  OfflineReceive,
} from '@/services/offlineService';

interface UseOfflineSyncResult {
  isOffline: boolean;
  pendingCount: { dispatches: number; receives: number };
  isSyncing: boolean;
  lastSyncError: string | null;
  dispatchOffline: (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  receiveOffline: (movementId: string, receiveData: any) => Promise<boolean>;
  syncNow: () => Promise<void>;
  getCachedData: () => { movements: GoodsMovement[] | null; staff: Staff[] | null };
  updateCache: (movements: GoodsMovement[], staff: Staff[]) => void;
}

export function useOfflineSync(): UseOfflineSyncResult {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState({ dispatches: 0, receives: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const syncInProgressRef = useRef(false);

  // Initialize IndexedDB on mount
  useEffect(() => {
    initOfflineDB().catch(console.error);
    updatePendingCount();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back online! Syncing pending changes...');
      syncNow();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('You are offline. Changes will be synced when connected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await getPendingQueueCount();
      setPendingCount(count);
    } catch (e) {
      console.error('Failed to get pending count:', e);
    }
  };

  // Dispatch with offline support
  const dispatchOffline = useCallback(async (
    movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!isOnline()) {
      // Queue for later
      await queueDispatch(movement);
      await updatePendingCount();
      toast.info('Dispatch saved offline. Will sync when connected.');
      return true;
    }
    return false; // Let caller handle online dispatch
  }, []);

  // Receive with offline support
  const receiveOffline = useCallback(async (
    movementId: string,
    receiveData: {
      received_at: string;
      received_by: string;
      received_by_name: string;
      condition_notes?: string;
    }
  ): Promise<boolean> => {
    if (!isOnline()) {
      // Queue for later
      await queueReceive(movementId, receiveData);
      await updatePendingCount();
      toast.info('Receipt saved offline. Will sync when connected.');
      return true;
    }
    return false; // Let caller handle online receive
  }, []);

  // Sync pending changes
  const syncNow = useCallback(async () => {
    if (syncInProgressRef.current || !isOnline()) return;
    
    syncInProgressRef.current = true;
    setIsSyncing(true);
    setLastSyncError(null);

    try {
      // Sync pending dispatches
      const pendingDispatches = await getPendingDispatches();
      for (const dispatch of pendingDispatches) {
        try {
          const insertData: any = {
            dispatch_date: dispatch.data.dispatch_date,
            movement_type: dispatch.data.movement_type || 'bundles',
            bundles_count: dispatch.data.bundles_count,
            item: dispatch.data.item,
            source: dispatch.data.source || 'godown',
            destination: dispatch.data.destination,
            sent_by: dispatch.data.sent_by,
            fare_payment: dispatch.data.fare_payment,
            accompanying_person: dispatch.data.accompanying_person,
            auto_name: dispatch.data.auto_name,
            status: dispatch.data.status,
          };

          if (dispatch.data.shirt_bundles !== undefined) {
            insertData.shirt_bundles = dispatch.data.shirt_bundles;
          }
          if (dispatch.data.pant_bundles !== undefined) {
            insertData.pant_bundles = dispatch.data.pant_bundles;
          }
          if (dispatch.data.fare_display_msg) {
            insertData.fare_display_msg = dispatch.data.fare_display_msg;
          }
          if (dispatch.data.fare_payee_tag) {
            insertData.fare_payee_tag = dispatch.data.fare_payee_tag;
          }
          if (dispatch.data.item_summary_display) {
            insertData.item_summary_display = dispatch.data.item_summary_display;
          }
          if (dispatch.data.condition_notes) {
            insertData.condition_notes = dispatch.data.condition_notes;
            insertData.dispatch_notes = dispatch.data.condition_notes;
          }

          const { error } = await supabase
            .from('goods_movements')
            .insert([insertData]);

          if (error) {
            console.error('Failed to sync dispatch:', error);
          } else if (dispatch.localId) {
            await markDispatchSynced(dispatch.localId);
          }
        } catch (e) {
          console.error('Error syncing dispatch:', e);
        }
      }

      // Sync pending receives
      const pendingReceives = await getPendingReceives();
      for (const receive of pendingReceives) {
        try {
          const { error } = await supabase
            .from('goods_movements')
            .update({
              received_at: receive.receiveData.received_at,
              received_by: receive.receiveData.received_by,
              receive_notes: receive.receiveData.condition_notes || null,
              status: 'received',
              updated_at: new Date().toISOString(),
            })
            .eq('id', receive.movementId);

          if (error) {
            console.error('Failed to sync receive:', error);
          } else if (receive.localId) {
            await markReceiveSynced(receive.localId);
          }
        } catch (e) {
          console.error('Error syncing receive:', e);
        }
      }

      // Clean up synced items
      await clearSyncedItems();
      await updatePendingCount();

      if (pendingDispatches.length > 0 || pendingReceives.length > 0) {
        toast.success(`Synced ${pendingDispatches.length} dispatches and ${pendingReceives.length} receives`);
      }
    } catch (error: any) {
      setLastSyncError(error.message || 'Sync failed');
      toast.error('Failed to sync some changes. Will retry.');
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  }, []);

  // Get cached data for offline viewing
  const getCachedData = useCallback(() => {
    return {
      movements: getCachedMovements(),
      staff: getCachedStaff(),
    };
  }, []);

  // Update cache when data is loaded
  const updateCache = useCallback((movements: GoodsMovement[], staff: Staff[]) => {
    cacheMovements(movements);
    cacheStaff(staff);
  }, []);

  return {
    isOffline,
    pendingCount,
    isSyncing,
    lastSyncError,
    dispatchOffline,
    receiveOffline,
    syncNow,
    getCachedData,
    updateCache,
  };
}
