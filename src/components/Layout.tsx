import { ReactNode, useState } from 'react';
import { Truck, Package, Users, BarChart3, FileText, LogOut, TrendingUp } from 'lucide-react';
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

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export function Layout({ children, currentPage = 'dashboard', onPageChange }: LayoutProps) {
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

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-sm bg-white/80 border-t border-white/30">
        <div className={`grid gap-1 ${navigation.length === 6 ? 'grid-cols-6' : navigation.length === 5 ? 'grid-cols-5' : navigation.length === 3 ? 'grid-cols-3' : navigation.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange?.(item.id)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 text-xs transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
