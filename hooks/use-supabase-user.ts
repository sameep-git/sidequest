import { supabase } from '@/lib/supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useSupabaseUser() {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) return;
        setUser(data.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
