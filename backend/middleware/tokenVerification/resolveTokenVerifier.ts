import { TokenVerifier } from "./types";
import { MockTokenVerifier } from "./MockTokenVerifier";
import { FirebaseTokenVerifier } from "./FirebaseTokenVerifier";
import { JwtTokenVerifier } from "./JwtTokenVerifier";

// Order matters: each verifier is tried in turn via canHandle(), first match wins.
// JwtTokenVerifier is the catch-all and must stay last.
const VERIFIERS: TokenVerifier[] = [
  new MockTokenVerifier(),
  new FirebaseTokenVerifier(),
  new JwtTokenVerifier(),
];

/**
 * Adding support for a new token format (e.g. a future SSO provider) means
 * adding one class to VERIFIERS above — nothing here or in the calling
 * middleware needs to change (Open/Closed Principle).
 */
export function resolveTokenVerifier(token: string): TokenVerifier {
  return VERIFIERS.find((verifier) => verifier.canHandle(token)) ?? VERIFIERS[VERIFIERS.length - 1];
}
