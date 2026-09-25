import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AuthUser, AuthCredentials, SignUpCredentials, IAuthService } from './types';

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const email = user.email || null;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    (email ? email.split('@')[0] : null);

  const isAdmin = Boolean(
    email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  return {
    id: user.id,
    email,
    displayName,
    photoURL: user.user_metadata?.avatar_url || null,
    isAdmin,
    metadata: {
      createdAt: user.created_at,
      lastSignInTime: user.last_sign_in_at
    }
  };
}

export class SupabaseAuthService implements IAuthService {
  async signIn({ email, password }: AuthCredentials): Promise<AuthUser> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth ainda não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user) {
      throw new Error('Usuário não retornado após autenticação.');
    }
    const authUser = mapSupabaseUser(data.user);
    if (!authUser) {
      throw new Error('Falha ao processar dados do usuário.');
    }
    return authUser;
  }

  async signUp({ email, password, name }: SignUpCredentials): Promise<AuthUser> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth ainda não está configurado.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0]
        }
      }
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user) {
      throw new Error('Usuário não retornado após cadastro.');
    }
    const authUser = mapSupabaseUser(data.user);
    if (!authUser) {
      throw new Error('Falha ao processar dados do usuário.');
    }
    return authUser;
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth ainda não está configurado.');
    }
    const redirectUrl = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://vai-que-da-certo-oficial.vercel.app';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePassword(newPassword: string): Promise<AuthUser | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth ainda não está configurado.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      throw new Error(error.message);
    }
    return mapSupabaseUser(data.user);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return mapSupabaseUser(user);
  }

  async getSession(): Promise<any> {
    if (!isSupabaseConfigured) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async getAccessToken(): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  onAuthStateChanged(callback: (user: AuthUser | null, event?: string) => void): () => void {
    if (!isSupabaseConfigured) {
      callback(null);
      return () => {};
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(mapSupabaseUser(session?.user ?? null), event);
    });
    return () => {
      subscription.unsubscribe();
    };
  }

  isAdmin(user: AuthUser | null): boolean {
    if (!user || !user.email) return false;
    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
}

export const supabaseAuth = new SupabaseAuthService();
