import { ReactNode, useState, memo } from 'react';
import { Truck, Package, Users, BarChart3, FileText, LogOut, TrendingUp, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { NotificationStatus } from './NotificationStatus';
import { OfflineIndicator } from './OfflineIndicator';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
  onPageChange?: (page: string) => void;
  // Offline sync props
  isOffline?: boolean;
  pendingCount?: { dispatches: number; receives: number };
  isSyncing?: boolean;
  onSyncNow?: () => void;
}

export const Layout = memo(function Layout({ 
  children, 
  currentPage = 'dashboard', 
  onPageChange,
  isOffline = false,
  pendingCount = { dispatches: 0, receives: 0 },
  isSyncing = false,
  onSyncNow = () => {},
}: LayoutProps) {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  const getNavigationForRole = () => {
    const baseNav = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseNav,
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'dispatch', label: 'Dispatch', icon: Truck },
          { id: 'receive', label: 'Receive', icon: Package },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'admin', label: 'Admin', icon: Users },
          { id: 'debug', label: 'Debug', icon: Bug },
        ];
      case 'godown_manager':
        return [
          { id: 'dispatch', label: 'Dispatch', icon: Truck },
          { id: 'receive', label: 'Receive', icon: Package },
        ];
      case 'small_shop_manager':
      case 'big_shop_manager':
        return [
          { id: 'dispatch', label: 'Dispatch', icon: Truck },
          { id: 'receive', label: 'Receive', icon: Package },
        ];
      default:
        return baseNav;
    }
  };

  const navigation = getNavigationForRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <PWAInstallPrompt />
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to sign in again to access the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="backdrop-blur-sm bg-white/70 border-b border-white/30 shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2 rounded-lg shadow-md">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Goods Movement Tracker</h1>
              <p className="text-sm text-gray-600">
                {user?.role === 'admin' && 'Admin Portal'}
                {user?.role === 'godown_manager' && 'Godown Management'}
                {user?.role === 'small_shop_manager' && 'Small Shop Management'}
                {user?.role === 'big_shop_manager' && 'Big Shop Management'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-gray-600 text-sm hidden sm:block">{user?.email}</span>
            {/* Offline Indicator */}
            <OfflineIndicator
              isOffline={isOffline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onSyncNow={onSyncNow}
            />
            <NotificationStatus userRole={user?.role} userId={user?.id} />
            <Button
              onClick={handleLogoutClick}
              variant="outline"
              size="sm"
              className="bg-white/60 border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
          📡 You're offline. Changes will sync when connected.
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Enhanced with vibrant colors */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t-2 border-blue-500/30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className={`flex ${navigation.length > 5 ? 'overflow-x-auto scrollbar-hide' : ''} ${navigation.length <= 5 ? `grid grid-cols-${navigation.length}` : ''}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange?.(item.id)}
                className={cn(
                  "relative flex flex-col items-center py-3 text-xs transition-all duration-300 flex-shrink-0",
                  navigation.length > 5 ? "px-3 min-w-[64px]" : "px-1 flex-1",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-blue-500/20 to-transparent" />
                )}
                {/* Active top bar indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                )}
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/40" 
                    : "hover:bg-slate-700/50"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "font-medium mt-1 transition-all duration-300 text-[10px] leading-tight",
                  isActive ? "text-blue-300" : ""
                )}>{item.label}</span>
              </button>
            );
          })}
        </div>
        {/* Safe area for notched devices */}
        <div className="h-safe-area-bottom bg-slate-900" />
      </nav>
    </div>
  );
});
