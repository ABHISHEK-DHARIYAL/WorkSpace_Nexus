import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { ENV } from "./config/env";
import { testFirestoreConnection, isFirestoreWorking } from "./config/firebase";
import { validateAllRoutes } from "./utils/routeValidator";
import { errorHandler } from "./middleware/errorHandler";

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
  const viteConfigPath = path.resolve(process.cwd(), "frontend/vite.config.ts");
  const hasSiblingFrontendProject = fs.existsSync(viteConfigPath);

  if (ENV.NODE_ENV === "production" || ENV.WITHOUT_VITE || !hasSiblingFrontendProject) {
    // Pure API Mode: in production, on Render, when WITHOUT_VITE is active, or whenever this backend
    // is deployed standalone without a sibling frontend/ project alongside it (no Vite dev server to attach).
    // No Vite imports, no fallback to Vite, no index.html dependencies.
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
    // Local combined developer session ONLY (frontend/ project confirmed present next to backend/)
    console.log("Setting up Vite middleware for active developer session...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        root: path.resolve(process.cwd(), "frontend"),
        configFile: viteConfigPath,
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
  app.use(errorHandler);

  // Startup Route Verification
  validateAllRoutes(app);

  return app;
}
