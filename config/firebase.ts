/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

// ==========================================
// 1. Environment Detection & URL Utilities
// ==========================================
export const detectEnvironment = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isVercel = origin.includes('.vercel.app') || !!import.meta.env.VITE_VERCEL;
  const isDev = import.meta.env.DEV;
  
  return {
    isLocalhost,
    isVercel,
    isDev,
    isProd: import.meta.env.PROD,
    origin,
    label: isLocalhost ? 'localhost' : isVercel ? 'vercel' : isDev ? 'development' : 'production'
  };
};

// VITE_APP_URL Resolution
export const getAppUrl = (): string => {
  const envUrl = import.meta.env.VITE_APP_URL || '';
  if (envUrl) return envUrl;
  
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://work-space-nexus.vercel.app';
};

export const APP_URL = getAppUrl();

// ==========================================
// 2. Firebase Config Resolution & Validation
// ==========================================
export interface FirebaseValidationResult {
  isValid: boolean;
  errors: string[];
  resolvedConfig: any;
}

export const validateAndResolveFirebaseConfig = (): FirebaseValidationResult => {
  const errors: string[] = [];
  
  // Prefer VITE_ environment variables (standard Vercel/Vite pattern)
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };

  const isAnyEnvSet = Object.values(envConfig).some(val => !!val);
  
  let finalConfig = envConfig;
  
  // If no environment variables are defined, fallback to the sandbox/local JSON applet config
  if (!isAnyEnvSet && firebaseConfigJson) {
    finalConfig = {
      apiKey: firebaseConfigJson.apiKey || '',
      authDomain: firebaseConfigJson.authDomain || '',
      projectId: firebaseConfigJson.projectId || '',
      storageBucket: firebaseConfigJson.storageBucket || '',
      messagingSenderId: firebaseConfigJson.messagingSenderId || '',
      appId: firebaseConfigJson.appId || '',
      measurementId: firebaseConfigJson.measurementId || '',
    };
  }

  // Validate the final config
  const requiredKeys: (keyof typeof finalConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  requiredKeys.forEach(key => {
    if (!finalConfig[key] || finalConfig[key] === 'remixed-api-key') {
      errors.push(`Firebase configuration error: Missing "${key}" value.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    resolvedConfig: finalConfig
  };
};

const validation = validateAndResolveFirebaseConfig();
const firebaseConfig = validation.resolvedConfig;
const isConfigured = validation.isValid;

// ==========================================
// 3. Stable Initialization
// ==========================================
let app = null;
if (isConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    console.log('[Firebase Initialization] App initialized successfully in ' + detectEnvironment().label + ' mode.');
  } catch (err: any) {
    console.error('[Firebase Initialization] Error initializing Firebase App:', err.message);
  }
} else {
  console.warn('[Firebase Initialization] Firebase is running in SANDBOX fallback mode. Check `.env.example` or variables:\n', validation.errors.join('\n'));
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfigJson?.firestoreDatabaseId || undefined) : null;
export const storage = app ? getStorage(app) : null;

if (db) {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore client offline persistent cache activation warning:", err.message);
  });
}

// ==========================================
// 4. Stable Firebase Auth Error Helpers
// ==========================================
export const handleFirebaseAuthError = (error: any): { title: string; message: string; code: string } => {
  const code = error?.code || '';
  const debugMsg = error?.message || '';
  console.error('[Firebase Auth Error Diagnoser]', { code, message: debugMsg });
  
  const isApiKeyInvalid = 
    code === 'auth/api-key-not-valid' || 
    code === 'auth/invalid-api-key' || 
    debugMsg.toLowerCase().includes('api-key-not-valid') || 
    debugMsg.toLowerCase().includes('api key not valid') ||
    debugMsg.toLowerCase().includes('invalid-api-key');

  if (isApiKeyInvalid) {
    return {
      title: 'Invalid Firebase API Key',
      message: 'The initialized Firebase API Key is invalid or expired. To use live Google Sign-In, please supply a valid API key in your Vercel or local environment configuration under "VITE_FIREBASE_API_KEY". Otherwise, please use our quick-fill button or sign in with standard account credentials (e.g. jane.doe@example.com / password123).',
      code: 'auth/api-key-not-valid'
    };
  }

  switch (code) {
    case 'auth/unauthorized-domain':
      return {
        title: 'Unauthorized Redirect Domain',
        message: `This Vercel domain is not authorized in your Firebase Console. Go to: Firebase Console > Authentication > Settings > Authorized domains and add "${detectEnvironment().origin}".`,
        code
      };
    case 'auth/popup-blocked':
      return {
        title: 'Sign-in Popup Blocked',
        message: 'Your browser blocked the login popup. Please allow popups for this site, or tap again to retry.',
        code
      };
    case 'auth/popup-closed-by-user':
      return {
        title: 'Sign-in Cancelled',
        message: 'The authentication window was closed before completion. Please try signing in again.',
        code
      };
    case 'auth/network-request-failed':
      return {
        title: 'Network Offline',
        message: 'A network connectivity error occurred. Please verify your internet connection and try again.',
        code
      };
    default:
      return {
        title: 'Authentication Unsuccessful',
        message: error?.message || 'An unexpected login issue occurred. Please check your credentials or try again later.',
        code
      };
  }
};

export default app;
