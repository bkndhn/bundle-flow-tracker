
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for authentication
const mockUsers: (AppUser & { password: string })[] = [
  {
    id: '1',
    email: 'admin@goods.com',
    password: 'Goodsans7322',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'manager@godown.com',
    password: 'Gdndis65',
    role: 'godown_manager',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'manager@smallshop.com',
    password: 'Mngrss78',
    role: 'small_shop_manager',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'manager@bigshop.com',
    password: 'Mngrbs78',
    role: 'big_shop_manager',
    created_at: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userWithoutPassword = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        created_at: foundUser.created_at,
      };
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
