import express from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { ENV } from "./config/env";
import { testDatabaseConnection } from "./config/db";

// Test database connection on startup
testDatabaseConnection();

const app = express();

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(morgan("dev"));

// API Routes
app.use("/api", routes);

// Catch-all for API routes before static serving to prevent API route requests from falling through to client index.html serving
app.use("/api/*", (req: express.Request, res: express.Response) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.baseUrl || req.url}`
  });
});

// Vite / Static Serving (Serverless / Production vs Dev)
if (ENV.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.NOW_BUILDER) {
  console.log("Setting up Vite middleware...");
  // Dynamically load and register Vite middleware in background to avoid blocking module load
  import("vite")
    .then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      })
        .then((vite) => {
          app.use(vite.middlewares);
        })
        .catch((err) => {
          console.error("Vite server loader error:", err);
        });
    })
    .catch((err) => {
      console.error("Vite import error:", err);
    });
} else {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    error: ENV.NODE_ENV === "development" ? err : {}
  });
});

export default app;
