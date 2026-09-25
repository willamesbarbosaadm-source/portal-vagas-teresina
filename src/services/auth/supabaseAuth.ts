import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AuthUser, AuthCredentials, SignUpCredentials, SignUpResult, IAuthService } from './types';

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

  async signUp({ email, password, name }: SignUpCredentials): Promise<SignUpResult> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth ainda não está configurado.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name ? name.trim() : cleanEmail.split('@')[0];
    const redirectUrl = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://vai-que-da-certo-oficial.vercel.app';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      // Safe diagnosis logging without leaking sensitive data
      console.warn('[Supabase Auth Diagnostic] signUp failed:', {
        status: error.status,
        name: error.name,
        message: error.message
      });

      const errMessage = (error.message || '').toLowerCase();
      if (
        errMessage.includes('error sending confirmation email') ||
        errMessage.includes('error sending email') ||
        error.status === 500
      ) {
        const customErr: any = new Error(
          'Não foi possível enviar o e-mail de confirmação. Verifique a configuração de e-mail do Supabase e tente novamente.'
        );
        customErr.status = error.status;
        customErr.originalMessage = error.message;
        throw customErr;
      }

      if (errMessage.includes('already registered') || errMessage.includes('user already registered')) {
        throw new Error('Este e-mail já está cadastrado. Clique em "Fazer login" para entrar ou recupere sua senha.');
      }

      if (errMessage.includes('rate limit') || errMessage.includes('over_email_send_rate_limit')) {
        throw new Error('Limite de envio de e-mails atingido temporariamente. Aguarde alguns instantes e tente novamente.');
      }

      if (errMessage.includes('password') && (errMessage.includes('least') || errMessage.includes('short') || errMessage.includes('weak'))) {
        throw new Error('A senha deve conter no mínimo 6 caracteres.');
      }

      if (errMessage.includes('valid email') || errMessage.includes('invalid email')) {
        throw new Error('Por favor, informe um endereço de e-mail válido.');
      }

      throw new Error(error.message);
    }

    // Se o usuário já existia previamente, o Supabase retorna um usuário com lista de identities vazia
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      console.warn('[Supabase Auth Diagnostic] Usuário já registrado anteriormente.');
      throw new Error('Este e-mail já está cadastrado. Clique em "Fazer login" para entrar ou solicite a recuperação de senha.');
    }

    if (!data.user) {
      throw new Error('Usuário não retornado após cadastro.');
    }

    const authUser = mapSupabaseUser(data.user);
    const needsEmailConfirmation = !data.session;

    return {
      user: authUser,
      session: data.session,
      needsEmailConfirmation
    };
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
      console.warn('[Supabase Auth Diagnostic] resetPasswordForEmail failed:', {
        status: error.status,
        name: error.name,
        message: error.message
      });
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('error sending') || error.status === 500) {
        throw new Error('Não foi possível enviar o e-mail de recuperação. Verifique a configuração de e-mail do Supabase e tente novamente.');
      }
      if (msg.includes('rate limit')) {
        throw new Error('Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.');
      }
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
