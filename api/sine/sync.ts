import { syncSineJobs } from '../../server/sineProvider.ts';

const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

async function requireAdmin(req: any) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!idToken || !apiKey) throw Object.assign(new Error('Não autenticado.'), { statusCode: 401 });

  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );
  if (!response.ok) throw Object.assign(new Error('Token Firebase inválido ou expirado.'), { statusCode: 401 });
  const data = await response.json();
  const email = data.users?.[0]?.email;
  if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw Object.assign(new Error('Acesso restrito ao administrador.'), { statusCode: 403 });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido.' });
  try {
    await requireAdmin(req);
    const result = await syncSineJobs();
    return res.status(result.success ? 200 : 502).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Erro na sincronização SINE-PI.' });
  }
}
