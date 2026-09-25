import { useState, useEffect, useCallback } from 'react';
import { firebaseAuth, ADMIN_EMAIL, getFirebaseAuthErrorMessage } from './firebaseAuth';
import { AuthUser, AuthCredentials, SignUpCredentials } from './types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Detecção inicial da sessão Firebase
    firebaseAuth.getCurrentUser().then((currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setIsAdmin(Boolean(currentUser && currentUser.isAdmin));
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Ouvinte em tempo real oficial do Firebase Authentication
    const unsubscribe = firebaseAuth.onAuthStateChanged((updatedUser) => {
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
      const authUser = await firebaseAuth.signIn(credentials);
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
      return await firebaseAuth.signUp(credentials);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await firebaseAuth.resetPassword(email);
  }, []);

  const getAccessToken = useCallback(async () => {
    return await firebaseAuth.getAccessToken();
  }, []);

  return {
    user,
    loading,
    isAdmin,
    adminEmail: ADMIN_EMAIL,
    signIn,
    signUp,
    signOut,
    resetPassword,
    getAccessToken,
    getErrorMessage: getFirebaseAuthErrorMessage
  };
}
