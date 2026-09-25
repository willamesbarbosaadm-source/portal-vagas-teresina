import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthUser, AuthCredentials, SignUpCredentials, SignUpResult, IAuthService } from './types';

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

export function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const email = user.email || null;
  const displayName = user.displayName || (email ? email.split('@')[0] : null);
  const isAdmin = Boolean(
    email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  return {
    id: user.uid,
    email,
    displayName,
    photoURL: user.photoURL || null,
    isAdmin,
    emailVerified: user.emailVerified,
    metadata: {
      createdAt: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime
    }
  };
}

export function getFirebaseAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta.';
    case 'auth/invalid-email':
      return 'Digite um e-mail válido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'E-mail ou senha incorretos.';
    case 'auth/user-not-found':
      return 'Não foi possível entrar com esses dados.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao servidor. Verifique sua internet.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada pelo administrador.';
    case 'auth/email-verification-failed':
      return 'Não foi possível enviar o e-mail de confirmação. Tente novamente.';
    default:
      if (message.includes('EMAIL_NOT_VERIFIED')) {
        return 'Por favor, confirme seu e-mail através do link enviado para seu endereço antes de entrar.';
      }
      return message || 'Ocorreu um erro no processamento. Tente novamente.';
  }
}

export class FirebaseAuthService implements IAuthService {
  async signIn({ email, password }: AuthCredentials): Promise<AuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Se o e-mail ainda não tiver sido verificado, encerra a sessão temporária e exige confirmação
    if (!user.emailVerified) {
      await signOut(auth);
      const err: any = new Error('EMAIL_NOT_VERIFIED');
      err.code = 'auth/email-not-verified';
      throw err;
    }

    const authUser = mapFirebaseUser(user);
    if (!authUser) throw new Error('Falha ao processar dados do usuário.');
    return authUser;
  }

  async signUp({ email, password, name }: SignUpCredentials): Promise<SignUpResult> {
    const cleanEmail = email.trim();
    const cleanName = name ? name.trim() : cleanEmail.split('@')[0];

    // 1. Cria usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // 2. Atualiza o nome de exibição com updateProfile()
    if (cleanName) {
      try {
        await updateProfile(user, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Erro ao atualizar nome no perfil Firebase:', profileErr);
      }
    }

    // 3. Envia e-mail de confirmação oficial com sendEmailVerification()
    try {
      await sendEmailVerification(user);
    } catch (verifyErr: any) {
      console.error('Erro ao enviar confirmação de e-mail Firebase:', verifyErr);
      const err: any = new Error('Não foi possível enviar o e-mail de confirmação. Tente novamente.');
      err.code = 'auth/email-verification-failed';
      throw err;
    }

    // 4. NÃO fazer login automático sem verificação de e-mail: desconecta imediatamente
    await signOut(auth);

    const authUser = mapFirebaseUser(user)!;
    return {
      user: authUser,
      needsEmailConfirmation: true
    };
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  async sendEmailVerification(): Promise<void> {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('Nenhum usuário conectado para envio de verificação.');
    }
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return null;
    return mapFirebaseUser(user);
  }

  async getAccessToken(): Promise<string | null> {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        callback(mapFirebaseUser(user));
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  }

  isAdmin(user: AuthUser | null): boolean {
    if (!user || !user.email) return false;
    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
}

export const firebaseAuth = new FirebaseAuthService();
