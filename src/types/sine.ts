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
