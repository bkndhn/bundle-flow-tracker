
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { DispatchForm } from '@/components/DispatchForm';
import { ReceiveForm } from '@/components/ReceiveForm';
import { StaffManagement } from '@/components/StaffManagement';
import { Staff, GoodsMovement } from '@/types';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [movements, setMovements] = useState<GoodsMovement[]>([]);

  // Initialize with sample data
  useEffect(() => {
    const sampleStaff: Staff[] = [
      {
        id: '1',
        name: 'Raj Kumar',
        role: 'godown_staff',
        location: 'godown',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Priya Singh',
        role: 'shop_staff',
        location: 'big_shop',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Amit Sharma',
        role: 'shop_staff',
        location: 'small_shop',
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Admin User',
        role: 'admin',
        location: 'godown',
        created_at: new Date().toISOString(),
      },
    ];

    const sampleMovements: GoodsMovement[] = [
      {
        id: '1',
        dispatch_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        bundles_count: 15,
        destination: 'big_shop',
        sent_by: '1',
        sent_by_name: 'Raj Kumar',
        fare_payment: 'paid_by_sender',
        status: 'dispatched',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        dispatch_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        bundles_count: 8,
        destination: 'small_shop',
        sent_by: '1',
        sent_by_name: 'Raj Kumar',
        fare_payment: 'to_be_paid_by_receiver',
        received_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        received_by: '3',
        received_by_name: 'Amit Sharma',
        condition_notes: 'All goods in perfect condition',
        status: 'received',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setStaff(sampleStaff);
    setMovements(sampleMovements);
  }, []);

  const handleDispatch = (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => {
    const newMovement: GoodsMovement = {
      ...movement,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMovements(prev => [newMovement, ...prev]);
  };

  const handleReceive = (movementId: string, receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  }) => {
    setMovements(prev => prev.map(movement => 
      movement.id === movementId 
        ? {
            ...movement,
            ...receiveData,
            status: 'received' as const,
            updated_at: new Date().toISOString(),
          }
        : movement
    ));
  };

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'created_at'>) => {
    const staff: Staff = {
      ...newStaff,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setStaff(prev => [...prev, staff]);
  };

  const pendingMovements = movements.filter(m => m.status === 'dispatched');

  const renderCurrentPage = () => {
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
      case 'staff':
        return <StaffManagement staff={staff} onAddStaff={handleAddStaff} />;
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
