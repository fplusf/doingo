import { supabase } from '@/lib/supabase-client';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      // detectSessionInUrl:true will parse and store session automatically.
      await supabase.auth.getSession();
      navigate({ to: '/tasks' });
    };

    finishAuth();
  }, [navigate]);

  return null;
}
