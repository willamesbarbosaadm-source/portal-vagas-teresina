import fs from 'fs';
import path from 'path';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getServerFirestore } from './firebaseDb.ts';

function getFirebaseDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error('Erro ao inicializar Firestore em GupyProvider:', err);
    return null;
  }
}

export interface GupyRawJob {
  id: number;
  name: string;
  careerPageName: string;
  careerPageLogo: string;
  careerPageUrl: string;
  type: string;
  publishedDate: string;
  workplaceType: string;
  city: string;
  state: string;
  jobUrl: string;
  description?: string;
  disabilities?: boolean;
}

export interface ConvertedGupyJob {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  location: string;
  workMode: 'Presencial' | 'Híbrido' | 'Remoto' | string;
  contractType: string;
  experienceLevel: string;
  category: string;
  salary: string;
  education: string;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  postedAt: string;
  timestamp: number;
  publishedDate?: string;
  updatedAt?: number;
  applicationUrl: string;
  isNew: boolean;
  isFeatured: boolean;
  viewsCount: number;
  source: 'Gupy';
  sourceUrl: string;
  pcdOnly?: boolean;
}

function cleanCompanyName(raw: string): string {
  if (!raw) return 'Não informado pela fonte';
  return raw.split(' - ')[0].split(' #')[0].trim();
}

function getInitials(name: string): string {
  if (!name || name === 'Não informado pela fonte') return 'GP';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getCompanyColor(company: string): string {
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 
    'bg-amber-600', 'bg-indigo-600', 'bg-cyan-600', 'bg-pink-600'
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function mapContractType(rawType: string): string {
  switch (rawType) {
    case 'vacancy_type_effective':
      return 'Efetivo (CLT)';
    case 'vacancy_type_internship':
      return 'Estágio';
    case 'vacancy_type_apprentice':
      return 'Jovem Aprendiz';
    case 'vacancy_type_temporary':
      return 'Temporário';
    case 'vacancy_type_talent_pool':
      return 'Banco de Talentos';
    case 'vacancy_type_autonomous':
      return 'Autônomo';
    case 'vacancy_legal_entity':
      return 'PJ (Pessoa Jurídica)';
    default:
      return 'Não informado pela fonte';
  }
}

function mapWorkMode(wp: string): 'Presencial' | 'Híbrido' | 'Remoto' | string {
  if (wp === 'remote') return 'Remoto';
  if (wp === 'hybrid') return 'Híbrido';
  if (wp === 'on-site') return 'Presencial';
  return 'Não informado pela fonte';
}

function mapLocation(raw: GupyRawJob): string {
  if (raw.workplaceType === 'remote') {
    return 'Remoto';
  }
  if (raw.city && raw.state) {
    return `${raw.city} - ${raw.state}`;
  }
  if (raw.city) {
    return raw.city;
  }
  return 'Não informado pela fonte';
}

function inferCategory(title: string, desc: string): string {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('vendedor') || text.includes('vendas') || text.includes('comercial') || text.includes('caixa')) return 'Vendas';
  if (text.includes('atendimento') || text.includes('recepcionista') || text.includes('sac')) return 'Atendimento';
  if (text.includes('auxiliar') || text.includes('assistente') || text.includes('faturamento') || text.includes('administrativo') || text.includes('secretaria')) return 'Administrativo';
  if (text.includes('limpeza') || text.includes('conservacao') || text.includes('operacoes') || text.includes('estoque') || text.includes('mecanico') || text.includes('motorista')) return 'Operacional';
  if (text.includes('desenvolvedor') || text.includes('software') || text.includes('ti') || text.includes('suporte') || text.includes('tecnologia')) return 'Tecnologia';
  if (text.includes('enfermeiro') || text.includes('medico') || text.includes('saude') || text.includes('farmaceutico')) return 'Saúde';
  if (text.includes('marketing') || text.includes('midia') || text.includes('designer')) return 'Marketing';
  return 'Geral';
}

function inferExperienceLevel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('estagio') || t.includes('estágio')) return 'Estágio';
  if (t.includes('trainee') || t.includes('jovem aprendiz') || t.includes('aprendiz')) return 'Jovem Aprendiz';
  if (t.includes('junior') || t.includes('júnior') || t.includes('auxiliar') || t.includes('assistente')) return 'Júnior';
  if (t.includes('senior') || t.includes('sênior') || t.includes('gerente') || t.includes('coordenador') || t.includes('supervisor')) return 'Sênior';
  if (t.includes('pleno')) return 'Pleno';
  return 'Sem Experiência';
}

function extractRequirementsAndBenefits(description: string): { requirements: string[]; benefits: string[] } {
  const requirements: string[] = [];
  const benefits: string[] = [];

  if (!description) return { requirements, benefits };

  // Remove HTML tags for parsing
  const plainText = description.replace(/<[^>]+>/g, '\n');
  const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);

  let currentSection: 'req' | 'ben' | 'none' = 'none';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('requisito') || lower.includes('qualificaç') || lower.includes('o que precisamos')) {
      currentSection = 'req';
      continue;
    }
    if (lower.includes('benefício') || lower.includes('informações adicionais') || lower.includes('o que oferecemos')) {
      currentSection = 'ben';
      continue;
    }

    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
      if (cleaned.length > 3) {
        if (currentSection === 'req') requirements.push(cleaned);
        else if (currentSection === 'ben') benefits.push(cleaned);
      }
    }
  }

  return { requirements: requirements.slice(0, 6), benefits: benefits.slice(0, 6) };
}

export function convertGupyJob(raw: GupyRawJob): ConvertedGupyJob {
  const company = cleanCompanyName(raw.careerPageName);
  const workMode = mapWorkMode(raw.workplaceType);
  const contractType = mapContractType(raw.type);
  const location = mapLocation(raw);

  const descClean = (raw.description || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const { requirements, benefits } = extractRequirementsAndBenefits(raw.description || '');

  // Trata data original de publicação sem cálculos artificiais
  let postedAt = 'Data de publicação não informada pela fonte';
  let timestamp = 0;
  let publishedDate: string | undefined = undefined;
  let isNew = false;

  if (raw.publishedDate) {
    const pubDate = new Date(raw.publishedDate);
    if (!isNaN(pubDate.getTime())) {
      timestamp = pubDate.getTime();
      publishedDate = raw.publishedDate;
      // Formata data real brasileira vinda da fonte original
      postedAt = pubDate.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' });
      isNew = (Date.now() - timestamp) <= (7 * 24 * 60 * 60 * 1000);
    }
  }

  return {
    id: `gupy-${raw.id}`,
    title: raw.name ? raw.name.trim() : 'Título não informado pela fonte',
    company,
    companyInitials: getInitials(company),
    companyColor: getCompanyColor(company),
    location,
    workMode,
    contractType,
    experienceLevel: inferExperienceLevel(raw.name || ''),
    category: inferCategory(raw.name || '', descClean),
    salary: 'Não informado pela fonte',
    education: 'Não informado pela fonte',
    description: descClean.length > 0 ? (descClean.substring(0, 500) + '...') : 'Descrição não informada pela fonte',
    requirements: requirements.length > 0 ? requirements : ['Consulte os requisitos completos no link oficial da Gupy.'],
    benefits: benefits.length > 0 ? benefits : ['Consulte os benefícios no link oficial da Gupy.'],
    tags: ['Gupy Oficial', location.includes('Teresina') ? 'Teresina' : location, workMode, contractType].filter(Boolean),
    postedAt,
    timestamp,
    publishedDate,
    applicationUrl: raw.jobUrl || '',
    isNew,
    isFeatured: false,
    viewsCount: 0,
    source: 'Gupy',
    sourceUrl: raw.jobUrl || '',
    pcdOnly: Boolean(raw.disabilities)
  };
}

export async function fetchGupyTeresinaJobs(): Promise<ConvertedGupyJob[]> {
  try {
    const url = 'https://portal.gupy.io/api/job-search/jobs?city=Teresina&state=Piau%C3%AD&limit=100&offset=0&sortBy=publishedDate';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar vagas na API da Gupy: Status ${response.status}`);
    }

    const json = await response.json();
    const rawJobs: GupyRawJob[] = json.data || [];

    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueJobs: ConvertedGupyJob[] = [];

    for (const raw of rawJobs) {
      // Filtragem estrita: Teresina ou Remoto
      const isTeresina = (raw.city && raw.city.toLowerCase() === 'teresina') || (!raw.city && raw.state && raw.state.toLowerCase() === 'piauí');
      const isRemote = raw.workplaceType === 'remote';
      if (!isTeresina && !isRemote) {
        continue;
      }

      const converted = convertGupyJob(raw);
      
      // Previne qualquer duplicação por ID ou URL oficial
      if (seenIds.has(converted.id)) continue;
      if (converted.applicationUrl && seenUrls.has(converted.applicationUrl)) continue;

      seenIds.add(converted.id);
      if (converted.applicationUrl) seenUrls.add(converted.applicationUrl);

      uniqueJobs.push(converted);
    }

    // Garantia local de ordenação: mais recentes primeiro,
    // independentemente da ordem devolvida pela API.
    uniqueJobs.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`[GupyProvider] ${uniqueJobs.length} vagas de Teresina/Remoto validadas do Portal Gupy.`);
    return uniqueJobs;
  } catch (err: any) {
    console.error('[GupyProvider] Erro ao buscar vagas do Gupy:', err.message);
    return [];
  }
}

export async function syncGupyJobs() {
  const jobs = await fetchGupyTeresinaJobs();
  const db = getFirebaseDb();

  let savedCount = 0;
  if (db && jobs.length > 0) {
    const colRef = collection(db, 'gupy_jobs');
    for (const job of jobs) {
      try {
        const docRef = doc(colRef, job.id);
        await setDoc(docRef, { ...job, _syncedAt: Date.now() }, { merge: true });
        savedCount++;
      } catch (err) {
        console.error(`Erro ao salvar vaga Gupy ${job.id} no Firestore:`, err);
      }
    }
  }

  return {
    success: true,
    totalFetched: jobs.length,
    savedToFirestore: savedCount,
    jobs
  };
}
