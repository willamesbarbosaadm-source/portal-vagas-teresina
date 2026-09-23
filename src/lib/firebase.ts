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
// Safely retrieve config from environment variables or local JSON config if present
const importedConfigs = import.meta.glob('../../firebase-applet-config.json', { eager: true, import: 'default' });
const firebaseConfigData: any = Object.values(importedConfigs)[0] || {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || '',
  databaseURL: (import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId) 
    ? `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId}-default-rtdb.firebaseio.com`
    : undefined
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'willamesbarbosaadm@gmail.com';

export function isAdminUser(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
