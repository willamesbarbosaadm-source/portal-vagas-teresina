import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_SINE_JOBS } from '../../src/data/sineInitialJobs';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

function getDb() {
  try {
    let firebaseConfigData: any = null;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      firebaseConfigData = {
        projectId: "studious-rig-bxhgq",
        appId: "1:474330043803:web:a1b15dff9020cbded3bd3e",
        apiKey: "AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw",
        authDomain: "studious-rig-bxhgq.firebaseapp.com",
        firestoreDatabaseId: "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413",
        storageBucket: "studious-rig-bxhgq.firebasestorage.app",
        messagingSenderId: "474330043803"
      };
    }
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);
    const dbId = firebaseConfigData.firestoreDatabaseId || 'ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413';
    return getFirestore(app, dbId);
  } catch (e) {
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
    if (db) {
      const snap = await getDocs(collection(db, 'sine_vagas'));
      if (!snap.empty) {
        const firestoreJobs: any[] = [];
        snap.forEach(docSnap => {
          firestoreJobs.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (firestoreJobs.length > 0) {
          return res.status(200).json({
            success: true,
            total: firestoreJobs.length,
            fonte: "SINE-PI (Firestore)",
            jobs: firestoreJobs
          });
        }
      }
    }

    // Fallback técnico apenas se o banco estiver vazio
    return res.status(200).json({
      success: true,
      total: INITIAL_SINE_JOBS.length,
      data_publicacao: "23/09/2026",
      fonte: "SINE-PI (Fallback Inicial)",
      jobs: INITIAL_SINE_JOBS
    });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      total: INITIAL_SINE_JOBS.length,
      fonte: "SINE-PI (Fallback Técnico)",
      jobs: INITIAL_SINE_JOBS
    });
  }
}
