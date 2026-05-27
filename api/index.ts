import { createApp } from "../backend/app";

let appPromise: any = null;

export default async function handler(req: any, res: any) {
  // Ensure we recognize standard production delivery in serverless environments
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }

  try {
    console.log(`[Vercel API Handler] ${req.method} ${req.url}`);

    if (!appPromise) {
      console.log("[Vercel API Handler] Initializing Express app...");
      appPromise = createApp();
    }

    const app = await appPromise;
    console.log("[Vercel API Handler] Express app ready, routing request...");

    // Delegate the request execution directly to our Express app and wait for completion
    return new Promise<void>((resolve, reject) => {
      res.on("finish", () => {
        console.log(`[Vercel API Handler] Response finished for ${req.url}`);
        resolve();
      });
      res.on("close", () => {
        console.log(`[Vercel API Handler] Response closed for ${req.url}`);
        resolve();
      });
      res.on("error", (err: any) => {
        console.error("[Vercel Response Stream Error]:", err);
        reject(err);
      });

      try {
        // Express apps are middleware functions, so call them directly
        app(req, res, (err?: any) => {
          if (err) {
            console.error("[Vercel Express Middleware Error]:", err);
            if (!res.headersSent) {
              res.status(500).json({
                message: "Internal Server Error",
                error: err?.message || String(err),
              });
            }
          }
        });
      } catch (syncErr: any) {
        console.error("[Vercel Sync Error during app call]:", syncErr);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Synchronous error in Express app",
            error: syncErr?.message || String(syncErr),
          });
        }
        reject(syncErr);
      }
    });
  } catch (err: any) {
    console.error("[Vercel Handler Error]:", err);
    res.status(500).json({
      message: "Vercel serverless function execution failed on startup.",
      error: err?.message || String(err),
    });
  }
}
