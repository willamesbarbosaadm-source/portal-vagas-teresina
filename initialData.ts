import { Job, GratitudeComment } from '../types';
import { GUPY_LIVE_JOBS } from './gupyJobs';
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
  postedAt: 'Hoje',
  timestamp: Date.now(),
  applicationUrl: 'https://redecacique.gupy.io/jobs/12457725?jobBoardSource=gupy_public_page',
  isNew: true,
  isFeatured: true,
  viewsCount: 142,
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

// Combine Rede Cacique + Vagas SINE-PI + Live Gupy jobs
const now = Date.now();
export const INITIAL_JOBS: Job[] = [
  REDE_CACIQUE_JOB,
  ...convertedSineJobs,
  ...GUPY_LIVE_JOBS.map((j, idx) => {
    const daysAgo = idx % 6; // 0 a 5 dias
    const fakeTimestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - ((idx % 24) * 60 * 60 * 1000);
    return {
      ...j,
      timestamp: fakeTimestamp,
      postedAt: daysAgo === 0 ? 'Publicada hoje' : daysAgo === 1 ? 'Publicada ontem' : `Publicada há ${daysAgo} dias`
    };
  })
];

export const INCOMING_JOBS_POOL: Job[] = [];

export const INITIAL_GRATITUDE: GratitudeComment[] = [];



