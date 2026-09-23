import { syncSineJobs } from '../../server/sineProvider.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Método não permitido.' });
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  try {
    const result = await syncSineJobs();
    return res.status(result.success ? 200 : 502).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro no cron SINE-PI.' });
  }
}
