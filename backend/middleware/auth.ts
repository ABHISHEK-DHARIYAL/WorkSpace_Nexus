import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { resolveTokenVerifier, VerifiedUser } from "./tokenVerification";
import { findActiveUserAccount } from "./userAccountValidator";

export interface AuthRequest extends Request {
  user?: VerifiedUser | null;
}

/** Pulls the bearer token out of the Authorization header, or null if absent/malformed. */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  return authHeader.split(" ")[1] ?? null;
}

/**
 * Strict authentication: rejects the request with a 401 whenever the token is
 * missing, invalid, or belongs to a deleted account. Behavior and every
 * error message/status/code are unchanged from the original implementation —
 * only the internals were decomposed into single-purpose collaborators.
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return sendError(res, "Unauthorized: No token provided", 401);
  }

  const token = extractBearerToken(req);
  if (!token) {
    return sendError(res, "Unauthorized: Malformed token", 401);
  }

  const verifier = resolveTokenVerifier(token);
  const result = await verifier.verify(token);

  if (!result.success) {
    return sendError(res, result.message, result.status, result.code);
  }

  req.user = result.user;
  if (!req.user?.email) {
    return sendError(res, "Unauthorized: Invalid credentials", 401);
  }

  const account = await findActiveUserAccount(req.user.email);
  if (!account) {
    return sendError(res, "Unauthorized: This account has been deleted or does not exist", 401);
  }
  req.user.role = account.role || "user";

  return next();
};

/**
 * Lenient authentication for public/optionally-personalized endpoints: never
 * rejects the request, just resolves `req.user` to null on any failure.
 */
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  const verifier = resolveTokenVerifier(token);
  const result = await verifier.verify(token);
  req.user = result.success ? result.user : null;

  if (req.user?.email) {
    const account = await findActiveUserAccount(req.user.email);
    req.user = account ? { ...req.user, role: account.role || "user" } : null;
  }

  return next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return sendError(res, "Forbidden: Admin access required", 403);
  }
  next();
};
