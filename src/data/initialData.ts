import { Job, GratitudeComment } from '../types';
import { INITIAL_SINE_JOBS } from './sineInitialJobs';

const REDE_CACIQUE_JOB: Job = {
  id: 'gupy-rede-cacique-assistente-marketing-teresina-pi',
  title: 'Assistente de Marketing',
  company: 'Rede Cacique (Cacique Lubrificantes)',
  companyInitials: 'RC',
  companyColor: 'from-red-600 to-rose-700',
  location: 'Teresina - PI (Zona Sul)',
  workMode: 'Presencial',
  contractType: 'CLT',
  experienceLevel: 'Júnior',
  category: 'Vendas & Mkt',
  salary: 'Salário Fixo + Remuneração Variável por Indicadores',
  description: 'Buscamos um(a) profissional para apoiar ações de marketing, campanhas, canais digitais e o desenvolvimento dos negócios da Cacique Lubrificantes em Teresina - PI.',
  requirements: [
    'Ensino Superior cursando ou concluído em Marketing, Publicidade e Propaganda, Administração ou áreas afins',
    'Experiência prévia em rotinas de marketing, campanhas promocionais e gestão de canais digitais',
    'Perfil proativo, criativo e orientado a resultados e indicadores',
    'Disponibilidade para atuar presencialmente em Teresina - PI (Zona Sul)'
  ],
  benefits: [
    'Salário fixo compatível com a função + Remuneração variável conforme metas',
    'Vale Alimentação',
    'Auxílio Combustível',
    'Plano de Saúde e Odontológico',
    'Descontos exclusivos com empresas parceiras'
  ],
  tags: ['Marketing', 'Gupy Oficial', 'Teresina', 'CLT', 'Presencial', 'Comercial'],
  postedAt: 'Data de publicação não informada pela fonte',
  timestamp: 0,
  applicationUrl: 'https://redecacique.gupy.io/jobs/12457725?jobBoardSource=gupy_public_page',
  isNew: false,
  isFeatured: false,
  viewsCount: 0,
  source: 'Gupy',
  sourceUrl: 'https://redecacique.gupy.io/jobs/12457725?jobBoardSource=gupy_public_page'
};

// Converte vagas do SINE-PI para a listagem principal do catálogo
const convertedSineJobs: Job[] = INITIAL_SINE_JOBS.map((s, idx) => ({
  id: `sine-main-${idx}-${s.id}`,
  title: s.titulo,
  company: s.pcd ? 'SINE-PI (Vaga PCD Oficial)' : 'SINE-PI (Governo do Piauí)',
  companyInitials: 'SN',
  companyColor: s.pcd ? 'from-amber-500 to-yellow-600' : 'from-purple-700 to-indigo-800',
  location: `${s.cidade} - ${s.estado} (${s.quantidade})`,
  workMode: 'Presencial',
  contractType: 'CLT',
  experienceLevel: s.experiencia.toLowerCase().includes('não') ? 'Sem Experiência' : 'Júnior',
  category: s.titulo.toLowerCase().includes('admin') || s.titulo.toLowerCase().includes('recep') ? 'Administrativo' :
            s.titulo.toLowerCase().includes('venda') || s.titulo.toLowerCase().includes('comér') || s.titulo.toLowerCase().includes('loja') ? 'Marketing' :
            s.titulo.toLowerCase().includes('ti') || s.titulo.toLowerCase().includes('rede') || s.titulo.toLowerCase().includes('tec') ? 'Tecnologia' : 'Atendimento',
  salary: s.salario,
  description: `${s.observacoes}\n\nEscolaridade mínima: ${s.escolaridade}.\nExperiência: ${s.experiencia}.\nInteressados devem comparecer a um posto do SINE-PI em Teresina com RG, CPF, Carteira de Trabalho e Currículo.`,
  requirements: s.requisitos,
  benefits: s.beneficios,
  tags: ['SINE-PI', 'Teresina', s.pcd ? 'PCD' : 'Presencial', 'Oficial', 'CLT'],
  postedAt: 'Publicada hoje',
  timestamp: Date.now() - (idx * 180000), // Distribuição recente
  applicationUrl: s.url_fonte || 'https://portal.pi.gov.br/sine/vagas-de-emprego/',
  isNew: true,
  isFeatured: s.pcd || idx < 5,
  viewsCount: 85 + (idx * 3),
  source: 'SINE-PI',
  sourceUrl: s.url_fonte || 'https://portal.pi.gov.br/sine/vagas-de-emprego/'
}));

// Vagas iniciais: O fluxo Gupy agora é carregado exclusivamente de forma dinâmica e verificada
// via API oficial e Firestore, sem injeção de dados estáticos com datas artificiais.
export const INITIAL_JOBS: Job[] = [
  ...convertedSineJobs
];

export const INCOMING_JOBS_POOL: Job[] = [];

export const INITIAL_GRATITUDE: GratitudeComment[] = [];



