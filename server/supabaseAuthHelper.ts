import type { Request, Response, NextFunction } from 'express';

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

export interface DecodedSupabaseToken {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  role?: string;
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
      supabaseUser?: AuthenticatedUser;
    }
  }
}

const REAL_SUPABASE_CONFIG = {
  url: 'https://devkpsjwgvefikxbdsry.supabase.co',
  anonKey: 'sb_publishable_LsczW5EBxyg99ChAsnsegw_QeLhEt0d'
};

const isPlaceholder = (val?: string) =>
  !val ||
  ['', 'undefined', 'null', 'your_supabase_url', 'your_supabase_anon_key', '1sdcfds'].includes(
    val.trim().toLowerCase()
  ) ||
  !val.trim().startsWith('http');

const isKeyPlaceholder = (val?: string) =>
  !val ||
  ['', 'undefined', 'null', 'your_supabase_anon_key', 'placeholder-anon-key'].includes(
    val.trim().toLowerCase()
  ) ||
  val.trim().length < 10;

export function getSupabaseServerConfig() {
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const envAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const url = !isPlaceholder(envUrl) ? envUrl!.trim() : REAL_SUPABASE_CONFIG.url;
  const anonKey = !isKeyPlaceholder(envAnonKey) ? envAnonKey!.trim() : REAL_SUPABASE_CONFIG.anonKey;
  const isConfigured = Boolean(
    url.startsWith('http') && anonKey.length > 10
  );

  return {
    url: isConfigured ? url : null,
    anonKey: isConfigured ? anonKey : null,
    isConfigured
  };
}

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

/**
 * Valida o token de autenticação exclusivamente junto ao Supabase Auth.
 * NUNCA confia em decodificação Base64 sem assinatura criptográfica válida.
 * Rejeita explicitamente alg:none, assinaturas forjadas e tokens corrompidos.
 */
export async function validateSupabaseToken(token: string): Promise<TokenValidationResult> {
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

  // 3. Verificação de expiração prévia se contida no payload
  try {
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload && payload.exp && typeof payload.exp === 'number') {
      if (payload.exp * 1000 < Date.now()) {
        return { ok: false, status: 401, error: 'Token de autenticação expirado.' };
      }
    }
  } catch {
    return { ok: false, status: 401, error: 'Payload do token corrompido.' };
  }

  const { url, anonKey, isConfigured } = getSupabaseServerConfig();

  // 4. Se Supabase não estiver configurado no servidor, o serviço de auth está indisponível (503)
  if (!isConfigured || !url || !anonKey) {
    return {
      ok: false,
      status: 503,
      error: 'Serviço de autenticação Supabase não configurado no servidor.'
    };
  }

  // 5. Validação autoritativa e verificação de assinatura junto à API oficial do Supabase
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 401,
        error: 'Token rejeitado pelo provedor Supabase Auth.'
      };
    }

    const userData: any = await response.json();
    const email = userData?.email ? String(userData.email).trim().toLowerCase() : '';
    if (!email) {
      return {
        ok: false,
        status: 401,
        error: 'Usuário sem e-mail retornado pelo provedor Supabase.'
      };
    }

    const isAdmin = isAuthorizedAdmin(email);
    return {
      ok: true,
      status: 200,
      user: {
        id: String(userData.id || ''),
        email,
        isAdmin,
        role: userData.role
      }
    };
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 503,
      error: 'Falha de comunicação de rede com o serviço Supabase Auth.'
    };
  }
}

/**
 * Middleware: Exige que o usuário esteja autenticado via Supabase Auth
 */
export async function requireSupabaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária. Cabeçalho Authorization ausente.'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Formato de autenticação inválido. Utilize Bearer <token>.'
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token Bearer ausente.'
    });
  }

  const result = await validateSupabaseToken(token);
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      error: result.error
    });
  }

  req.supabaseUser = result.user;
  return next();
}

/**
 * Middleware: Exige privilégios de administrador via Supabase Auth.
 * NUNCA permite bypass ou rotas liberadas sem autorização estrita.
 */
export async function requireSupabaseAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // 1. Verificação de cron / automação interna com CRON_SECRET (se configurado)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return next();
  }

  // 2. Sem Authorization -> 401
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária. Cabeçalho Authorization ausente.'
    });
  }

  // 3. Formato deve ser Bearer <token> -> 401 se diferente
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Formato de autenticação inválido. Utilize Bearer <token>.'
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token Bearer ausente.'
    });
  }

  // 4. Validação real do token junto ao Supabase
  const result = await validateSupabaseToken(token);

  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      error: result.error
    });
  }

  // 5. Verificação de administrador
  if (!result.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas o administrador possui permissão para esta operação.'
    });
  }

  req.supabaseUser = result.user;
  return next();
}

