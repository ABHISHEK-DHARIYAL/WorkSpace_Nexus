import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { TokenVerifier, TokenVerificationResult, VerifiedUser } from "./types";

/**
 * Handles this backend's own signed JWTs. This is the catch-all verifier
 * (canHandle always returns true) since it runs last in the resolution chain,
 * exactly matching the original `else` branch.
 */
export class JwtTokenVerifier implements TokenVerifier {
  readonly name = "jwt";

  canHandle(_token: string): boolean {
    return true;
  }

  async verify(token: string): Promise<TokenVerificationResult> {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as VerifiedUser;
      if (!decoded.uid && decoded.email) {
        decoded.uid = decoded.email;
      }
      return { success: true, user: decoded };
    } catch (err: any) {
      if (err?.name === "TokenExpiredError") {
        return {
          success: false,
          status: 401,
          message: "Auth: Token verification failed. jwt expired",
          code: "EXPIRED",
        };
      }
      return { success: false, status: 401, message: "Invalid or expired token" };
    }
  }
}
