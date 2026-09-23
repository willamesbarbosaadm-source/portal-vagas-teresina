import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
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
// Safely retrieve config from environment variables, local JSON config, or bundled defaults
const importedConfigs = import.meta.glob('../../firebase-applet-config.json', { eager: true, import: 'default' });
const firebaseConfigData: any = Object.values(importedConfigs)[0] || {};

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "studious-rig-bxhgq",
  appId: "1:474330043803:web:a1b15dff9020cbded3bd3e",
  apiKey: "AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw",
  authDomain: "equipamento-estudantis-bxhgq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413",
  storageBucket: "studious-rig-bxhgq.firebasestorage.app",
  messagingSenderId: "474330043803"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || DEFAULT_FIREBASE_CONFIG.appId,
  databaseURL: (import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || DEFAULT_FIREBASE_CONFIG.projectId) 
    ? `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || DEFAULT_FIREBASE_CONFIG.projectId}-default-rtdb.firebaseio.com`
    : undefined
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

export function isAdminUser(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
