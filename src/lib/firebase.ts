import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Safely retrieve config with strict validation against placeholder environment variables
const REAL_FIREBASE_CONFIG = {
  projectId: "studious-rig-bxhgq",
  appId: "1:474330043803:web:a1b15dff9020cbded3bd3e",
  apiKey: "AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw",
  authDomain: "studious-rig-bxhgq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413",
  storageBucket: "studious-rig-bxhgq.firebasestorage.app",
  messagingSenderId: "474330043803"
};

const isValidApiKey = (val?: string) => Boolean(val && val.trim().startsWith('AIza') && val.trim().length > 20);
const isPlaceholder = (val?: string) => !val || ['apikey', 'projectid', 'authdomain', 'storagebucket', 'messagingsenderid', 'appid', 'undefined', 'null', ''].includes(val.trim().toLowerCase());

const apiKey = isValidApiKey(import.meta.env.VITE_FIREBASE_API_KEY)
  ? import.meta.env.VITE_FIREBASE_API_KEY.trim()
  : REAL_FIREBASE_CONFIG.apiKey;

const authDomain = !isPlaceholder(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
  ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN.trim()
  : REAL_FIREBASE_CONFIG.authDomain;

const projectId = !isPlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID)
  ? import.meta.env.VITE_FIREBASE_PROJECT_ID.trim()
  : REAL_FIREBASE_CONFIG.projectId;

const storageBucket = !isPlaceholder(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
  ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET.trim()
  : REAL_FIREBASE_CONFIG.storageBucket;

const messagingSenderId = !isPlaceholder(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
  ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim()
  : REAL_FIREBASE_CONFIG.messagingSenderId;

const appId = !isPlaceholder(import.meta.env.VITE_FIREBASE_APP_ID)
  ? import.meta.env.VITE_FIREBASE_APP_ID.trim()
  : REAL_FIREBASE_CONFIG.appId;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreDbId = !isPlaceholder(import.meta.env.VITE_FIREBASE_DATABASE_ID)
  ? import.meta.env.VITE_FIREBASE_DATABASE_ID.trim()
  : REAL_FIREBASE_CONFIG.firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

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
