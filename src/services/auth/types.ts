export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
  emailVerified: boolean;
  metadata?: {
    createdAt?: string;
    lastSignInTime?: string;
  };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends AuthCredentials {
  name: string;
}

export interface SignUpResult {
  user: AuthUser;
  needsEmailConfirmation: boolean;
  emailSent?: boolean;
  warningMessage?: string | null;
}

export interface IAuthService {
  signIn(credentials: AuthCredentials): Promise<AuthUser>;
  signUp(credentials: SignUpCredentials): Promise<SignUpResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  sendEmailVerification(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  getAccessToken(): Promise<string | null>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  isAdmin(user: AuthUser | null): boolean;
}
