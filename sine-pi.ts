import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncSineJobs } from '../../server/sineProvider';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'default_cron_secret_vaiquedcerto';

  // Permite chamada se Authorization header bater com CRON_SECRET ou se disparado por Vercel Cron
  const isVercelCron = req.headers['user-agent']?.includes('vercel-cron');
  const isValidAuth = authHeader === `Bearer ${cronSecret}`;

  if (!isValidAuth && !isVercelCron && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing CRON_SECRET.' });
  }

  try {
    const result = await syncSineJobs();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('CRON /api/cron/sine-pi error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao executar cron do SINE-PI'
    });
  }
}
