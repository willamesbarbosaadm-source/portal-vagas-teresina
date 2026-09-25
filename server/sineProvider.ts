import * as cheerio from 'cheerio';
import * as pdfParseModule from 'pdf-parse';
const pdfParseAny: any = pdfParseModule;
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getServerFirestore } from './firebaseDb.ts';

function getSineDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error('Erro ao inicializar Firestore em SineProvider:', err);
    return null;
  }
}

export interface SineJobRecord {
  id?: string;
  titulo: string;
  empresa: string;
  cidade: string;
  estado: string;
  quantidade: string | number;
  escolaridade: string;
  experiencia: string;
  descricao_requisitos: string;
  tipo_vaga: string;
  pcd: boolean;
  data_publicacao: string;
  fonte: string;
  pdf_url: string;
  source_reference: string;
  imported_at: number;
  hash_vaga: string;
  status: 'ATIVA' | 'EXPIRADA';
  updated_at: number;
  // Campos de compatibilidade com interfaces anteriores
  source?: string;
  title?: string;
  education?: string;
  experience?: string;
  details?: string;
  publicationDate?: string;
  publicationDateTime?: number;
  importedAt?: number;
  sourcePdfUrl?: string;
  sourceUrl?: string;
  contentHash?: string;
  updatedAt?: number;
  salario?: string;
  tipo_contrato?: string;
  modalidade?: string;
  beneficios?: string[];
  observacoes?: string;
  requisitos?: string[];
  cnh?: string;
  ultima_verificacao?: string;
  isNew?: boolean;
}

export interface SyncResult {
  success: boolean;
  source: string;
  publicationDate: string;
  pdfUrl: string;
  pdfTitle: string;
  teresinaJobs: number;
  pcdJobs: number;
  newJobs: number;
  updatedJobs: number;
  duplicates: number;
  errors: string[];
}

export function parsePublicationTimestamp(pubDateStr: string): number {
  try {
    const parsed = Date.parse(`${pubDateStr}T00:00:00-03:00`);
    if (!isNaN(parsed)) return parsed;
  } catch (e) {
    // fallback
  }
  return Date.now();
}

export function isJobExpired(publicationDateTime: number): boolean {
  const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1000;
  return (Date.now() - publicationDateTime) > TWENTY_DAYS_MS;
}

export async function fetchSineJobsPage(): Promise<string> {
  const url = 'https://portal.pi.gov.br/sine/vagas-de-emprego/';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch SINE-PI page: ${response.statusText}`);
  }
  return await response.text();
}

export async function findLatestPdf(html: string): Promise<{ pdfUrl: string; pdfTitle: string; publicationDate: string }> {
  const $ = cheerio.load(html);
  let latestPdf = {
    pdfUrl: '',
    pdfTitle: '',
    publicationDate: new Date().toISOString().split('T')[0]
  };

  const monthsMap: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();

    if (href.toLowerCase().includes('.pdf') || text.toLowerCase().includes('ofertas de vagas')) {
      const match = text.match(/ofertas\s+de\s+vagas\s+em\s+(\d{1,2})\s+de\s+([a-záéíóúãõç]+)\s+de\s+(\d{4})/i);
      if (match) {
        const day = match[1].padStart(2, '0');
        const monthName = match[2].toLowerCase();
        const year = match[3];
        const month = monthsMap[monthName] || '09';
        const pubDate = `${year}-${month}-${day}`;

        if (!latestPdf.pdfUrl || pubDate >= latestPdf.publicationDate) {
          latestPdf = {
            pdfUrl: href.startsWith('http') ? href : `https://portal.pi.gov.br${href}`,
            pdfTitle: text,
            publicationDate: pubDate
          };
        }
      }
    }
  });

  if (!latestPdf.pdfUrl) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.toLowerCase().includes('.pdf')) {
        latestPdf = {
          pdfUrl: href.startsWith('http') ? href : `https://portal.pi.gov.br${href}`,
          pdfTitle: $(el).text().trim() || 'Ofertas de vagas SINE-PI',
          publicationDate: new Date().toISOString().split('T')[0]
        };
        return false;
      }
    });
  }

  return latestPdf;
}

export async function downloadPdf(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to download PDF from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    if (typeof pdfParseAny === 'function') {
      const data = await pdfParseAny(buffer);
      return data.text || '';
    } else if (pdfParseAny.PDFParse) {
      const parser = new pdfParseAny.PDFParse({ data: buffer });
      const data = await parser.getText();
      return data.text || '';
    } else if (typeof pdfParseAny.default === 'function') {
      const data = await pdfParseAny.default(buffer);
      return data.text || '';
    }
    return '';
  } catch (err: any) {
    console.error('Erro na extração de texto do PDF SINE:', err);
    throw err;
  }
}

export function parseTeresinaJobs(text: string, publicationDate: string, pdfUrl: string): SineJobRecord[] {
  const jobs: SineJobRecord[] = [];
  const lines = text.split('\n');
  
  const jobStartRegex = /^(\d{1,3})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç\s\/\-\(\)]+?)\s+(Médio completo|Médio incompleto|Medio incompleto|Medio completo|Fundamental completo|Fundamental Incompleto|Fundamental incompleto|Superior completo|Superior incompleto|Superior Incompleto|Não exigida|Nao exigida)\s+(Não exigida|Nao exigida|\d{1,2}\s+[Mm]eses|\d{1,2}\s+[Aa]nos)\s*(.*)$/i;

  let currentSection = 'TERESINA';
  let isPcd = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.includes('VAGAS DISPONÍVEIS') || rawLine.includes('TERESINA-PI')) {
      currentSection = 'TERESINA';
      isPcd = false;
      continue;
    }
    if (rawLine.includes('PESSOAS COM DEFICIÊNCIA') || rawLine.includes('PCD')) {
      isPcd = true;
      continue;
    }
    if (rawLine.includes('FLORIANO') || rawLine.includes('PARNAÍBA') || rawLine.includes('PICOS') || rawLine.includes('PIRIPIRI')) {
      currentSection = 'OUTRO';
      continue;
    }

    if (currentSection !== 'TERESINA') continue;

    const match = rawLine.match(jobStartRegex);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const title = match[2].trim();
      const education = match[3].trim();
      const experience = match[4].trim();
      const details = match[5].trim() || 'Não informado na publicação oficial';

      jobs.push(normalizeJob({
        title,
        quantity,
        education,
        experience,
        details
      }, publicationDate, pdfUrl, isPcd));
    } else if (jobs.length > 0) {
      if (!rawLine.startsWith('--') && !rawLine.startsWith('Qt.')) {
        jobs[jobs.length - 1].descricao_requisitos += ' ' + rawLine;
        jobs[jobs.length - 1].details += ' ' + rawLine;
        jobs[jobs.length - 1].observacoes += ' ' + rawLine;
      }
    }
  }

  return jobs;
}

export function parsePcdJobs(text: string, publicationDate: string, pdfUrl: string): SineJobRecord[] {
  return [];
}

export function normalizeJob(partial: Partial<any>, publicationDate: string, pdfUrl: string, pcd: boolean): SineJobRecord {
  const title = partial.title?.trim() || partial.titulo?.trim() || 'Oportunidade SINE-PI';
  const city = 'Teresina';
  const state = 'PI';
  const quantity = partial.quantity || partial.quantidade || 1;
  const education = partial.education?.trim() || partial.escolaridade?.trim() || 'Não informado na publicação oficial';
  const experience = partial.experience?.trim() || partial.experiencia?.trim() || 'Não informado na publicação oficial';
  const details = partial.details?.trim() || partial.descricao_requisitos?.trim() || 'Não informado na publicação oficial';
  const company = partial.empresa?.trim() || 'Empresa confidencial (Intermediação SINE-PI)';

  const publicationDateTime = parsePublicationTimestamp(publicationDate);
  const status: 'ATIVA' | 'EXPIRADA' = isJobExpired(publicationDateTime) ? 'EXPIRADA' : 'ATIVA';

  // Hash determinístico considerando título, cidade, data_publicacao, pcd e empresa
  const rawHashString = `SINE-PI_${publicationDate}_${city}_${title}_${quantity}_${pcd}_${company}`;
  const contentHash = crypto.createHash('sha256').update(rawHashString).digest('hex');

  const now = Date.now();

  return {
    titulo: title,
    empresa: company,
    cidade: city,
    estado: state,
    quantidade: quantity,
    escolaridade: education,
    experiencia: experience,
    descricao_requisitos: details,
    tipo_vaga: pcd ? 'PCD' : 'Geral',
    pcd,
    data_publicacao: publicationDate,
    fonte: 'SINE-PI',
    pdf_url: pdfUrl,
    source_reference: 'https://portal.pi.gov.br/sine/vagas-de-emprego/',
    imported_at: now,
    hash_vaga: contentHash,
    status,
    updated_at: now,

    // Compatibilidade reversa
    id: `sine_${contentHash.substring(0, 12)}`,
    source: 'SINE-PI',
    title,
    education,
    experience,
    details,
    publicationDate,
    publicationDateTime,
    importedAt: now,
    sourcePdfUrl: pdfUrl,
    sourceUrl: 'https://portal.pi.gov.br/sine/vagas-de-emprego/',
    contentHash,
    updatedAt: now,
    salario: 'Piso Salarial / A Combinar',
    tipo_contrato: 'CLT',
    modalidade: 'Presencial',
    beneficios: ['Vale Transporte', 'Benefícios Legais'],
    observacoes: details,
    requisitos: [education, `Experiência: ${experience}`],
    cnh: 'Não informado',
    ultima_verificacao: new Date().toLocaleString('pt-BR'),
    isNew: true
  };
}

export async function syncSineJobs(): Promise<SyncResult> {
  const errors: string[] = [];
  let tJobsCount = 0;
  let pJobsCount = 0;
  let newJobsCount = 0;
  let updatedJobsCount = 0;
  let duplicatesCount = 0;

  const startedAt = Date.now();
  let pdfUrl = 'https://portal.pi.gov.br/sine/vagas-de-emprego/';
  let pdfTitle = 'Ofertas de vagas em 23 de Setembro de 2026';
  let publicationDate = '2026-09-23';

  try {
    const html = await fetchSineJobsPage();
    const latest = await findLatestPdf(html);
    pdfUrl = latest.pdfUrl;
    pdfTitle = latest.pdfTitle;
    publicationDate = latest.publicationDate;

    const pdfBuffer = await downloadPdf(pdfUrl);
    const pdfText = await extractPdfText(pdfBuffer);

    const allExtracted = parseTeresinaJobs(pdfText, publicationDate, pdfUrl);
    tJobsCount = allExtracted.filter(j => !j.pcd).length;
    pJobsCount = allExtracted.filter(j => j.pcd).length;

    const db = getSineDb();
    if (db) {
      const sineVagasRef = collection(db, 'sine_vagas');
      const snapshot = await getDocs(sineVagasRef);
      const existingMap = new Map<string, any>();
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const hash = data.hash_vaga || data.contentHash;
        if (hash) {
          existingMap.set(hash, { id: docSnap.id, ...data });
        }
      });

      for (const job of allExtracted) {
        if (existingMap.has(job.hash_vaga)) {
          const existing = existingMap.get(job.hash_vaga);
          // Atualiza apenas se houve alteração nos campos relevantes
          const docRef = doc(db, 'sine_vagas', existing.id);
          await setDoc(docRef, { 
            ...job, 
            updated_at: Date.now(),
            updatedAt: Date.now() 
          }, { merge: true });
          duplicatesCount++;
          updatedJobsCount++;
        } else {
          const newDocRef = doc(sineVagasRef, job.hash_vaga);
          await setDoc(newDocRef, job);
          newJobsCount++;
        }
      }

      // Log oficial na coleção sine_sync_logs
      const logRef = collection(db, 'sine_sync_logs');
      await setDoc(doc(logRef), {
        startedAt,
        finishedAt: Date.now(),
        status: errors.length === 0 ? 'success' : 'partial',
        publicationDate,
        pdfUrl,
        pdfTitle,
        foundJobs: allExtracted.length,
        teresinaJobs: tJobsCount,
        pcdJobs: pJobsCount,
        newJobs: newJobsCount,
        updatedJobs: updatedJobsCount,
        duplicateJobs: duplicatesCount,
        errorCount: errors.length,
        errors,
        timestamp: Date.now(),
        dataHora: new Date().toLocaleString('pt-BR'),
        publicacaoEncontrada: pdfTitle,
        url: pdfUrl,
        vagasIdentificadas: allExtracted.length,
        vagasNovas: newJobsCount,
        vagasAtualizadas: updatedJobsCount,
        vagasDuplicadas: duplicatesCount,
        erro: false
      });
    }

  } catch (err: any) {
    errors.push(err.message);
    try {
      const db = getSineDb();
      if (db) {
        const logRef = collection(db, 'sine_sync_logs');
        await setDoc(doc(logRef), {
          startedAt,
          finishedAt: Date.now(),
          status: 'error',
          publicationDate,
          pdfUrl,
          pdfTitle,
          foundJobs: 0,
          newJobs: 0,
          updatedJobs: 0,
          duplicateJobs: 0,
          errorCount: errors.length,
          errors,
          timestamp: Date.now(),
          dataHora: new Date().toLocaleString('pt-BR'),
          publicacaoEncontrada: pdfTitle,
          url: pdfUrl,
          vagasIdentificadas: 0,
          vagasNovas: 0,
          vagasAtualizadas: 0,
          vagasDuplicadas: 0,
          erro: true,
          mensagemErro: err.message
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    success: errors.length === 0,
    source: 'SINE-PI',
    publicationDate,
    pdfUrl,
    pdfTitle,
    teresinaJobs: tJobsCount,
    pcdJobs: pJobsCount,
    newJobs: newJobsCount,
    updatedJobs: updatedJobsCount,
    duplicates: duplicatesCount,
    errors
  };
}
