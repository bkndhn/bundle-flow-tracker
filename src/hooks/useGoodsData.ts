import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GoodsMovement, Staff, AppUser } from '@/types';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';

const STALE_TIME = 30_000; // 30s
const CACHE_TIME = 5 * 60_000; // 5min

function transformMovements(data: any[]): GoodsMovement[] {
  return data.map(movement => ({
    ...movement,
    movement_type: movement.movement_type || 'bundles',
    source: movement.source || 'godown',
    dispatch_notes: movement.dispatch_notes || undefined,
    receive_notes: movement.receive_notes || undefined,
    sent_by_name: (movement.sent_by_staff as any)?.name || 'Unknown',
    received_by_name: (movement.received_by_staff as any)?.name || undefined,
  })) as GoodsMovement[];
}

export function useStaff(enabled: boolean) {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Staff[];
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useMovements(enabled: boolean) {
  return useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_movements')
        .select(`
          *,
          sent_by_staff:staff!goods_movements_sent_by_fkey(name),
          received_by_staff:staff!goods_movements_received_by_fkey(name)
        `)
        .order('dispatch_date', { ascending: false });
      if (error) throw error;
      return transformMovements(data || []);
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useDispatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movement, user, staff }: {
      movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>;
      user: AppUser;
      staff: Staff[];
    }) => {
      const insertData: any = {
        dispatch_date: movement.dispatch_date,
        movement_type: movement.movement_type || 'bundles',
        bundles_count: movement.bundles_count,
        item: movement.item,
        source: movement.source || 'godown',
        destination: movement.destination,
        sent_by: movement.sent_by,
        transport_method: movement.transport_method || 'auto',
        fare_payment: movement.fare_payment,
        accompanying_person: movement.accompanying_person || '',
        auto_name: movement.auto_name ?? '',
        status: movement.status,
      };

      if (movement.shirt_bundles !== undefined) insertData.shirt_bundles = movement.shirt_bundles;
      if (movement.pant_bundles !== undefined) insertData.pant_bundles = movement.pant_bundles;
      if (movement.fare_display_msg) insertData.fare_display_msg = movement.fare_display_msg;
      if (movement.fare_payee_tag) insertData.fare_payee_tag = movement.fare_payee_tag;
      if (movement.item_summary_display) insertData.item_summary_display = movement.item_summary_display;
      if (movement.condition_notes) {
        insertData.condition_notes = movement.condition_notes;
        insertData.dispatch_notes = movement.condition_notes;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const userId = user?.id && uuidRegex.test(user.id) ? user.id : null;
      insertData.created_by_user = userId;

      const { data, error } = await supabase
        .from('goods_movements')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return { data, movement, staff };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Goods dispatched successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to dispatch goods: ' + error.message);
    },
  });
}

export function useReceiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movementId, receiveData }: {
      movementId: string;
      receiveData: {
        received_at: string;
        received_by: string;
        received_by_name: string;
        condition_notes?: string;
      };
    }) => {
      const { error } = await supabase
        .from('goods_movements')
        .update({
          received_at: receiveData.received_at,
          received_by: receiveData.received_by,
          receive_notes: receiveData.condition_notes || null,
          status: 'received',
          updated_at: new Date().toISOString(),
        })
        .eq('id', movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Goods received successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to update received goods: ' + error.message);
    },
  });
}

export function useStaffMutations() {
  const queryClient = useQueryClient();

  const addStaff = useMutation({
    mutationFn: async (newStaff: Omit<Staff, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('staff').insert([newStaff]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added successfully!');
    },
    onError: () => toast.error('Failed to add staff member'),
  });

  const updateStaff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Staff, 'id' | 'created_at'> }) => {
      const { error } = await supabase
        .from('staff')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated successfully!');
    },
    onError: () => toast.error('Failed to update staff member'),
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      const { data: linkedUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('linked_staff_id', id);

      if (linkedUsers && linkedUsers.length > 0) {
        for (const linkedUser of linkedUsers) {
          await supabase.from('app_users').delete().eq('id', linkedUser.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated and login removed!');
    },
    onError: (error: any) => toast.error('Failed to deactivate staff member: ' + error.message),
  });

  return { addStaff, updateStaff, deleteStaff };
}
