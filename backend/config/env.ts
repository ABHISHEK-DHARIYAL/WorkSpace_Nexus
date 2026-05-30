import dotenv from "dotenv";
dotenv.config();

const isSeparatedBackend = 
  process.env.npm_lifecycle_event === "dev:backend" || 
  process.env.npm_lifecycle_event === "start:backend" || 
  process.env.WITHOUT_VITE === "true";

export const ENV = {
  PORT: process.env.PORT || (isSeparatedBackend ? 3001 : 3000),
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "https://work-space-nexus.vercel.app",
  WITHOUT_VITE: isSeparatedBackend
};
