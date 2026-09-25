export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
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
  user: AuthUser | null;
  session: any | null;
  needsEmailConfirmation: boolean;
}

export interface IAuthService {
  signIn(credentials: AuthCredentials): Promise<AuthUser>;
  signUp(credentials: SignUpCredentials): Promise<SignUpResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<AuthUser | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  getSession(): Promise<any>;
  getAccessToken(): Promise<string | null>;
  onAuthStateChanged(callback: (user: AuthUser | null, event?: string) => void): () => void;
  isAdmin(user: AuthUser | null): boolean;
}
