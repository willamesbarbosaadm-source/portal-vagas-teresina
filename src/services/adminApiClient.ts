import { firebaseAuth } from './auth';

export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Função centralizada para executar chamadas a endpoints administrativos protegidos.
 * Garante:
 * 1. Obtenção do token de acesso Firebase (getAccessToken);
 * 2. Bloqueio imediato no client-side se o usuário não possuir token ativo;
 * 3. Envio seguro do cabeçalho Authorization: Bearer <token>;
 * 4. Tratamento unificado de 401 (sessão expirada / não autenticado), 403 (não admin) e erros de rede.
 */
export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AdminApiResponse<T>> {
  const token = await firebaseAuth.getAccessToken();

  if (!token) {
    return {
      success: false,
      error: 'Autenticação necessária. Nenhuma sessão ativa do Firebase encontrada. Por favor, autentique-se como administrador.',
      statusCode: 401
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {})
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      return {
        success: false,
        error: data?.error || 'Sessão expirada ou token inválido. Por favor, refaça o login como administrador.',
        data,
        statusCode: 401
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: data?.error || 'Acesso negado. Apenas o administrador possui permissão para esta operação.',
        data,
        statusCode: 403
      };
    }

    if (response.status === 503) {
      return {
        success: false,
        error: data?.error || 'Serviço de autenticação temporariamente indisponível no servidor.',
        data,
        statusCode: 503
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Erro do servidor (${response.status})`,
        data,
        statusCode: response.status
      };
    }

    return {
      success: true,
      data,
      statusCode: response.status
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Falha de conexão com o servidor.',
      statusCode: 0
    };
  }
}

export async function triggerSineSync(): Promise<AdminApiResponse> {
  return adminFetch('/api/sine/sync', { method: 'POST' });
}

export async function triggerGupySync(): Promise<AdminApiResponse> {
  return adminFetch('/api/gupy/sync', { method: 'POST' });
}

export async function triggerThemosSync(): Promise<AdminApiResponse> {
  return adminFetch('/api/themos/sync', { method: 'POST' });
}
