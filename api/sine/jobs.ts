import { getSineDb } from '../../server/sineProvider.ts';
import { collection, getDocs } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const db = getSineDb();
    if (!db) return res.status(503).json({ success: false, error: 'Firestore do SINE-PI não configurado.' });

    const snapshot = await getDocs(collection(db, 'sine_vagas'));
    const jobs: any[] = [];
    snapshot.forEach((docSnap) => jobs.push({ id: docSnap.id, ...docSnap.data() }));

    return res.status(200).json({
      success: true,
      total: jobs.length,
      fonte: 'SINE-PI (Firestore)',
      jobs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Erro ao consultar SINE-PI.' });
  }
}
