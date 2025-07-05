
import { ReactNode } from 'react';
import { Truck, Package, Users, BarChart3, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export function Layout({ children, currentPage = 'dashboard', onPageChange }: LayoutProps) {
  const { user, logout } = useAuth();

  const getNavigationForRole = () => {
    const baseNav = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseNav,
          { id: 'dispatch', label: 'Dispatch', icon: Truck },
          { id: 'receive', label: 'Receive', icon: Package },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'staff', label: 'Staff', icon: Users },
        ];
      case 'godown_manager':
        return [
          ...baseNav,
          { id: 'dispatch', label: 'Dispatch', icon: Truck },
        ];
      case 'small_shop_manager':
      case 'big_shop_manager':
        return [
          ...baseNav,
          { id: 'receive', label: 'Receive', icon: Package },
        ];
      default:
        return baseNav;
    }
  };

  const navigation = getNavigationForRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-xl">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Goods Movement Tracker</h1>
            <p className="text-sm text-white/80">
              {user?.role === 'admin' && 'Admin Portal'}
              {user?.role === 'godown_manager' && 'Godown Management'}
              {user?.role === 'small_shop_manager' && 'Small Shop Management'}
              {user?.role === 'big_shop_manager' && 'Big Shop Management'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm">{user?.email}</span>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/10 border-t border-white/20">
        <div className={`grid gap-1 ${navigation.length === 5 ? 'grid-cols-5' : navigation.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                    ? "text-white bg-white/20" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
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
