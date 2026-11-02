import { initializeApp, getApps, getApp } from 'firebase/app';
import {getFirestore,collection,doc,addDoc,setDoc,updateDoc,
  deleteDoc,getDocs,getDoc,query,where,orderBy,onSnapshot,runTransaction,serverTimestamp,Timestamp,} from 'firebase/firestore';

const STORAGE_KEY_CONFIG = 'room_booking_firebase_config';

// 1. Get Firebase Config from environment variables or localStorage
export function getStoredFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.projectId && envConfig.apiKey) {
    return { ...envConfig, source: 'env' };
  }

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CONFIG) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.apiKey) {
        return { ...parsed, source: 'localStorage' };
      }
    }
  } catch (err) {
    console.error('Error reading saved Firebase config:', err);
  }

  return null;
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.location.reload();
  } catch (err) {
    console.error('Error saving Firebase config:', err);
  }
}

export function clearFirebaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    window.location.reload();
  } catch (err) {
    console.error('Error clearing Firebase config:', err);
  }
}

// 2. Initialize Firebase App and Firestore
const config = getStoredFirebaseConfig();
let firebaseApp = null;
let firestoreDb = null;
let isConfigured = false;

if (config && config.projectId) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(firebaseApp);
    isConfigured = true;
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    isConfigured = false;
  }
}

export const isFirebaseConfigured = isConfigured;
export const db = firestoreDb;
export const app = firebaseApp;

// Export Firestore primitives
export {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
};
