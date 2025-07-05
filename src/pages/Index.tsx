
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

const Index = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [movements, setMovements] = useState<GoodsMovement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
        // Transform the data to match our interface
        const transformedMovements: GoodsMovement[] = movementsData?.map(movement => ({
          id: movement.id,
          dispatch_date: movement.dispatch_date,
          bundles_count: movement.bundles_count,
          item: movement.item as 'shirt' | 'pant',
          destination: movement.destination,
          sent_by: movement.sent_by,
          sent_by_name: movement.sent_by_staff?.name || '',
          fare_payment: movement.fare_payment,
          accompanying_person: movement.accompanying_person || '',
          auto_name: movement.auto_name,
          received_at: movement.received_at || undefined,
          received_by: movement.received_by || undefined,
          received_by_name: movement.received_by_staff?.name || '',
          condition_notes: movement.condition_notes || undefined,
          status: movement.status,
          created_at: movement.created_at || '',
          updated_at: movement.updated_at || '',
        })) || [];
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
      const { data, error } = await supabase
        .from('goods_movements')
        .insert([{
          dispatch_date: movement.dispatch_date,
          bundles_count: movement.bundles_count,
          item: movement.item,
          destination: movement.destination,
          sent_by: movement.sent_by,
          fare_payment: movement.fare_payment,
          accompanying_person: movement.accompanying_person,
          auto_name: movement.auto_name,
          status: movement.status,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error dispatching goods:', error);
        toast.error('Failed to dispatch goods');
      } else {
        toast.success('Goods dispatched successfully!');
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
          condition_notes: receiveData.condition_notes || null,
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

  // Filter pending movements based on user role
  const getFilteredPendingMovements = () => {
    const pending = movements.filter(m => m.status === 'dispatched');
    
    if (user?.role === 'small_shop_manager') {
      return pending.filter(m => m.destination === 'small_shop');
    } else if (user?.role === 'big_shop_manager') {
      return pending.filter(m => m.destination === 'big_shop');
    }
    
    return pending;
  };

  const pendingMovements = getFilteredPendingMovements();

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
        return <DispatchForm staff={staff} onDispatch={handleDispatch} />;
      case 'receive':
        return <ReceiveForm 
          staff={staff} 
          pendingMovements={pendingMovements}
          onReceive={handleReceive} 
        />;
      case 'reports':
        return <Reports movements={movements} />;
      case 'staff':
        return <StaffManagement 
          staff={staff} 
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
        />;
      default:
        return user.role === 'admin' ? <Dashboard movements={movements} /> : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Welcome! Please use the navigation to access your available sections.</p>
          </div>
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;
