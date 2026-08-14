import { db, doc, getDoc } from "../config/firebase";

/**
 * Single responsibility: confirm a verified token's email still corresponds
 * to a live account in the database. Previously named `ensureUserInDb` and
 * inlined twice inside the auth middleware — separated out so the "is this
 * token valid" concern (tokenVerification/*) stays independent from the
 * "does this account still exist" concern (this file).
 */
export async function findActiveUserAccount(email: string): Promise<Record<string, any> | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const userRef = doc(db, "users", cleanEmail);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as Record<string, any>;
    }
  } catch (err) {
    console.error("[Auth Middleware] Error checking user in db:", err);
  }
  return null;
}
