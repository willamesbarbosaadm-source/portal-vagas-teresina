import * as cheerio from 'cheerio';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

function getDb() {
  try {
    let firebaseConfigData: any = null;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG) {
      firebaseConfigData = process.env.FIREBASE_CONFIG 
        ? JSON.parse(process.env.FIREBASE_CONFIG)
        : {
            apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
            authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
          };
    }

    if (!firebaseConfigData) {
      console.warn('Configuração do Firebase não encontrada para Themos');
      return null;
    }
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || 'ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413';
    return getFirestore(app, dbId);
  } catch (err) {
    console.error('Erro ao inicializar Firestore em ThemosProvider:', err);
    return null;
  }
}

export interface ThemosJobRecord {
  id?: string;
  source: string;
  city: string;
  state: string;
  title: string;
  company: string;
  publicationDate: string;
  publicationDateTime: number;
  importedAt: number;
  sourceUrl: string;
  status: 'active' | 'expired';
  contentHash: string;
  details: string;
}

export function isJobExpired(publicationDateTime: number): boolean {
  const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1000;
  return (Date.now() - publicationDateTime) > TWENTY_DAYS_MS;
}

export async function syncThemosJobs() {
  const errors: string[] = [];
  let found = 0;
  let newJobs = 0;
  let updatedJobs = 0;

  try {
    const targetUrl = 'https://themosvagas.com.br/regiao/teresina/';
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao acessar Themos Vagas: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs: ThemosJobRecord[] = [];

    $('.post, article, .vaga-item, .entry-title').each((_, el) => {
      const title = $(el).find('a').first().text().trim() || $(el).text().trim();
      const href = $(el).find('a').first().attr('href') || targetUrl;

      if (title && title.length > 3 && !title.toLowerCase().includes('página')) {
        const now = Date.now();
        const rawHashString = `ThemosVagas_${title}_Teresina`;
        const contentHash = crypto.createHash('sha256').update(rawHashString).digest('hex');

        jobs.push({
          source: 'Themos Vagas',
          city: 'Teresina',
          state: 'PI',
          title: title.slice(0, 100),
          company: 'Não informado na publicação oficial',
          publicationDate: new Date().toISOString().split('T')[0],
          publicationDateTime: now,
          importedAt: now,
          sourceUrl: href,
          status: 'active',
          contentHash,
          details: 'Vaga coletada do Themos Vagas Teresina'
        });
      }
    });

    found = jobs.length;

    const db = getDb();
    if (db) {
      const collRef = collection(db, 'themos_vagas');
      const snap = await getDocs(collRef);
      const existingMap = new Map<string, string>();
      snap.forEach(d => {
        const data = d.data();
        if (data.contentHash) existingMap.set(data.contentHash, d.id);
      });

      for (const job of jobs) {
        if (existingMap.has(job.contentHash)) {
          const existingId = existingMap.get(job.contentHash)!;
          await setDoc(doc(db, 'themos_vagas', existingId), {
            ...job,
            status: isJobExpired(job.publicationDateTime) ? 'expired' : 'active'
          }, { merge: true });
          updatedJobs++;
        } else {
          const newDocRef = doc(collRef);
          await setDoc(newDocRef, {
            ...job,
            status: isJobExpired(job.publicationDateTime) ? 'expired' : 'active'
          });
          newJobs++;
        }
      }
    }
  } catch (err: any) {
    errors.push(err.message);
  }

  return {
    success: errors.length === 0,
    source: 'Themos Vagas',
    found,
    newJobs,
    updatedJobs,
    errors
  };
}
