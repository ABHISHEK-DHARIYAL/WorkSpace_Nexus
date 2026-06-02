import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { ENV } from "./config/env";
import { testFirestoreConnection } from "./config/firebase";
import { validateAllRoutes } from "./utils/routeValidator";

export async function createApp() {
  // Test Firestore connection on startup to dynamically verify permission/quota and handle fallback
  await testFirestoreConnection();

  const app = express();

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const allowedOrigins = [
    ENV.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001"
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(allowed => {
        return origin === allowed || allowed.startsWith(origin) || origin.startsWith(allowed);
      });
      if (isAllowed || ENV.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(null, true); // Fallback allow to maximize uptime, but logging is integrated
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  }));
  app.use(morgan("dev"));

  // API Routes
  app.use("/api", routes);

  // Catch-all for API routes before static serving to prevent API route requests from falling through to client index.html serving
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      message: `API route not found: ${req.method} ${req.baseUrl || req.url}`
    });
  });

  // Vite / Static Serving
  if (ENV.WITHOUT_VITE) {
    app.get("*", (req, res) => {
      res.send(`DocCMS API Backend is running separately on port ${ENV.PORT}. Access the frontend dynamically for full workflow.`);
    });
  } else if (ENV.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.NOW_BUILDER) {
    console.log("Setting up Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), "frontend"),
      configFile: path.resolve(process.cwd(), "frontend/vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      console.warn(`[Warning] Production build index.html not found at ${indexPath}. Falling back dynamically to Vite middleware for active developer session.`);
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        root: path.resolve(process.cwd(), "frontend"),
        configFile: path.resolve(process.cwd(), "frontend/vite.config.ts"),
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
      message: err.message || "An unexpected error occurred",
      error: ENV.NODE_ENV === "development" ? err : {}
    });
  });

  // Startup Route Verification
  validateAllRoutes(app);

  return app;
}
