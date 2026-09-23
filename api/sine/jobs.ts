import { getSineDb } from '../../server/sineProvider.ts';
import { collection, getDocs } from 'firebase/firestore';

const SOURCE_URL = 'https://portal.pi.gov.br/sine/vagas-de-emprego/';

function toClientJob(raw: any, id: string) {
  return {
    id,
    titulo: raw.title || 'Não informado na publicação oficial',
    quantidade: raw.quantity ?? 'Não informado na publicação oficial',
    cidade: raw.city || 'Teresina',
    estado: raw.state || 'PI',
    escolaridade: raw.education || 'Não informado na publicação oficial',
    experiencia: raw.experience || 'Não informado na publicação oficial',
    salario: 'Não informado na publicação oficial',
    tipo_contrato: 'Não informado na publicação oficial',
    modalidade: 'Não informado na publicação oficial',
    requisitos: raw.details ? [raw.details] : [],
    cnh: 'Não informado na publicação oficial',
    beneficios: [],
    observacoes: raw.details || 'Não informado na publicação oficial',
    pcd: Boolean(raw.pcd),
    data_publicacao: raw.publicationDate || 'Não informado na publicação oficial',
    data_atualizacao: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : 'Não informado na publicação oficial',
    data_importacao: raw.importedAt || Date.now(),
    fonte: 'SINE-PI',
    url_fonte: raw.sourceUrl || SOURCE_URL,
    hash_vaga: raw.contentHash || '',
    status: raw.status === 'expired' ? 'EXPIRADA' : 'ATIVA',
    ultima_verificacao: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString()
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    const db = getSineDb();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Firestore do SINE-PI não configurado.' });
    }

    const snapshot = await getDocs(collection(db, 'sine_vagas'));
    const jobs: any[] = [];
    snapshot.forEach((docSnap) => {
      jobs.push(toClientJob(docSnap.data(), docSnap.id));
    });

    jobs.sort((a, b) => String(b.data_publicacao).localeCompare(String(a.data_publicacao)));

    return res.status(200).json({
      success: true,
      total: jobs.length,
      fonte: 'SINE-PI (Firestore)',
      sourceUrl: SOURCE_URL,
      publicationTitle: jobs[0]?.data_publicacao ? `Publicação oficial de ${jobs[0].data_publicacao}` : 'Nenhuma sincronização realizada',
      jobs
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao consultar SINE-PI.'
    });
  }
}
