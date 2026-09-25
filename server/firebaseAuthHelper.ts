import type { Request, Response, NextFunction } from 'express';

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';
export const AUTH_PROJECT_ID = 'equipamento-estudantis-bxhgq';
export const AUTH_API_KEY = 'AIzaSyAE9SFXO0CK3Rso-BsLpEld8xqMYayUoj0';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  displayName?: string;
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

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

/**
 * Valida o Firebase ID Token emitido exclusivamente pelo projeto de Authentication:
 * Projeto: equipamento-estudantis-bxhgq
 * Realiza verificação criptográfica autoritativa junto à API oficial do Google Identity Toolkit.
 */
export async function validateFirebaseToken(token: string): Promise<TokenValidationResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { ok: false, status: 401, error: 'Token ausente ou inválido.' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return { ok: false, status: 401, error: 'Formato de token JWT inválido.' };
  }

  // 1. Verificação do cabeçalho JWT (rejeita alg: none e algoritmos ausentes)
  try {
    const headerStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerStr);
    if (!header || typeof header !== 'object') {
      return { ok: false, status: 401, error: 'Cabeçalho JWT inválido.' };
    }
    const alg = String(header.alg || '').toLowerCase().trim();
    if (!alg || alg === 'none' || alg === 'null') {
      return { ok: false, status: 401, error: 'Algoritmo de assinatura não permitido (alg: none).' };
    }
  } catch {
    return { ok: false, status: 401, error: 'Falha ao decodificar cabeçalho do token.' };
  }

  // 2. Rejeição explícita de tokens forjados conhecidos ou sem assinatura real
  if (parts[2] === 'fake_signature' || parts[2].trim().length < 10) {
    return { ok: false, status: 401, error: 'Assinatura criptográfica do token forjada ou ausente.' };
  }

  // 3. Verificação de expiração e emissor prévia se contida no payload
  try {
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload && payload.exp && typeof payload.exp === 'number') {
      if (payload.exp * 1000 < Date.now()) {
        return { ok: false, status: 401, error: 'Token de autenticação expirado.' };
      }
    }
    // Confirma que o token foi emitido para o projeto de Auth equipamento-estudantis-bxhgq
    if (payload && payload.aud && typeof payload.aud === 'string') {
      if (payload.aud !== AUTH_PROJECT_ID && !payload.aud.includes(AUTH_PROJECT_ID)) {
        return { ok: false, status: 401, error: 'Token emitido para projeto de autenticação não autorizado.' };
      }
    }
  } catch {
    return { ok: false, status: 401, error: 'Payload do token corrompido.' };
  }

  const apiKey = process.env.VITE_FIREBASE_AUTH_API_KEY || AUTH_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: 'Chave de API do Firebase Authentication não configurada no servidor.'
    };
  }

  // 4. Validação autoritativa na API oficial do Google Identity Toolkit para equipamento-estudantis-bxhgq
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token.trim() })
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        status: 401,
        error: 'Token rejeitado pelo provedor Firebase Authentication (equipamento-estudantis-bxhgq).'
      };
    }

    const data: any = await response.json();
    const userRecord = data?.users?.[0];

    if (!userRecord || !userRecord.email) {
      return {
        ok: false,
        status: 401,
        error: 'Usuário não localizado no Firebase Authentication.'
      };
    }

    const email = String(userRecord.email).toLowerCase().trim();
    const isAdmin = isAuthorizedAdmin(email);

    return {
      ok: true,
      status: 200,
      user: {
        id: userRecord.localId,
        email,
        isAdmin,
        emailVerified: Boolean(userRecord.emailVerified),
        displayName: userRecord.displayName
      }
    };
  } catch (netErr: any) {
    console.error('Erro de conexão ao validar token Firebase Auth:', netErr);
    return {
      ok: false,
      status: 503,
      error: 'Falha temporária de comunicação com o serviço de autenticação do Firebase.'
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
