
import { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [movements, setMovements] = useState<GoodsMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
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
        const transformedMovements = movementsData?.map(movement => ({
          ...movement,
          sent_by_name: movement.sent_by_staff?.name,
          received_by_name: movement.received_by_staff?.name,
        })) || [];
        setMovements(transformedMovements);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('goods_movements')
        .insert([{
          dispatch_date: movement.dispatch_date,
          bundles_count: movement.bundles_count,
          destination: movement.destination,
          sent_by: movement.sent_by,
          fare_payment: movement.fare_payment,
          accompanying_person: movement.accompanying_person || null,
          status: movement.status,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error dispatching goods:', error);
        toast.error('Failed to dispatch goods');
      } else {
        toast.success('Goods dispatched successfully!');
        loadData(); // Reload data to get updated list
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
        loadData(); // Reload data to get updated list
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
        loadData(); // Reload data to get updated list
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
        loadData(); // Reload data to get updated list
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
        loadData(); // Reload data to get updated list
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  const pendingMovements = movements.filter(m => m.status === 'dispatched');

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
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
        return <Dashboard movements={movements} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;
