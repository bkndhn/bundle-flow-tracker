import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { Layout } from '@/components/Layout';
import { Staff, GoodsMovement } from '@/types';
import { toast } from 'sonner';
import { initializeNotifications, subscribeToIncomingDispatches, unsubscribeFromDispatches } from '@/services/notificationService';
import { WhatsAppShareDialog } from '@/components/WhatsAppShareDialog';
import { getWhatsAppSettings, WhatsAppSettings } from '@/services/whatsappService';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useStaff, useMovements, useDispatchMutation, useReceiveMutation, useStaffMutations } from '@/hooks/useGoodsData';

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('@/components/Dashboard').then(m => ({ default: m.Dashboard })));
const DispatchForm = lazy(() => import('@/components/DispatchForm').then(m => ({ default: m.DispatchForm })));
const ReceiveForm = lazy(() => import('@/components/ReceiveForm').then(m => ({ default: m.ReceiveForm })));
const StaffManagement = lazy(() => import('@/components/StaffManagement').then(m => ({ default: m.StaffManagement })));
const Reports = lazy(() => import('@/components/Reports').then(m => ({ default: m.Reports })));
const Analytics = lazy(() => import('@/components/Analytics').then(m => ({ default: m.Analytics })));
const NotificationDebugPanel = lazy(() => import('@/components/NotificationDebugPanel').then(m => ({ default: m.NotificationDebugPanel })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const Index = () => {
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'receive') return 'receive';
    return sessionStorage.getItem('currentPage') || '';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'receive') {
      setCurrentPage('receive');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handlePageChange = (page: string) => {
    sessionStorage.setItem('currentPage', page);
    setCurrentPage(page);
  };

  // Offline sync
  const {
    isOffline, pendingCount, isSyncing, dispatchOffline, receiveOffline, syncNow, getCachedData, updateCache,
  } = useOfflineSync();

  // React Query data fetching
  const isLoggedIn = !!user;
  const { data: staff = [], isLoading: staffLoading } = useStaff(isLoggedIn);
  const { data: movements = [], isLoading: movementsLoading } = useMovements(isLoggedIn);
  const dataLoading = staffLoading || movementsLoading;

  // Mutations
  const dispatchMutation = useDispatchMutation();
  const receiveMutation = useReceiveMutation();
  const { addStaff, updateStaff, deleteStaff } = useStaffMutations();

  // Update offline cache when data loads
  useEffect(() => {
    if (movements.length > 0 || staff.length > 0) {
      updateCache(movements, staff);
    }
  }, [movements, staff, updateCache]);

  // WhatsApp sharing state
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | null>(null);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [batchDispatchData, setBatchDispatchData] = useState<any[]>([]);
  const [dispatchBatchTimeout, setDispatchBatchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Default page based on role
  const getDefaultPage = useCallback(() => {
    switch (user?.role) {
      case 'admin': return 'dashboard';
      case 'godown_manager': return 'dispatch';
      case 'big_shop_manager':
      case 'small_shop_manager': return 'receive';
      default: return 'dispatch';
    }
  }, [user?.role]);

  // Pending movements for receive page
  const pendingMovements = movements.filter(m => {
    if (m.status !== 'dispatched') return false;
    if (user?.role === 'admin') return true;
    if (user?.role === 'godown_manager' && m.destination === 'godown') return true;
    if (user?.role === 'big_shop_manager' && m.destination === 'big_shop') return true;
    if (user?.role === 'small_shop_manager' && m.destination === 'small_shop') return true;
    return false;
  });

  // Set default page
  useEffect(() => {
    if (user && user.role) {
      setCurrentPage(prev => prev || getDefaultPage());
    }
  }, [user, getDefaultPage]);

  // Notifications
  useEffect(() => {
    if (user && user.role) {
      initializeNotifications();
      const channel = subscribeToIncomingDispatches(user.role, user.id);
      return () => {
        if (channel) unsubscribeFromDispatches();
      };
    }
  }, [user]);

  const handleDispatch = async (movement: Omit<GoodsMovement, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (isOffline) {
        const queued = await dispatchOffline(movement);
        if (queued) return;
      }

      await dispatchMutation.mutateAsync({ movement, user: user!, staff });

      // WhatsApp sharing
      const selectedStaff = staff.find(s => s.id === movement.sent_by);
      const dispatchData = {
        item: movement.item,
        bundles_count: movement.bundles_count,
        movement_type: movement.movement_type || 'bundles',
        source: movement.source || 'godown',
        destination: movement.destination,
        transport_method: movement.transport_method || 'auto',
        auto_name: movement.auto_name,
        sent_by_name: selectedStaff?.name || 'Unknown',
        accompanying_person: movement.accompanying_person,
        dispatch_notes: movement.condition_notes,
        fare_display_msg: movement.transport_method === 'auto' ? movement.fare_display_msg : undefined,
        shirt_bundles: movement.shirt_bundles,
        pant_bundles: movement.pant_bundles,
      };

      setBatchDispatchData(prev => [...prev, dispatchData]);
      if (dispatchBatchTimeout) clearTimeout(dispatchBatchTimeout);

      const timeout = setTimeout(async () => {
        const settings = await getWhatsAppSettings();
        setWhatsAppSettings(settings);
        if (settings.whatsapp_enabled) setShowWhatsAppDialog(true);
      }, 500);
      setDispatchBatchTimeout(timeout);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReceive = async (movementId: string, receiveData: {
    received_at: string;
    received_by: string;
    received_by_name: string;
    condition_notes?: string;
  }) => {
    try {
      if (isOffline) {
        const queued = await receiveOffline(movementId, receiveData);
        if (queued) return;
      }
      await receiveMutation.mutateAsync({ movementId, receiveData });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddStaff = async (newStaff: Omit<Staff, 'id' | 'created_at'>) => {
    await addStaff.mutateAsync(newStaff);
  };

  const handleUpdateStaff = async (id: string, updatedStaff: Omit<Staff, 'id' | 'created_at'>) => {
    await updateStaff.mutateAsync({ id, data: updatedStaff });
  };

  const handleDeleteStaff = async (id: string) => {
    await deleteStaff.mutateAsync(id);
  };

  const handleDataRefresh = () => {
    // React Query handles this automatically via invalidation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  const renderCurrentPage = () => {
    if (dataLoading) return <PageLoader />;

    switch (currentPage) {
      case 'dashboard':
        if (user.role !== 'admin') {
          return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Access denied. Dashboard is only available for administrators.</p></div>;
        }
        return <Dashboard movements={movements} />;
      case 'analytics':
        if (user.role !== 'admin') {
          return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Access denied.</p></div>;
        }
        return <Analytics movements={movements} />;
      case 'dispatch':
        return <DispatchForm staff={staff} movements={movements} userRole={user.role} onDispatch={handleDispatch} onDataRefresh={handleDataRefresh} />;
      case 'receive':
        return <ReceiveForm staff={staff} pendingMovements={pendingMovements} onReceive={handleReceive} />;
      case 'reports':
        return <Reports movements={movements} />;
      case 'admin':
        return <StaffManagement staff={staff} onAddStaff={handleAddStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} />;
      case 'debug':
        if (user.role !== 'admin') {
          return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Access denied.</p></div>;
        }
        return <div className="p-4"><NotificationDebugPanel userRole={user.role} userId={user.id} /></div>;
      default:
        if (user.role === 'admin') return <Dashboard movements={movements} />;
        if (user.role === 'godown_manager') return <DispatchForm staff={staff} movements={movements} userRole={user.role} onDispatch={handleDispatch} onDataRefresh={handleDataRefresh} />;
        return <ReceiveForm staff={staff} pendingMovements={pendingMovements} onReceive={handleReceive} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage || getDefaultPage()}
        onPageChange={handlePageChange}
        isOffline={isOffline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={syncNow}
      >
        <Suspense fallback={<PageLoader />}>
          {renderCurrentPage()}
        </Suspense>
      </Layout>

      {whatsAppSettings && batchDispatchData.length > 0 && (
        <WhatsAppShareDialog
          open={showWhatsAppDialog}
          onClose={() => {
            setShowWhatsAppDialog(false);
            setBatchDispatchData([]);
          }}
          settings={whatsAppSettings}
          dispatchData={batchDispatchData.length === 1 ? batchDispatchData[0] : batchDispatchData}
        />
      )}
    </>
  );
};

export default Index;
