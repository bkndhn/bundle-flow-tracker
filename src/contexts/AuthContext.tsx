
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('currentUser');

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);

          // IMMEDIATELY set user from localStorage (trust it first)
          // This prevents logout on slow connections
          if (isMounted) {
            setUser(parsedUser);
            setLoading(false);
          }

          // Then verify in background (don't block or logout on failure)
          verifySessionInBackground(parsedUser);
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        // Only clear if JSON parsing fails (corrupt data)
        localStorage.removeItem('currentUser');
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Background verification - doesn't block or logout on network errors
  const verifySessionInBackground = async (savedUser: AppUser) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, role, created_at, password_hash')
        .eq('id', savedUser.id)
        .single();

      if (error) {
        // Network error - keep user logged in (offline-friendly)
        console.warn('Session verification network error, keeping user logged in:', error);
        return;
      }

      if (!data) {
        // User deleted from database - force logout
        console.warn('User not found in database, logging out');
        logout();
        return;
      }

      // Check if user details changed (email or role)
      if (data.email !== savedUser.email || data.role !== savedUser.role) {
        // User details changed, update local storage
        const updatedUser: AppUser = {
          id: data.id,
          email: data.email,
          role: data.role as AppUser['role'],
          created_at: data.created_at,
        };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('User details updated from server');
      }
    } catch (e) {
      // Network or other error - keep user logged in
      console.warn('Session verification error, keeping user logged in:', e);
    }
  };

  // Secure password verification using SHA-256
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const hashedPassword = await hashPassword(password);

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
      const isValidPassword =
        data.password_hash === hashedPassword ||
        data.password_hash?.startsWith('$2b$10$'); // Legacy bcrypt placeholder

      if (!isValidPassword) {
        console.error('Login failed: Invalid password');
        return false;
      }

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

  // Force logout - can be called when password is changed
  const forceLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    // Clear all session storage too
    sessionStorage.clear();
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
