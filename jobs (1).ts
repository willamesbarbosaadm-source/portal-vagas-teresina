import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_SINE_JOBS } from '../../src/data/sineInitialJobs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({
      success: true,
      total: INITIAL_SINE_JOBS.length,
      data_publicacao: "23/09/2026",
      fonte: "SINE-PI (Boletim Oficial Governo do Piauí)",
      jobs: INITIAL_SINE_JOBS
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao carregar vagas do SINE-PI'
    });
  }
}
