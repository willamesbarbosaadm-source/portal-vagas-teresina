export interface SineJob {
  id: string;
  titulo: string;
  quantidade: string | number;
  cidade: string;
  estado: string;
  escolaridade: string;
  experiencia: string;
  salario: string;
  tipo_contrato: string;
  modalidade: string;
  requisitos: string[];
  cnh: string;
  beneficios: string[];
  observacoes: string;
  pcd: boolean;
  data_publicacao: string;
  data_atualizacao: string;
  data_importacao: number;
  fonte: string;
  url_fonte: string;
  hash_vaga: string;
  status: 'ATIVA' | 'EXPIRADA' | 'ATUALIZADA' | 'REMOVIDA' | 'PENDENTE_DE_VERIFICACAO';
  ultima_verificacao: string;
  isNew?: boolean;
}

export interface SineSyncLog {
  id?: string;
  timestamp: number;
  dataHora: string;
  publicacaoEncontrada: string;
  url: string;
  vagasIdentificadas: number;
  vagasNovas: number;
  vagasAtualizadas: number;
  vagasDuplicadas: number;
  vagasDescartadas: number;
  erro: boolean;
  mensagemErro?: string;
}

export interface SineProvider {
  getLatestPublications(): Promise<{ date: string; url: string }>;
  fetchJobs(url: string): Promise<SineJob[]>;
  normalizeJob(raw: any): SineJob;
  generateHash(job: Partial<SineJob>): string;
}

export function isSineJobRecord(job: any): boolean {
  if (!job) return false;
  const source = String(job.source || '').trim().toUpperCase();
  const fonte = String(job.fonte || '').trim().toUpperCase();
  const origin = String(job.origem || '').trim().toUpperCase();
  const id = String(job.id || '').toLowerCase();
  const company = String(job.company || job.empresa || '').toUpperCase();

  return (
    source === 'SINE' ||
    source === 'SINE-PI' ||
    source.includes('SINE') ||
    fonte === 'SINE' ||
    fonte === 'SINE-PI' ||
    fonte.includes('SINE') ||
    origin.includes('SINE') ||
    id.startsWith('sine_') ||
    id.startsWith('sine-') ||
    company.includes('SINE-PI')
  );
}

export function normalizeSineJobRecord(raw: any): SineJob {
  const id = String(raw.id || raw.hash_vaga || `sine_${Math.random().toString(36).substring(2, 9)}`);
  return {
    id,
    titulo: raw.titulo || raw.title || raw.cargo || raw.funcao || 'Vaga SINE-PI',
    quantidade: raw.quantidade ?? raw.quantity ?? 1,
    cidade: raw.cidade || 'Teresina',
    estado: raw.estado || 'PI',
    escolaridade: raw.escolaridade || raw.education || 'Não informado na publicação oficial',
    experiencia: raw.experiencia || raw.experience || 'Não informado na publicação oficial',
    salario: raw.salario || 'Piso Salarial / A Combinar',
    tipo_contrato: raw.tipo_contrato || raw.contractType || 'CLT',
    modalidade: raw.modalidade || raw.workMode || 'Presencial',
    requisitos: Array.isArray(raw.requisitos)
      ? raw.requisitos
      : (raw.escolaridade ? [raw.escolaridade] : ['Não informado']),
    cnh: raw.cnh || 'Não informado',
    beneficios: Array.isArray(raw.beneficios)
      ? raw.beneficios
      : ['Vale Transporte', 'Benefícios Legais'],
    observacoes: raw.descricao_requisitos || raw.observacoes || raw.details || raw.description || 'Não informado na publicação oficial',
    pcd: Boolean(raw.pcd || raw.pcdOnly || (raw.tipo_vaga && String(raw.tipo_vaga).toLowerCase().includes('pcd'))),
    data_publicacao: raw.data_publicacao || raw.publicationDate || '23/09/2026',
    data_atualizacao: raw.data_atualizacao || new Date(raw.updated_at || raw.updatedAt || Date.now()).toLocaleDateString('pt-BR'),
    data_importacao: raw.data_importacao || raw.imported_at || raw.importedAt || Date.now(),
    fonte: 'SINE-PI',
    url_fonte: raw.pdf_url || raw.sourcePdfUrl || raw.url_fonte || raw.source_reference || 'https://portal.pi.gov.br/sine/vagas-de-emprego/',
    hash_vaga: raw.hash_vaga || raw.contentHash || id,
    status: (raw.status === 'EXPIRADA' ? 'EXPIRADA' : 'ATIVA'),
    ultima_verificacao: raw.ultima_verificacao || new Date().toLocaleString('pt-BR'),
    isNew: raw.isNew ?? true
  };
}

