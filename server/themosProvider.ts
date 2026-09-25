import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getServerFirestore } from './firebaseDb.ts';

function getDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error('Erro ao inicializar Firestore em ThemosProvider:', err);
    return null;
  }
}

const THEMOS_REGION_URL = 'https://themosvagas.com.br/regiao/teresina/';
const THEMOS_DOMAIN = 'themosvagas.com.br';
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

const MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
};

export interface ThemosJobRecord {
  id?: string;
  source: 'Themos Vagas';
  city: string;
  state: string;
  title: string;
  company: string;
  publicationDate: string;
  publicationDateTime: number;
  importedAt: number;
  sourceUrl: string;
  applicationUrl: string;
  contactEmail?: string;
  salary: string;
  education: string;
  experience: string;
  location: string;
  workMode: string;
  contractType: string;
  benefits: string[];
  requirements: string[];
  howToApply: string;
  status: 'active' | 'expired';
  contentHash: string;
  details: string;
  description: string;
}

export function isJobExpired(publicationDateTime: number): boolean {
  return (Date.now() - publicationDateTime) > FIVE_DAYS_MS;
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function firstNonEmpty(values: Array<string | undefined | null>): string {
  return values.map(v => (v || '').trim()).find(Boolean) || '';
}

function extractLabeledValue(text: string, labels: string[]): string {
  const labelPattern = labels.join('|');
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]\\s*([^\\n]+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function parseDateCandidate(raw: string): number {
  const value = raw.trim().toLowerCase();

  const numeric = value.match(/(?:^|\D)(\d{1,2})[\\/.-](\d{1,2})[\\/.-](\d{4})(?:\D|$)/);
  if (numeric) {
    const [, day, month, year] = numeric;
    const ts = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  const written = value.match(/(?:^|\D)(\d{1,2})\s+de\s+([a-zçãé]+)\s+de\s+(\d{4})(?:\D|$)/i);
  if (written) {
    const month = MONTHS[written[2]];
    if (month !== undefined) {
      const ts = new Date(Number(written[3]), month, Number(written[1]), 12, 0, 0, 0).getTime();
      return Number.isFinite(ts) ? ts : 0;
    }
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractPublicationDate($: cheerio.CheerioAPI, bodyText: string): number {
  const candidates: string[] = [];

  $('meta[property="article:published_time"], meta[name="article:published_time"], meta[itemprop="datePublished"], time[datetime], script[type="application/ld+json"]').each((_, el) => {
    const value = $(el).attr('content') || $(el).attr('datetime') || $(el).text();
    if (value) candidates.push(value);
  });

  $('.entry-date, .published, .post-date, .date, .meta-date, .posted-on').each((_, el) => {
    const value = $(el).attr('datetime') || $(el).text();
    if (value) candidates.push(value);
  });

  const explicitPatterns = [
    /publicad[oa][^\n]{0,40}(\\d{1,2}\/\\d{1,2}\/\\d{4})/i,
    /publicad[oa][^\n]{0,40}(\\d{1,2}\\s+de\\s+[a-zçãé]+\\s+de\\s+\\d{4})/i,
    /(?:em|dia)\\s+(\\d{1,2}\/\\d{1,2}\/\\d{4})/i
  ];

  for (const pattern of explicitPatterns) {
    const match = bodyText.match(pattern);
    if (match?.[1]) candidates.push(match[1]);
  }

  for (const candidate of candidates) {
    const ts = parseDateCandidate(candidate);
    if (ts > 0 && ts <= Date.now() + 24 * 60 * 60 * 1000) return ts;
  }

  return 0;
}

function extractEmails(text: string, $: cheerio.CheerioAPI): string[] {
  const emails = new Set<string>();
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi;

  for (const match of text.match(emailRegex) || []) emails.add(match.toLowerCase());

  $('a[href^="mailto:"]').each((_, el) => {
    const href = ($(el).attr('href') || '').replace(/^mailto:/i, '').split('?')[0].trim();
    if (href) emails.add(href.toLowerCase());
  });

  return [...emails];
}

function extractApplicationUrl($: cheerio.CheerioAPI): string {
  const candidates: string[] = [];

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const label = cleanText($(el).text());
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

    let absolute = href;
    try {
      absolute = new URL(href, THEMOS_REGION_URL).toString();
    } catch {
      return;
    }

    if (absolute.includes(THEMOS_DOMAIN)) return;

    const haystack = `${label} ${absolute}`.toLowerCase();
    if (/(candid|inscri|curr[ií]culo|recrut|selec[aã]o|apply|vagas|trabalhe|cadastro)/i.test(haystack)) {
      candidates.push(absolute);
    }
  });

  return candidates[0] || '';
}

function extractList($: cheerio.CheerioAPI, labels: string[]): string[] {
  const values: string[] = [];
  for (const selector of labels) {
    $(selector).each((_, el) => {
      const value = cleanText($(el).text());
      if (value && value.length > 2) values.push(value);
    });
  }
  return [...new Set(values)].slice(0, 20);
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar Themos Vagas (${response.status}): ${url}`);
  }

  return response.text();
}

function extractPostLinks($: cheerio.CheerioAPI): Array<{ title: string; url: string }> {
  const seen = new Set<string>();
  const results: Array<{ title: string; url: string }> = [];

  $('article, .post, .vaga-item, .entry-title, h2, h3').each((_, el) => {
    const anchor = $(el).is('a') ? $(el) : $(el).find('a').first();
    const href = anchor.attr('href');
    const title = cleanText(anchor.text() || $(el).text());

    if (!href || !title || title.length < 4 || title.toLowerCase().includes('página')) return;

    let url = '';
    try {
      url = new URL(href, THEMOS_REGION_URL).toString();
    } catch {
      return;
    }

    if (!url.includes(THEMOS_DOMAIN) || /\/page\/\d+/i.test(url) || /\/categoria\//i.test(url)) return;

    const key = url.replace(/#.*$/, '').replace(/\/$/, '');
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ title, url });
  });

  return results;
}

function parseRequirements(bodyText: string): string[] {
  const values: string[] = [];
  const sections = bodyText.match(/(?:requisitos|qualifica[çc][õo]es|necess[aá]rio|necess[aá]ria)[^\n]*\n([\s\S]{0,1800})/i);
  if (sections?.[1]) {
    for (const line of sections[1].split(/\n|•|;/)) {
      const cleaned = line.replace(/^[\\s\\-–—•*]+/, '').trim();
      if (cleaned.length >= 5 && cleaned.length <= 300) values.push(cleaned);
    }
  }
  return [...new Set(values)].slice(0, 30);
}

async function parseJobPage(url: string, fallbackTitle: string): Promise<ThemosJobRecord | null> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const bodyText = cleanText($('main, article, .entry-content, .post-content, body').first().text());
  const publicationDateTime = extractPublicationDate($, bodyText);
  const now = Date.now();

  if (!publicationDateTime || publicationDateTime < now - FIVE_DAYS_MS || publicationDateTime > now + 24 * 60 * 60 * 1000) {
    return null;
  }

  const title = firstNonEmpty([
    $('h1').first().text(),
    $('meta[property="og:title"]').attr('content'),
    $('title').text(),
    fallbackTitle
  ]);

  if (!title || title.length < 3) return null;

  const emails = extractEmails(bodyText, $);
  const directApplicationUrl = extractApplicationUrl($);

  const company = firstNonEmpty([
    extractLabeledValue(bodyText, ['empresa', 'empresa contratante', 'contratante', 'empregador']),
    $('[class*="empresa"], [class*="company"]').first().text()
  ]) || 'Não informado na publicação oficial';

  const salary = firstNonEmpty([
    extractLabeledValue(bodyText, ['salário', 'remuneração', 'faixa salarial', 'salario']),
    bodyText.match(/(?:sal[aá]rio|remunera[çc][aã]o)[^\n:]*[:\-]?\\s*([^\\n]+)/i)?.[1]
  ]) || 'Não informado na publicação oficial';

  const education = firstNonEmpty([
    extractLabeledValue(bodyText, ['escolaridade', 'formação', 'formacao', 'nível de escolaridade', 'nivel de escolaridade']),
  ]) || 'Não informado na publicação oficial';

  const experience = firstNonEmpty([
    extractLabeledValue(bodyText, ['experiência', 'experiencia', 'experiência profissional', 'experiencia profissional']),
  ]) || 'Não informado na publicação oficial';

  const location = firstNonEmpty([
    extractLabeledValue(bodyText, ['local', 'local de trabalho', 'endereço', 'endereco']),
  ]) || 'Teresina - PI';

  const workMode = firstNonEmpty([
    extractLabeledValue(bodyText, ['modalidade', 'regime de trabalho']),
    /\b(remoto|híbrido|presencial)\b/i.exec(bodyText)?.[1]
  ]) || 'Não informado na publicação oficial';

  const contractType = firstNonEmpty([
    extractLabeledValue(bodyText, ['tipo de contrato', 'contrato', 'regime']),
  ]) || 'Não informado na publicação oficial';

  const benefitMatches = bodyText.match(/(?:benef[ií]cios|oferece|vantagens)[^\n]*\n([\s\S]{0,1200})/i);
  const benefits = benefitMatches?.[1]
    ? benefitMatches[1].split(/\n|•|;/).map(v => v.replace(/^[\\s\\-–—•*]+/, '').trim()).filter(v => v.length >= 3).slice(0, 20)
    : [];

  const requirements = parseRequirements(bodyText);
  const howToApply = firstNonEmpty([
    extractLabeledValue(bodyText, ['como se candidatar', 'candidatura', 'inscrições', 'inscricoes', 'envio de currículo', 'envio de curriculo']),
    emails.length > 0 ? `Enviar currículo para: ${emails.join(', ')}` : '',
    directApplicationUrl ? `Inscrição: ${directApplicationUrl}` : ''
  ]) || 'Não informado na publicação oficial';

  const applicationUrl = directApplicationUrl || (emails[0] ? `mailto:${emails[0]}` : '');

  const date = new Date(publicationDateTime);
  const publicationDate = date.toISOString().split('T')[0];
  const contentHash = crypto.createHash('sha256')
    .update(`ThemosVagas|${url}|${title}|${publicationDate}|${company}`)
    .digest('hex');

  const details = bodyText.slice(0, 20000);

  return {
    source: 'Themos Vagas',
    city: 'Teresina',
    state: 'PI',
    title: title.slice(0, 180),
    company,
    publicationDate,
    publicationDateTime,
    importedAt: now,
    sourceUrl: url,
    applicationUrl,
    contactEmail: emails.length ? emails.join(', ') : undefined,
    salary,
    education,
    experience,
    location,
    workMode,
    contractType,
    benefits: [...new Set(benefits)],
    requirements,
    howToApply,
    status: 'active',
    contentHash,
    details,
    description: details
  };
}

export async function syncThemosJobs() {
  const errors: string[] = [];
  let found = 0;
  let newJobs = 0;
  let updatedJobs = 0;
  let duplicates = 0;

  try {
    const html = await fetchHtml(THEMOS_REGION_URL);
    const $ = cheerio.load(html);
    const postLinks = extractPostLinks($);

    if (postLinks.length === 0) {
      throw new Error('Nenhuma publicação foi encontrada na página de Teresina do Themos Vagas.');
    }

    const parsedJobs: ThemosJobRecord[] = [];
    const seenHashes = new Set<string>();

    for (const post of postLinks.slice(0, 60)) {
      try {
        const job = await parseJobPage(post.url, post.title);
        if (!job) continue;
        if (seenHashes.has(job.contentHash)) {
          duplicates++;
          continue;
        }
        seenHashes.add(job.contentHash);
        parsedJobs.push(job);
      } catch (err: any) {
        errors.push(`${post.url}: ${err?.message || 'erro desconhecido'}`);
      }
    }

    parsedJobs.sort((a, b) => b.publicationDateTime - a.publicationDateTime);
    found = parsedJobs.length;

    const db = getDb();
    if (!db) {
      throw new Error('Firestore indisponível para salvar as vagas do Themos Vagas.');
    }

    const collRef = collection(db, 'themos_vagas');
    const snap = await getDocs(collRef);
    const existingMap = new Map<string, { id: string; publicationDateTime: number }>();

    snap.forEach(d => {
      const data = d.data();
      if (data.contentHash) {
        existingMap.set(data.contentHash, {
          id: d.id,
          publicationDateTime: Number(data.publicationDateTime) || 0
        });
      }
    });

    // O catálogo do Themos no portal representa somente os últimos 5 dias.
    // Vagas antigas são removidas para não continuarem aparecendo como atuais.
    for (const d of snap.docs) {
      const data = d.data();
      const publicationTs = Number(data.publicationDateTime) || 0;
      if (!publicationTs || publicationTs < Date.now() - FIVE_DAYS_MS) {
        await deleteDoc(doc(db, 'themos_vagas', d.id));
      }
    }

    for (const job of parsedJobs) {
      const existing = existingMap.get(job.contentHash);

      if (existing) {
        await setDoc(doc(db, 'themos_vagas', existing.id), job, { merge: true });
        updatedJobs++;
      } else {
        const newDocRef = doc(collRef);
        await setDoc(newDocRef, job);
        newJobs++;
      }
    }
  } catch (err: any) {
    errors.push(err?.message || 'Erro ao sincronizar Themos Vagas.');
  }

  return {
    success: errors.length === 0,
    source: 'Themos Vagas',
    found,
    newJobs,
    updatedJobs,
    duplicates,
    windowDays: 5,
    errors
  };
}

export async function getRecentThemosJobs(): Promise<ThemosJobRecord[]> {
  const db = getDb();
  if (!db) return [];

  const snap = await getDocs(collection(db, 'themos_vagas'));
  const cutoff = Date.now() - FIVE_DAYS_MS;

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as ThemosJobRecord))
    .filter(job => Number(job.publicationDateTime) >= cutoff)
    .sort((a, b) => Number(b.publicationDateTime) - Number(a.publicationDateTime));
}
