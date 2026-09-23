import { Job, GratitudeComment } from '../types';

export const INITIAL_JOBS: Job[] = [
  {
    id: 'gupy-rede-cacique-assistente-marketing-teresina-pi',
    title: 'Assistente de Marketing',
    company: 'Rede Cacique (Cacique Lubrificantes)',
    companyInitials: 'RC',
    companyColor: 'bg-red-600',
    location: 'Teresina - PI (Zona Sul)',
    workMode: 'Presencial',
    contractType: 'CLT',
    experienceLevel: 'Júnior',
    category: 'Marketing',
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
    tags: ['Marketing', 'Gupy', 'Teresina', 'CLT', 'Presencial', 'Comercial'],
    postedAt: 'Hoje',
    timestamp: Date.now(),
    applicationUrl: 'https://redecacique.gupy.io/jobs/12457725?jobBoardSource=gupy_public_page',
    isNew: true,
    isFeatured: true,
    viewsCount: 142,
    source: 'Gupy',
    sourceUrl: 'https://redecacique.gupy.io/jobs/12457725?jobBoardSource=gupy_public_page'
  }
];

export const INCOMING_JOBS_POOL: Job[] = [];

export const INITIAL_GRATITUDE: GratitudeComment[] = [];


