import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncSineJobs } from '../../server/sineProvider';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const result = await syncSineJobs();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('API /api/sine/sync error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao sincronizar vagas do SINE-PI'
    });
  }
}
