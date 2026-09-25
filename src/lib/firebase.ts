import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';

/**
 * =========================================================================
 * 1. CONFIGURAÇÃO DE FIREBASE AUTHENTICATION
 * PROJETO: equipamento-estudantis-bxhgq
 * USO: Apenas cadastro, login, verificação de e-mail, recuperação de senha e sessão.
 * =========================================================================
 */
export const AUTH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAE9SFXO0CK3Rso-BsLpEld8xqMYayUoj0",
  authDomain: "equipamento-estudantis-bxhgq.firebaseapp.com",
  projectId: "equipamento-estudantis-bxhgq",
  storageBucket: "equipamento-estudantis-bxhgq.firebasestorage.app",
  messagingSenderId: "630406463296",
  appId: "1:630406463296:web:7564212caa7a88b109c4a5"
};

/**
 * =========================================================================
 * 2. CONFIGURAÇÃO DE FIREBASE FIRESTORE
 * PROJETO: studious-rig-bxhgq (MANTIDO INTACTO)
 * BANCO: ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413
 * USO: Vagas do SINE-PI (145 vagas), Gupy, Themos, logs e métricas do portal.
 * =========================================================================
 */
export const REAL_FIREBASE_CONFIG = {
  projectId: "studious-rig-bxhgq",
  appId: "1:474330043803:web:a1b15dff9020cbded3bd3e",
  apiKey: "AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw",
  authDomain: "studious-rig-bxhgq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413",
  storageBucket: "studious-rig-bxhgq.firebasestorage.app",
  messagingSenderId: "474330043803"
};

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

const isValidApiKey = (val?: string) => Boolean(val && val.trim().startsWith('AIza') && val.trim().length > 20);
const isPlaceholder = (val?: string) => !val || ['apikey', 'projectid', 'authdomain', 'storagebucket', 'messagingsenderid', 'appid', 'undefined', 'null', ''].includes(val.trim().toLowerCase());

// Resolução de configuração de autenticação (equipamento-estudantis-bxhgq)
const envAuthApiKey = getEnvVar('VITE_FIREBASE_AUTH_API_KEY');
const authApiKey = isValidApiKey(envAuthApiKey)
  ? envAuthApiKey!.trim()
  : AUTH_FIREBASE_CONFIG.apiKey;

const envAuthDomain = getEnvVar('VITE_FIREBASE_AUTH_AUTH_DOMAIN');
const authDomain = !isPlaceholder(envAuthDomain)
  ? envAuthDomain!.trim()
  : AUTH_FIREBASE_CONFIG.authDomain;

const envAuthProjectId = getEnvVar('VITE_FIREBASE_AUTH_PROJECT_ID');
const authProjectId = !isPlaceholder(envAuthProjectId)
  ? envAuthProjectId!.trim()
  : AUTH_FIREBASE_CONFIG.projectId;

const envAuthStorageBucket = getEnvVar('VITE_FIREBASE_AUTH_STORAGE_BUCKET');
const authStorageBucket = !isPlaceholder(envAuthStorageBucket)
  ? envAuthStorageBucket!.trim()
  : AUTH_FIREBASE_CONFIG.storageBucket;

const envAuthMessagingSenderId = getEnvVar('VITE_FIREBASE_AUTH_MESSAGING_SENDER_ID');
const authMessagingSenderId = !isPlaceholder(envAuthMessagingSenderId)
  ? envAuthMessagingSenderId!.trim()
  : AUTH_FIREBASE_CONFIG.messagingSenderId;

const envAuthAppId = getEnvVar('VITE_FIREBASE_AUTH_APP_ID');
const authAppId = !isPlaceholder(envAuthAppId)
  ? envAuthAppId!.trim()
  : AUTH_FIREBASE_CONFIG.appId;

const resolvedAuthConfig = {
  apiKey: authApiKey,
  authDomain,
  projectId: authProjectId,
  storageBucket: authStorageBucket,
  messagingSenderId: authMessagingSenderId,
  appId: authAppId
};

// Resolução de configuração do Firestore (studious-rig-bxhgq)
const envDataApiKey = getEnvVar('VITE_FIREBASE_API_KEY');
const dataApiKey = isValidApiKey(envDataApiKey)
  ? envDataApiKey!.trim()
  : REAL_FIREBASE_CONFIG.apiKey;

const envDataAuthDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
const dataAuthDomain = !isPlaceholder(envDataAuthDomain)
  ? envDataAuthDomain!.trim()
  : REAL_FIREBASE_CONFIG.authDomain;

const envDataProjectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');
const dataProjectId = !isPlaceholder(envDataProjectId)
  ? envDataProjectId!.trim()
  : REAL_FIREBASE_CONFIG.projectId;

const envDataStorageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
const dataStorageBucket = !isPlaceholder(envDataStorageBucket)
  ? envDataStorageBucket!.trim()
  : REAL_FIREBASE_CONFIG.storageBucket;

const envDataMessagingSenderId = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
const dataMessagingSenderId = !isPlaceholder(envDataMessagingSenderId)
  ? envDataMessagingSenderId!.trim()
  : REAL_FIREBASE_CONFIG.messagingSenderId;

const envDataAppId = getEnvVar('VITE_FIREBASE_APP_ID');
const dataAppId = !isPlaceholder(envDataAppId)
  ? envDataAppId!.trim()
  : REAL_FIREBASE_CONFIG.appId;

const resolvedDataConfig = {
  apiKey: dataApiKey,
  authDomain: dataAuthDomain,
  projectId: dataProjectId,
  storageBucket: dataStorageBucket,
  messagingSenderId: dataMessagingSenderId,
  appId: dataAppId,
  databaseURL: `https://${dataProjectId}-default-rtdb.firebaseio.com`
};

// 1. Instância exclusiva para FIREBASE AUTHENTICATION (equipamento-estudantis-bxhgq)
export const authApp = getApps().find(a => a.name === 'auth-app') 
  || initializeApp(resolvedAuthConfig, 'auth-app');

// 2. Instância exclusiva para FIREBASE FIRESTORE (studious-rig-bxhgq)
export const dataApp = getApps().find(a => a.name === '[DEFAULT]') 
  || initializeApp(resolvedDataConfig);

// Mantém export app para compatibilidade de módulos que referenciem a app primária
export const app = dataApp;

// Instância oficial de Autenticação conectada a equipamento-estudantis-bxhgq
export const auth = getAuth(authApp);

// Instância oficial de Banco de Dados Firestore conectada a studious-rig-bxhgq
const envDatabaseId = getEnvVar('VITE_FIREBASE_DATABASE_ID');
const firestoreDbId = !isPlaceholder(envDatabaseId)
  ? envDatabaseId!.trim()
  : REAL_FIREBASE_CONFIG.firestoreDatabaseId;

export const db = firestoreDbId ? getFirestore(dataApp, firestoreDbId) : getFirestore(dataApp);

export {
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
};
