import dotenv from "dotenv";
dotenv.config();

import firebaseConfig from "../../firebase-applet-config.json";

// Get APP_URL from either APP_URL or VITE_APP_URL environment variables
const getAppUrl = (): string => {
  // Priority: 1. APP_URL (legacy), 2. VITE_APP_URL (new standard), 3. default to localhost
  const appUrl =
    process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";
  return appUrl;
};

export const ENV = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: getAppUrl(),
  FIREBASE_CONFIG: firebaseConfig,
};
