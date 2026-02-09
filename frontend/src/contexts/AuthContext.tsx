import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import type { Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, return null instead of throwing error
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created by backend');
          return null;
        }
        return null;
      }

      return data as User;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  // Initialize auth state - DISABLED since auth is removed
  useEffect(() => {
    // Authentication completely removed - set loading to false immediately
    setIsLoading(false);
    return;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') as any };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
      setSession(data.session);
    }

    return { error: null };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user: { id: 'demo', email: 'demo@example.com', name: 'Demo User', role: 'advisor' },
        session: null,
        isAuthenticated: true, // Always authenticated since auth is removed
        isLoading: false,
        login: async () => ({ error: null }),
        logout: async () => {},
        refreshProfile: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
