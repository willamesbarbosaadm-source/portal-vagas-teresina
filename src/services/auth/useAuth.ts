import { useState, useEffect, useCallback } from 'react';
import { supabaseAuth, isSupabaseConfigured, ADMIN_EMAIL } from './index';
import { AuthUser, AuthCredentials, SignUpCredentials } from './types';

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Detecção e restauração inicial da sessão
    supabaseAuth.getCurrentUser().then((currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setIsAdmin(Boolean(currentUser && currentUser.isAdmin));
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Ouvinte em tempo real para mudanças de estado de autenticação
    const unsubscribe = supabaseAuth.onAuthStateChanged((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser);
        setIsAdmin(Boolean(updatedUser && updatedUser.isAdmin));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      const authUser = await supabaseAuth.signIn(credentials);
      setUser(authUser);
      setIsAdmin(Boolean(authUser.isAdmin));
      return authUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signUp(credentials);
      if (result.user && result.session) {
        setUser(result.user);
        setIsAdmin(Boolean(result.user.isAdmin));
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseAuth.signOut();
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await supabaseAuth.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const updated = await supabaseAuth.updatePassword(newPassword);
    if (updated) {
      setUser(updated);
      setIsAdmin(Boolean(updated.isAdmin));
    }
    return updated;
  }, []);

  const getAccessToken = useCallback(async () => {
    return await supabaseAuth.getAccessToken();
  }, []);

  return {
    user,
    loading,
    isAdmin,
    isConfigured: isSupabaseConfigured,
    adminEmail: ADMIN_EMAIL,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getAccessToken
  };
}
