import { Job, GratitudeComment } from '../types';
import { GUPY_LIVE_JOBS } from './gupyJobs';

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

// Combine Rede Cacique + All live Gupy jobs with fresh timestamps (0 a 5 dias)
const now = Date.now();
export const INITIAL_JOBS: Job[] = [
  REDE_CACIQUE_JOB,
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



