import { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase";
import { sendError } from "../utils/response";

export const checkDb = (req: Request, res: Response, next: NextFunction) => {
  if (!db) {
    console.error("[checkDb Middleware] DB not initialized yet");
    return sendError(
      res,
      "Database starting up... please retry in a moment.",
      503
    );
  }
  console.log(
    `[checkDb Middleware] DB check passed for ${req.method} ${req.path}`
  );
  next();
};
