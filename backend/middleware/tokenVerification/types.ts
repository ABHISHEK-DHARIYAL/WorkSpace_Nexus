/**
 * A verified identity extracted from a token. Left open (index signature) because
 * custom JWTs may legitimately carry extra claims that downstream code relies on.
 */
export interface VerifiedUser {
  email: string;
  uid: string;
  role?: string;
  [claim: string]: any;
}

export type TokenVerificationResult =
  | { success: true; user: VerifiedUser }
  | { success: false; status: number; message: string; code?: string };

/**
 * Strategy interface (ISP): a verifier only needs to answer "can I handle this
 * token?" and "verify it". Nothing else. New token formats (e.g. an OAuth
 * provider added later) are added by implementing this interface (OCP) —
 * existing verifiers never need to change.
 */
export interface TokenVerifier {
  readonly name: string;
  canHandle(token: string): boolean;
  verify(token: string): Promise<TokenVerificationResult>;
}
