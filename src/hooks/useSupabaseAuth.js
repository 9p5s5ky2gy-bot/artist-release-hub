import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function getRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setSession(data?.session || null);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error?.message || 'Não foi possível carregar a sessão. Tente recarregar a página.');
        setSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user || null;

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      session,
      user,
      userEmail: user?.email || '',
      loading,
      authError,
    }),
    [authError, loading, session, user],
  );

  async function signIn(email, password) {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function signUp(email, password) {
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    return data;
  }

  async function resendSignupConfirmation(email) {
    setAuthError('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function signOut() {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  return {
    ...value,
    signIn,
    signUp,
    resendSignupConfirmation,
    signOut,
  };
}
