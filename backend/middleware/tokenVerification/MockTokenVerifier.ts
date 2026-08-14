import { TokenVerifier, TokenVerificationResult } from "./types";

const MOCK_PREFIXES = ["mock_sandbox_jwt_", "mock_"];
const FALLBACK_ADMIN = { email: "admin@workspace.com", role: "admin", uid: "admin@workspace.com" };

/**
 * Handles sandbox/demo tokens. Mirrors the previous inline behavior exactly:
 * a malformed mock payload still resolves to a fallback admin identity rather
 * than failing, since these tokens are only ever issued by the sandbox itself.
 */
export class MockTokenVerifier implements TokenVerifier {
  readonly name = "mock";

  canHandle(token: string): boolean {
    return MOCK_PREFIXES.some((prefix) => token.startsWith(prefix));
  }

  async verify(token: string): Promise<TokenVerificationResult> {
    try {
      const base64Payload = token.replace(/^mock_sandbox_jwt_|^mock_/, "");
      const jsonString = Buffer.from(base64Payload, "base64").toString("utf-8");
      const decoded = JSON.parse(jsonString);
      return {
        success: true,
        user: {
          email: decoded.email || FALLBACK_ADMIN.email,
          role: decoded.role || "user",
          uid: decoded.uid || decoded.email || FALLBACK_ADMIN.uid,
        },
      };
    } catch {
      return { success: true, user: { ...FALLBACK_ADMIN } };
    }
  }
}
