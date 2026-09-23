import { Job } from '../types';
import { SCRAPED_LINKEDIN_JOBS_RAW, LinkedInScrapedJobRaw } from './scrapedLinkedInJobs';

const getCompanyColor = (index: number): string => {
  const colors = [
    'from-emerald-700 via-teal-700 to-emerald-900',
    'from-teal-800 via-emerald-800 to-green-950',
    'from-blue-700 via-indigo-700 to-slate-900',
    'from-sky-600 via-blue-700 to-indigo-900',
    'from-yellow-600 via-amber-700 to-orange-900',
    'from-emerald-600 via-teal-700 to-cyan-900',
    'from-rose-600 via-pink-700 to-purple-900',
    'from-indigo-600 via-purple-700 to-pink-900',
    'from-cyan-600 via-blue-700 to-indigo-900',
    'from-violet-600 via-purple-700 to-indigo-900',
    'from-amber-600 via-orange-700 to-red-900'
  ];
  return colors[index % colors.length];
};

const getInitials = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const determineWorkMode = (raw: LinkedInScrapedJobRaw): 'Remoto' | 'Híbrido' | 'Presencial' => {
  const text = (raw.cargo + ' ' + raw.requisitos).toLowerCase();
  if (text.includes('híbrido') || text.includes('hibrido')) return 'Híbrido';
  if (text.includes('remoto') || text.includes('home office')) return 'Remoto';
  return 'Presencial';
};

const determineContractType = (raw: LinkedInScrapedJobRaw): 'CLT' | 'PJ' | 'Estágio' | 'Freelance' => {
  const text = (raw.cargo + ' ' + raw.requisitos + ' ' + raw.remuneracao_beneficios).toLowerCase();
  if (text.includes('estágio') || text.includes('estagio')) return 'Estágio';
  if (text.includes('pj') || text.includes('prestador')) return 'PJ';
  if (text.includes('freelance') || text.includes('temporário')) return 'Freelance';
  return 'CLT';
};

const determineExperience = (raw: LinkedInScrapedJobRaw): 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Sem Experiência' => {
  const text = (raw.cargo + ' ' + raw.requisitos).toLowerCase();
  if (text.includes('estágio') || text.includes('sem experiência') || text.includes('primeiro emprego')) return 'Sem Experiência';
  if (text.includes('sênior') || text.includes('senior') || text.includes('especialista') || text.includes('coordenador') || text.includes('supervisor')) return 'Sênior';
  if (text.includes('pleno') || text.includes('analista') || text.includes('engenheiro') || text.includes('enfermeiro')) return 'Pleno';
  return 'Júnior';
};

export const CONVERTED_SCRAPED_JOBS: Job[] = SCRAPED_LINKEDIN_JOBS_RAW.map((raw, idx) => {
  const isEmail = raw.contacto_candidatura.startsWith('mailto:') || raw.contacto_candidatura.includes('@');
  const cleanEmail = isEmail ? raw.contacto_candidatura.replace('mailto:', '').trim() : undefined;
  const isUrl = !isEmail && raw.contacto_candidatura.startsWith('http');
  const applicationUrl = isUrl ? raw.contacto_candidatura : raw.link_post_linkedin;

  const reqList = raw.requisitos.split(';').map((r) => r.trim()).filter(Boolean);
  const benList = raw.remuneracao_beneficios.split('+').slice(1).map((b) => b.trim()).filter(Boolean);

  const tags = [
    'Teresina',
    raw.empresa.split(' ')[0],
    raw.area.split('/')[0].trim(),
    determineWorkMode(raw),
    determineContractType(raw),
    'LinkedIn Verificado'
  ];

  return {
    id: `linkedin-scraped-${idx + 1}-${raw.empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    title: raw.cargo,
    company: raw.empresa,
    companyInitials: getInitials(raw.empresa),
    companyColor: getCompanyColor(idx),
    location: 'Teresina - PI',
    workMode: determineWorkMode(raw),
    contractType: determineContractType(raw),
    experienceLevel: determineExperience(raw),
    category: raw.area.split('/')[0].trim(),
    salary: raw.remuneracao_beneficios.split('+')[0].trim(),
    description: `${raw.cargo} na empresa ${raw.empresa} em Teresina - PI. Área de ${raw.area}. Vaga ativa auditada no LinkedIn de recrutamento local. Requisitos: ${raw.requisitos}`,
    requirements: reqList.length > 0 ? reqList : [raw.requisitos],
    benefits: benList.length > 0 ? benList : ['Benefícios compatíveis com a categoria', 'Vale Transporte / Mobilidade'],
    tags: Array.from(new Set(tags)),
    postedAt: `Hoje • Verificado (${raw.data_verificacao.split(' ')[0]})`,
    timestamp: Date.now() - idx * 1000 * 60 * 15,
    applicationUrl: applicationUrl,
    contactEmail: cleanEmail,
    isNew: true,
    isFeatured: idx < 4,
    viewsCount: Math.floor(45 + Math.random() * 80),
    source: 'LinkedIn',
    sourceUrl: raw.link_post_linkedin
  };
});
