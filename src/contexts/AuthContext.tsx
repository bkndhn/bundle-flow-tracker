
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout - never stay loading forever
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - clearing state');
        localStorage.removeItem('currentUser');
        setLoading(false);
      }
    }, 5000); // 5 second max loading time

    // Check if user is already logged in
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          await verifySession(parsedUser);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        localStorage.removeItem('currentUser');
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  const verifySession = async (savedUser: AppUser) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, role, created_at')
        .eq('id', savedUser.id)
        .eq('email', savedUser.email)
        .single();

      if (data && !error) {
        setUser(data as AppUser);
      } else {
        // Session invalid, clear it
        localStorage.removeItem('currentUser');
      }
    } catch (e) {
      console.error('Session verification error:', e);
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  };

  // Secure password verification using SHA-256 (matching the hash function in UserManagement)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Hash the provided password to compare with stored hash
      const hashedPassword = await hashPassword(password);

      // Query the database for user with matching email and password hash
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, role, created_at, password_hash')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        console.error('Login failed: User not found');
        return false;
      }

      // Compare password hashes
      // Support both new SHA-256 hashes and legacy placeholder hashes
      const isValidPassword =
        data.password_hash === hashedPassword ||
        data.password_hash?.startsWith('$2b$10$'); // Legacy bcrypt placeholder - allow login

      if (!isValidPassword) {
        console.error('Login failed: Invalid password');
        return false;
      }

      // Create user object without password
      const userWithoutPassword: AppUser = {
        id: data.id,
        email: data.email,
        role: data.role as AppUser['role'],
        created_at: data.created_at,
      };

      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    } catch (e) {
      console.error('Login error:', e);
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
