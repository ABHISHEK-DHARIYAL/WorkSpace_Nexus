/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import firebaseConfigJson from "../firebase-applet-config.json";

/**
 * Production-safe Firebase initialization with environment detection.
 * - Supports localhost development
 * - Supports Vercel production deployment
 * - Supports Firebase emulator for local testing
 * - Lazy initialization prevents multiple app instances
 */

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId,
};

// Detect environment
const isDevelopment =
  import.meta.env.DEV || import.meta.env.MODE === "development";
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const isProduction =
  import.meta.env.PROD || import.meta.env.MODE === "production";

// Initialize Firebase App only if keys are present (lazy/fail-safe)
const isConfigured =
  !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "remixed-api-key";

let app = null;
if (isConfigured) {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
    if (isDevelopment || isLocalhost) {
      console.log("[Firebase] Initialized app in development mode");
    } else if (isProduction) {
      console.log("[Firebase] Initialized app in production mode");
    }
  }
} else {
  console.warn(
    "[Firebase] Firebase configuration not fully set. Using fallback authentication."
  );
}

export const auth = app ? getAuth(app) : null;
export const db = app
  ? firebaseConfigJson.firestoreDatabaseId
    ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
    : getFirestore(app)
  : null;
export const storage = app ? getStorage(app) : null;

// Enable offline persistence for Firestore with error handling
if (db) {
  enableIndexedDbPersistence(db).catch((err) => {
    // Ignore errors if persistence is already enabled or quota exceeded
    if (err.code === "failed-precondition") {
      console.warn(
        "[Firebase] Multiple tabs open: Persistence already enabled in another tab."
      );
    } else if (err.code === "unimplemented") {
      console.warn("[Firebase] Browser does not support persistence.");
    } else {
      console.warn(
        "[Firebase] Firestore offline persistence warning:",
        err.message
      );
    }
  });
}

export default app;
