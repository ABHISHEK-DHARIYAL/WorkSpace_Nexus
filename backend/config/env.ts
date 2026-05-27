import dotenv from "dotenv";
dotenv.config();

import firebaseConfig from "../../firebase-applet-config.json";

export const ENV = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
  FIREBASE_CONFIG: firebaseConfig
};
