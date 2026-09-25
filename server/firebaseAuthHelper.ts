import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';
export const AUTH_PROJECT_ID = 'equipamento-estudantis-bxhgq';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  displayName?: string;
  decodedToken: DecodedIdToken;
}

export interface TokenValidationSuccess {
  ok: true;
  status: 200;
  user: AuthenticatedUser;
}

export interface TokenValidationFailure {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
}

export type TokenValidationResult = TokenValidationSuccess | TokenValidationFailure;

// Estende Request do Express para carregar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: AuthenticatedUser;
    }
  }
}

/**
 * Inicializa a instância oficial do Firebase Admin SDK exclusivamente
 * para o projeto de Authentication: equipamento-estudantis-bxhgq
 */
const AUTH_ADMIN_APP_NAME = 'auth-admin-app';

export function getAuthAdmin(): Auth {
  const existingApp = getApps().find(a => a.name === AUTH_ADMIN_APP_NAME);
  const app: App = existingApp || initializeApp({
    projectId: process.env.VITE_FIREBASE_AUTH_PROJECT_ID || AUTH_PROJECT_ID,
  }, AUTH_ADMIN_APP_NAME);

  return getAuth(app);
}

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

/**
 * Validação oficial do Firebase ID Token usando verifyIdToken() do Firebase Admin SDK.
 * 
 * O verifyIdToken() oficial valida criptograficamente:
 * 1. Assinatura criptográfica (RS256 com certificados públicos oficiais do Google)
 * 2. Expiração do token (exp)
 * 3. Emissor (iss == https://securetoken.google.com/equipamento-estudantis-bxhgq)
 * 4. Audiência (aud == equipamento-estudantis-bxhgq)
 * 5. Subject / UID (sub)
 * 6. Integridade do token
 */
export async function validateFirebaseToken(
  token: string,
  options?: { requireEmailVerified?: boolean }
): Promise<TokenValidationResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { ok: false, status: 401, error: 'Token ausente ou inválido.' };
  }

  const cleanToken = token.trim();

  // Rejeição imediata de tokens com formato não JWT (3 partes separadas por ponto)
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return { ok: false, status: 401, error: 'Formato de token JWT inválido.' };
  }

  try {
    const authAdmin = getAuthAdmin();
    // Validação oficial criptográfica do Firebase Admin SDK
    const decodedToken: DecodedIdToken = await authAdmin.verifyIdToken(cleanToken);

    // Validação de correspondência explícita do Project ID (segurança adicional)
    const expectedProjectId = process.env.VITE_FIREBASE_AUTH_PROJECT_ID || AUTH_PROJECT_ID;
    if (decodedToken.aud !== expectedProjectId) {
      return {
        ok: false,
        status: 401,
        error: `Token emitido para projeto não autorizado (${decodedToken.aud}). Esperado: ${expectedProjectId}.`
      };
    }

    const email = (decodedToken.email || '').toLowerCase().trim();
    if (!email) {
      return {
        ok: false,
        status: 401,
        error: 'Token não contém endereço de e-mail associado.'
      };
    }

    const emailVerified = Boolean(decodedToken.email_verified);

    // Validação opcional de email_verified quando exigido pela rota
    if (options?.requireEmailVerified && !emailVerified) {
      return {
        ok: false,
        status: 403,
        error: 'E-mail não verificado. Confirme seu e-mail antes de prosseguir.'
      };
    }

    const isAdmin = isAuthorizedAdmin(email);

    return {
      ok: true,
      status: 200,
      user: {
        id: decodedToken.uid,
        email,
        isAdmin,
        emailVerified,
        displayName: decodedToken.name,
        decodedToken
      }
    };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/id-token-expired') {
      return { ok: false, status: 401, error: 'Token de autenticação expirado.' };
    }
    if (code === 'auth/id-token-revoked') {
      return { ok: false, status: 401, error: 'Token de autenticação foi revogado.' };
    }
    if (code === 'auth/invalid-id-token' || code === 'auth/argument-error') {
      return { ok: false, status: 401, error: 'Assinatura ou formato do token Firebase inválido.' };
    }
    if (code === 'auth/project-not-found') {
      return { ok: false, status: 503, error: 'Projeto Firebase de autenticação não encontrado.' };
    }

    // Rejeição para tokens forjados, assinaturas corrompidas ou erros de rede
    return {
      ok: false,
      status: 401,
      error: `Falha na verificação criptográfica do token: ${message || 'Token rejeitado.'}`
    };
  }
}

/**
 * Middleware Express para proteger rotas administrativas.
 * Permite acesso se:
 * - A requisição contiver um CRON_SECRET válido (para automações agendadas);
 * - OU a requisição contiver um Firebase ID Token válido pertencente ao ADMIN_EMAIL.
 */
export async function requireFirebaseAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  const cronHeader = req.headers['x-cron-secret'];
  const authHeader = req.headers.authorization;

  // 1. Verificação de automação CRON_SECRET
  if (cronSecret && cronSecret.length >= 8) {
    if (cronHeader && cronHeader === cronSecret) {
      return next();
    }
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      return next();
    }
  }

  // 2. Extração do Bearer Token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Autenticação necessária. Cabeçalho Authorization ausente ou inválido.'
    });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  const validation = await validateFirebaseToken(token);

  if (!validation.ok) {
    res.status(validation.status).json({
      success: false,
      error: validation.error
    });
    return;
  }

  if (!validation.user.isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas o administrador possui permissão para esta operação.'
    });
    return;
  }

  req.firebaseUser = validation.user;
  next();
}

/**
 * Middleware para rotas que exigem usuário autenticado com verificação de e-mail opcional/obrigatória
 */
export function requireAuthenticatedUser(options?: { requireEmailVerified?: boolean }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Autenticação necessária. Cabeçalho Authorization ausente ou inválido.'
      });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    const validation = await validateFirebaseToken(token, {
      requireEmailVerified: options?.requireEmailVerified ?? false
    });

    if (!validation.ok) {
      res.status(validation.status).json({
        success: false,
        error: validation.error
      });
      return;
    }

    req.firebaseUser = validation.user;
    next();
  };
}
