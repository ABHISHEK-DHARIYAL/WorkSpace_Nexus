import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = {
    ...loadEnv(mode, path.resolve(__dirname, '..'), ''),
    ...loadEnv(mode, path.resolve(__dirname), ''),
  };

  // Safely read the generated Firebase Applet config file
  let appletConfig: any = {};
  try {
    const configPath = path.resolve(__dirname, '../backend/firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.warn("[Vite Config] Could not read firebase-applet-config.json:", err);
  }

  const firebaseProjectId = env.FIREBASE_PROJECT_ID || appletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || "";
  const firebaseDatabaseId = appletConfig.firestoreDatabaseId || "";
  const firebaseApiKey = env.FIREBASE_API_KEY || appletConfig.apiKey || env.VITE_FIREBASE_API_KEY || "";
  const firebaseAuthDomain = env.FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || "";
  const firebaseStorageBucket = env.FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || "";
  const firebaseSenderId = env.FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || "";
  const firebaseAppId = env.FIREBASE_APP_ID || appletConfig.appId || env.VITE_FIREBASE_APP_ID || "";

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseAuthDomain),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(firebaseProjectId),
      'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(firebaseDatabaseId),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseStorageBucket),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseSenderId),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(firebaseAppId),
      'import.meta.env.VITE_API_URL': JSON.stringify(""),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
