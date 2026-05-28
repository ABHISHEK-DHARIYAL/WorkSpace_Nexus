const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const { ENV } = require("./config/env");
const { testDatabaseConnection } = require("./config/db");

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
app.use("/api/*", (req: any, res: any) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.baseUrl || req.url}`
  });
});

// Vite / Static Serving (Serverless / Production vs Dev)
if (ENV.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.NOW_BUILDER) {
  console.log("Setting up Vite middleware...");
  const { createServer } = require("vite");
  createServer({
    server: { middlewareMode: true },
    appType: "spa",
  })
    .then((viteServer: any) => {
      app.use(viteServer.middlewares);
    })
    .catch((err: any) => {
      console.error("Vite server loader error or import error:", err);
    });
} else {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req: any, res: any) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    error: ENV.NODE_ENV === "development" ? err : {}
  });
});

module.exports = app;


