
const jwt = require("jsonwebtoken");

type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;
const { db, doc, getDoc } = require("../config/db");
const { ENV } = require("../config/env");
const { sendError } = require("../utils/response");

export interface AuthRequest extends Request {
  user?: any;
}

const ensureUserInDb = async (email: string, uid?: string) => {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const userRef = doc(db, "users", cleanEmail);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as any;
    }
  } catch (err) {
    console.error("[Auth Middleware] Error checking user in db:", err);
  }
  return null;
};

const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  // Handle Sandbox Mock Token FIRST
  if (token.startsWith("mock_sandbox_jwt_") || token.startsWith("mock_")) {
    try {
      const base64Payload = token.replace(/^mock_sandbox_jwt_|^mock_/, "");
      const jsonString = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const decoded = JSON.parse(jsonString);
      req.user = {
        email: decoded.email || "admin@workspace.com",
        role: decoded.role || "user",
        uid: decoded.uid || decoded.email || "admin@workspace.com"
      };
    } catch (err) {
      req.user = {
        email: "admin@workspace.com",
        role: "admin",
        uid: "admin@workspace.com"
      };
    }
  } else {
    // Custom JWT Verification
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      req.user = decoded;
      if (!req.user.uid && req.user.email) {
        req.user.uid = req.user.email;
      }
    } catch (jwtErr: any) {
      req.user = null;
    }
  }

  // Double-verify account exists in backend DB to process cascading deletions and soft logouts
  if (req.user && req.user.email) {
    const dbUser = await ensureUserInDb(req.user.email, req.user.uid);
    if (!dbUser) {
      req.user = null; // Session cleared for deleted accounts
    } else {
      req.user.role = dbUser.role || "user";
    }
  }

  return next();
};

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return sendError(res, "Unauthorized: No token provided", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return sendError(res, "Unauthorized: Malformed token", 401);
  }

  // Handle Sandbox Mock Token FIRST
  if (token.startsWith("mock_sandbox_jwt_") || token.startsWith("mock_")) {
    try {
      const base64Payload = token.replace(/^mock_sandbox_jwt_|^mock_/, "");
      const jsonString = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const decoded = JSON.parse(jsonString);
      req.user = {
        email: decoded.email || "admin@workspace.com",
        role: decoded.role || "user",
        uid: decoded.uid || decoded.email || "admin@workspace.com"
      };
    } catch (err) {
      req.user = {
        email: "admin@workspace.com",
        role: "admin",
        uid: "admin@workspace.com"
      };
    }
  } else {
    // Custom JWT Verification
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      req.user = decoded;
      if (!req.user.uid && req.user.email) {
        req.user.uid = req.user.email;
      }
    } catch (jwtErr: any) {
      if (jwtErr.name === "TokenExpiredError") {
        return sendError(res, "Auth: Token verification failed. jwt expired", 401, "EXPIRED");
      }
      return sendError(res, "Invalid or expired token", 401);
    }
  }

  // Double-verify account exists in database (prevents deleted/purged accounts from accessing API services)
  if (req.user && req.user.email) {
    const dbUser = await ensureUserInDb(req.user.email, req.user.uid);
    if (!dbUser) {
      return sendError(res, "Unauthorized: This account has been deleted or does not exist", 401);
    }
    req.user.role = dbUser.role || "user";
  } else {
    return sendError(res, "Unauthorized: Invalid credentials", 401);
  }

  return next();
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return sendError(res, "Forbidden: Admin access required", 403);
  }
  next();
};


module.exports = {
  optionalAuthenticate,
  authenticate,
  isAdmin
};
