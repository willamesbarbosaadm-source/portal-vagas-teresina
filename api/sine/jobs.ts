import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const isPlaceholder = (val?: string) =>
  !val ||
  ['apikey', 'projectid', 'authdomain', 'storagebucket', 'messagingsenderid', 'appid', 'undefined', 'null', ''].includes(
    val.trim().toLowerCase()
  );

const REAL_FIREBASE_CONFIG = {
  projectId: !isPlaceholder(process.env.VITE_FIREBASE_PROJECT_ID)
    ? process.env.VITE_FIREBASE_PROJECT_ID!.trim()
    : 'studious-rig-bxhgq',
  appId: !isPlaceholder(process.env.VITE_FIREBASE_APP_ID)
    ? process.env.VITE_FIREBASE_APP_ID!.trim()
    : '1:474330043803:web:a1b15dff9020cbded3bd3e',
  apiKey: !isPlaceholder(process.env.VITE_FIREBASE_API_KEY)
    ? process.env.VITE_FIREBASE_API_KEY!.trim()
    : 'AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw',
  authDomain: !isPlaceholder(process.env.VITE_FIREBASE_AUTH_DOMAIN)
    ? process.env.VITE_FIREBASE_AUTH_DOMAIN!.trim()
    : 'studious-rig-bxhgq.firebaseapp.com',
  firestoreDatabaseId: !isPlaceholder(process.env.VITE_FIREBASE_DATABASE_ID)
    ? process.env.VITE_FIREBASE_DATABASE_ID!.trim()
    : 'ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413',
  storageBucket: !isPlaceholder(process.env.VITE_FIREBASE_STORAGE_BUCKET)
    ? process.env.VITE_FIREBASE_STORAGE_BUCKET!.trim()
    : 'studious-rig-bxhgq.firebasestorage.app',
  messagingSenderId: !isPlaceholder(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!.trim()
    : '474330043803'
};

function getDb() {
  try {
    let firebaseConfigData: any = REAL_FIREBASE_CONFIG;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        firebaseConfigData = REAL_FIREBASE_CONFIG;
      }
    }
    const apps = getApps();
    let app = apps.find(a => a.name === '[DEFAULT]') || apps[0];
    if (!app) {
      app = initializeApp(firebaseConfigData);
    }
    const dbId = firebaseConfigData.firestoreDatabaseId || REAL_FIREBASE_CONFIG.firestoreDatabaseId;
    return getFirestore(app, dbId);
  } catch (e) {
    console.error('Erro ao inicializar Firestore na API SINE:', e);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Serviço do Firestore temporariamente indisponível.'
      });
    }

    const snap = await getDocs(collection(db, 'sine_vagas'));
    if (snap.empty) {
      return res.status(503).json({
        success: false,
        error: 'Nenhuma vaga encontrada no Firestore.'
      });
    }

    const firestoreJobs: any[] = [];
    let dataPublicacao = '23/09/2026';
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && (data.data_publicacao || data.dataAtualizacao)) {
        dataPublicacao = data.data_publicacao || data.dataAtualizacao || dataPublicacao;
      }
      firestoreJobs.push({ id: docSnap.id, ...data });
    });

    if (firestoreJobs.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Nenhuma vaga ativa no momento.'
      });
    }

    return res.status(200).json({
      success: true,
      total: firestoreJobs.length,
      data_publicacao: dataPublicacao,
      fonte: 'SINE-PI (Firestore)',
      jobs: firestoreJobs
    });
  } catch (error: any) {
    console.error('Erro ao carregar vagas do SINE-PI:', error);
    return res.status(503).json({
      success: false,
      error: 'Erro ao conectar ao banco de vagas do SINE-PI.'
    });
  }
}
