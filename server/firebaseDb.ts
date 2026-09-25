import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const isPlaceholder = (val?: string) =>
  !val ||
  ['apikey', 'projectid', 'authdomain', 'storagebucket', 'messagingsenderid', 'appid', 'undefined', 'null', ''].includes(
    val.trim().toLowerCase()
  );

export const REAL_FIREBASE_CONFIG = {
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

/**
 * Retorna com segurança a instância do Firestore para o backend,
 * garantindo que o app padrão [DEFAULT] do Firebase esteja devidamente inicializado.
 */
export function getServerFirestore(): Firestore {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : REAL_FIREBASE_CONFIG;

  const apps = getApps();
  let app = apps.find(a => a.name === '[DEFAULT]');
  if (!app) {
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(config);
    }
  }

  const dbId = config.firestoreDatabaseId || REAL_FIREBASE_CONFIG.firestoreDatabaseId;
  return getFirestore(app, dbId);
}
