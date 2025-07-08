
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    try {
      // Simple password check for admin
      if (email === 'admin@goods.com' && password === 'Goodsans7322') {
        const adminUser = {
          id: 'admin-001',
          email: 'admin@goods.com',
          role: 'admin' as const,
          created_at: new Date().toISOString(),
        };
        setUser(adminUser);
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return true;
      }

      // Query our custom app_users table for other users
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !users) {
        console.error('Login error:', error);
        return false;
      }

      // Simple password verification (in production, use proper hashing)
      const validPasswords: { [key: string]: string } = {
        'manager@godown.com': 'Gdndis65',
        'manager@smallshop.com': 'Mngrss78',
        'manager@bigshop.com': 'Mngrbs78'
      };

      const expectedPassword = validPasswords[email];
      if (!expectedPassword || password !== expectedPassword) {
        console.error('Invalid password');
        return false;
      }

      const userWithoutPassword = {
        id: users.id,
        email: users.email,
        role: users.role as 'admin' | 'godown_manager' | 'small_shop_manager' | 'big_shop_manager',
        created_at: users.created_at,
      };

      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
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
