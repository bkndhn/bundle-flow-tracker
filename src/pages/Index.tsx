import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { DispatchForm } from '@/components/DispatchForm';
import { ReceiveForm } from '@/components/ReceiveForm';
import { StaffManagement } from '@/components/StaffManagement';
import { Reports } from '@/components/Reports';
import { Staff, GoodsMovement } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initializeNotifications, subscribeToIncomingDispatches, unsubscribeFromDispatches } from '@/services/notificationService';
import { WhatsAppShareDialog } from '@/components/WhatsAppShareDialog';
import { getWhatsAppSettings, WhatsAppSettings } from '@/services/whatsappService';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [movements, setMovements] = useState<GoodsMovement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // WhatsApp sharing state
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | null>(null);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [batchDispatchData, setBatchDispatchData] = useState<any[]>([]);
  const [dispatchBatchTimeout, setDispatchBatchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Set default page based on user role
  const getDefaultPage = () => {
    switch (user?.role) {
      case 'admin': return 'dashboard';
      case 'godown_manager': return 'dispatch';  // Godown dispatches to shops
      case 'big_shop_manager':
      case 'small_shop_manager': return 'receive';  // Shops receive from godown
      default: return 'dispatch';
    }
  };

  // Filter movements that are destined for the current user's location but not yet received
  const getFilteredPendingMovements = () => {
    return movements.filter(m => {
      if (m.status !== 'dispatched') return false;

      // Admin sees all pending
      if (user?.role === 'admin') return true;

      // Godown manager sees what's coming to godown
      if (user?.role === 'godown_manager' && m.destination === 'godown') return true;

      // Shop managers see what's coming to their shop
      if (user?.role === 'big_shop_manager' && m.destination === 'big_shop') return true;
      if (user?.role === 'small_shop_manager' && m.destination === 'small_shop') return true;

      // Note: 'both' destination is split into separate movements at dispatch time, so no need to handle here

      return false;
    });
  };

  const pendingMovements = getFilteredPendingMovements();

  // Set default page when user loads or role changes
  useEffect(() => {
    if (user && user.role) {
      const defaultPage = getDefaultPage();
      setCurrentPage(prev => prev || defaultPage);
    }
  }, [user]);

  // Initialize notifications and subscribe to real-time dispatches
  useEffect(() => {
    if (user && user.role) {
      initializeNotifications();

      const channel = subscribeToIncomingDispatches(user.role, user.id);

      return () => {
        if (channel) {
          console.log('Unsubscribing from notifications channel');
          unsubscribeFromDispatches();
        }
      };
    }
  }, [user]);

  // Load data from Supabase - removed auto-refresh interval
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setDataLoading(true);

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffError) {
        console.error('Error loading staff:', staffError);
        toast.error('Failed to load staff data');
      } else {
        setStaff(staffData || []);
      }

      // Load movements with staff names
      const { data: movementsData, error: movementsError } = await supabase
        .from('goods_movements')
        .select(`
          *,
          sent_by_staff:staff!goods_movements_sent_by_fkey(name),
          received_by_staff:staff!goods_movements_received_by_fkey(name)
        `)
        .order('dispatch_date', { ascending: false });

      if (movementsError) {
        console.error('Error loading movements:', movementsError);
        toast.error('Failed to load movement data');
      } else {
        // Transform the data to match our interface with proper type handling
        const transformedMovements: GoodsMovement[] = movementsData?.map(movement => ({
          ...movement,
          movement_type: (movement as any).movement_type || 'bundles',
          source: (movement as any).source || 'godown',
          dispatch_notes: (movement as any).dispatch_notes || undefined,
          receive_notes: (movement as any).receive_notes || undefined,
          sent_by_name: (movement.sent_by_staff as any)?.name || 'Unknown',
          received_by_name: (movement.received_by_staff as any)?.name || undefined,
        })) as GoodsMovement[] || [];
        setMovements(transformedMovements);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleDispatch = async (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Dispatching movement:', movement);

      // Create the insert data object with proper typing
      const insertData: any = {
        dispatch_date: movement.dispatch_date,
        movement_type: movement.movement_type || 'bundles',
        bundles_count: movement.bundles_count,
        item: movement.item,
        source: movement.source || 'godown',
        destination: movement.destination,
        sent_by: movement.sent_by,
        fare_payment: movement.fare_payment,
        accompanying_person: movement.accompanying_person,
        auto_name: movement.auto_name,
        status: movement.status,
      };

      // Add optional fields only if they exist
      if (movement.shirt_bundles !== undefined) {
        insertData.shirt_bundles = movement.shirt_bundles;
      }
      if (movement.pant_bundles !== undefined) {
        insertData.pant_bundles = movement.pant_bundles;
      }
      if (movement.fare_display_msg) {
        insertData.fare_display_msg = movement.fare_display_msg;
      }
      if (movement.fare_payee_tag) {
        insertData.fare_payee_tag = movement.fare_payee_tag;
      }
      if (movement.item_summary_display) {
        insertData.item_summary_display = movement.item_summary_display;
      }
      if (movement.condition_notes) {
        // Save to both for backward compatibility
        insertData.condition_notes = movement.condition_notes;
        insertData.dispatch_notes = movement.condition_notes;
      }

      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('goods_movements')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error dispatching goods:', error);
        toast.error('Failed to dispatch goods: ' + error.message);
      } else {
        console.log('Dispatch successful:', data);
        toast.success('Goods dispatched successfully!');

        // Prepare WhatsApp sharing data - accumulate for batch dispatches
        const selectedStaff = staff.find(s => s.id === movement.sent_by);
        const dispatchData = {
          item: movement.item,
          bundles_count: movement.bundles_count,
          movement_type: movement.movement_type || 'bundles',
          source: movement.source || 'godown',
          destination: movement.destination,
          auto_name: movement.auto_name,
          sent_by_name: selectedStaff?.name || 'Unknown',
          accompanying_person: movement.accompanying_person,
          dispatch_notes: movement.condition_notes,
          fare_display_msg: movement.fare_display_msg,
          shirt_bundles: movement.shirt_bundles,
          pant_bundles: movement.pant_bundles,
        };

        // Add to batch and set/reset timeout to show dialog after all dispatches
        setBatchDispatchData(prev => [...prev, dispatchData]);

        // Clear existing timeout if any
        if (dispatchBatchTimeout) {
          clearTimeout(dispatchBatchTimeout);
        }

        // Set new timeout - this will fire after all dispatches are accumulated
        const timeout = setTimeout(async () => {
          const settings = await getWhatsAppSettings();
          setWhatsAppSettings(settings);
          if (settings.whatsapp_enabled) {
            setShowWhatsAppDialog(true);
          }
        }, 500);
        setDispatchBatchTimeout(timeout);

        loadData(); // Refresh data after successful dispatch
      }
    } catch (error) {
      console.error('Error dispatching goods:', error);
      toast.error('Failed to dispatch goods');
    }
  };

  const handleReceive = async (movementId: string, receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  }) => {
    try {
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

      if (error) {
        console.error('Error receiving goods:', error);
        toast.error('Failed to update received goods');
      } else {
        toast.success('Goods received successfully!');
        loadData(); // Refresh data after successful receive
      }
    } catch (error) {
      console.error('Error receiving goods:', error);
      toast.error('Failed to update received goods');
    }
  };

  const handleAddStaff = async (newStaff: Omit<Staff, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('staff')
        .insert([newStaff]);

      if (error) {
        console.error('Error adding staff:', error);
        toast.error('Failed to add staff member');
      } else {
        toast.success('Staff member added successfully!');
        loadData(); // Refresh data after successful add
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to add staff member');
    }
  };

  const handleUpdateStaff = async (id: string, updatedStaff: Omit<Staff, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          ...updatedStaff,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating staff:', error);
        toast.error('Failed to update staff member');
      } else {
        toast.success('Staff member updated successfully!');
        loadData(); // Refresh data after successful update
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff member');
      } else {
        toast.success('Staff member deleted successfully!');
        loadData(); // Refresh data after successful delete
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderCurrentPage = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        // Only show dashboard for admin users
        if (user.role !== 'admin') {
          return (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Access denied. Dashboard is only available for administrators.</p>
            </div>
          );
        }
        return <Dashboard movements={movements} />;
      case 'dispatch':
        return <DispatchForm staff={staff} movements={movements} userRole={user.role} onDispatch={handleDispatch} />;
      case 'receive':
        return <ReceiveForm
          staff={staff}
          pendingMovements={pendingMovements}
          onReceive={handleReceive}
        />;
      case 'reports':
        return <Reports movements={movements} />;
      case 'admin':
        return <StaffManagement
          staff={staff}
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
        />;
      default:
        // Show appropriate default page based on role
        if (user.role === 'admin') {
          return <Dashboard movements={movements} />;
        } else if (user.role === 'godown_manager') {
          return <DispatchForm staff={staff} movements={movements} userRole={user.role} onDispatch={handleDispatch} />;
        } else {
          return <ReceiveForm staff={staff} pendingMovements={pendingMovements} onReceive={handleReceive} />;
        }
    }
  };

  // Final safety check for blank page
  if (!currentPage && user) {
    return (
      <Layout currentPage={getDefaultPage()} onPageChange={setCurrentPage}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage()}
      </Layout>

      {/* WhatsApp Share Dialog */}
      {whatsAppSettings && batchDispatchData.length > 0 && (
        <WhatsAppShareDialog
          open={showWhatsAppDialog}
          onClose={() => {
            setShowWhatsAppDialog(false);
            setBatchDispatchData([]); // Clear batch after closing
          }}
          settings={whatsAppSettings}
          dispatchData={batchDispatchData.length === 1 ? batchDispatchData[0] : batchDispatchData}
        />
      )}
    </>
  );
};

export default Index;
