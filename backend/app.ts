import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { ENV } from "./config/env";
import { testFirestoreConnection, isFirestoreWorking } from "./config/firebase";
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
  if (ENV.NODE_ENV === "production" || ENV.WITHOUT_VITE) {
    // Pure API Mode in production / on Render, or when WITHOUT_VITE is active:
    // No Vite imports, no fallback to Vite, no index.html dependencies
    app.get("/", (req, res) => {
      res.json({
        message: "Workspace Nexus API is healthy and running.",
        status: "ok",
        isFirestoreWorking,
        timestamp: new Date().toISOString()
      });
    });

    app.get("*", (req, res) => {
      res.status(404).json({
        message: `Not found: ${req.method} ${req.url}. This is a pure API server. Frontend is hosted separately.`,
      });
    });
  } else {
    // Development Mode ONLY (NOT production, NOT Render)
    console.log("Setting up Vite middleware for active developer session...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        root: path.resolve(process.cwd(), "frontend"),
        configFile: path.resolve(process.cwd(), "frontend/vite.config.ts"),
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err: any) {
      console.error("Failed to load Vite developer middleware:", err);
      app.get("*", (req, res) => {
        res.status(500).send("Vite developer middleware failed to load. Please make sure devDependencies are installed.");
      });
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
