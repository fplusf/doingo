import { supabase } from '@/lib/supabase-client';
import { toast } from '@/shared/hooks/use-toast';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from '@tanstack/react-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    console.log('data:', subscription);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Sign in failed',
        description: message,
      });
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({ to: '/login' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Sign out failed',
        description: message,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
