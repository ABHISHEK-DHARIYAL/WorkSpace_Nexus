import { adminAuth } from "../../config/firebase";
import { TokenVerifier, TokenVerificationResult } from "./types";

// Firebase ID tokens are long JWTs (typically 900+ chars); this is the same
// heuristic the original inline logic used to distinguish them from the
// shorter custom-signed JWTs issued by this backend.
const FIREBASE_TOKEN_MIN_LENGTH = 500;

/**
 * Handles real Firebase Auth ID tokens. Failure reasons are encoded directly
 * in the result (status/message/code) so both strict (`authenticate`) and
 * lenient (`optionalAuthenticate`) callers can reuse this single verifier —
 * the lenient caller simply discards the failure details.
 */
export class FirebaseTokenVerifier implements TokenVerifier {
  readonly name = "firebase";

  canHandle(token: string): boolean {
    return token.length > FIREBASE_TOKEN_MIN_LENGTH;
  }

  async verify(token: string): Promise<TokenVerificationResult> {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return {
        success: true,
        user: { email: decodedToken.email || "", role: "user", uid: decodedToken.uid },
      };
    } catch (err: any) {
      if (err?.code === "auth/id-token-expired") {
        return { success: false, status: 401, message: "Token expired", code: "EXPIRED" };
      }
      return { success: false, status: 401, message: "Unauthorized: Invalid session" };
    }
  }
}
