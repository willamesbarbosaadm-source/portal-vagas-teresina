import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

function getFirebaseDb() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('firebase-applet-config.json não encontrado');
      return null;
    }
    const firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);
    return getFirestore(app);
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
  workMode: 'Presencial' | 'Híbrido' | 'Remoto';
  contractType: string;
  experienceLevel: string;
  category: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  postedAt: string;
  timestamp: number;
  applicationUrl: string;
  isNew: boolean;
  isFeatured: boolean;
  viewsCount: number;
  source: string;
  sourceUrl: string;
  pcdOnly?: boolean;
}

function cleanCompanyName(raw: string): string {
  if (!raw) return 'Empresa parceira';
  return raw.split(' - ')[0].split(' #')[0].trim();
}

function getInitials(name: string): string {
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
  return 'Geral';
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
  const workMode: 'Presencial' | 'Híbrido' | 'Remoto' = 
    raw.workplaceType === 'remote' ? 'Remoto' : 
    raw.workplaceType === 'hybrid' ? 'Híbrido' : 'Presencial';

  const descClean = (raw.description || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ');

  const { requirements, benefits } = extractRequirementsAndBenefits(raw.description || '');

  const publishedMs = new Date(raw.publishedDate).getTime();
  const diffDays = Math.floor((Date.now() - publishedMs) / (1000 * 60 * 60 * 24));
  const postedAt = diffDays <= 0 ? 'Hoje' : diffDays === 1 ? 'Ontem' : `Há ${diffDays} dias`;

  return {
    id: `gupy-${raw.id}`,
    title: raw.name.trim(),
    company,
    companyInitials: getInitials(company),
    companyColor: getCompanyColor(company),
    location: `${raw.city || 'Teresina'} - ${raw.state || 'PI'}`,
    workMode,
    contractType: 'CLT',
    experienceLevel: inferExperienceLevel(raw.name),
    category: inferCategory(raw.name, descClean),
    salary: 'Salário a combinar (Confira na Gupy)',
    description: descClean.substring(0, 500) + '...',
    requirements: requirements.length > 0 ? requirements : ['Confira os requisitos completos e inscreva-se no link da Gupy.'],
    benefits: benefits.length > 0 ? benefits : ['Benefícios compatíveis com o mercado informados no processo seletivo Gupy.'],
    tags: ['Gupy', 'Teresina', workMode, 'Vaga Real'],
    postedAt,
    timestamp: publishedMs,
    applicationUrl: raw.jobUrl,
    isNew: diffDays <= 7,
    isFeatured: diffDays <= 3,
    viewsCount: Math.floor(Math.random() * 80) + 20,
    source: 'Gupy',
    sourceUrl: raw.jobUrl,
    pcdOnly: raw.disabilities
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

    console.log(`[GupyProvider] ${rawJobs.length} vagas de Teresina encontradas no Portal Gupy.`);
    return rawJobs.map(convertGupyJob);
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
        await setDoc(docRef, { ...job, updatedAt: Date.now() }, { merge: true });
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
