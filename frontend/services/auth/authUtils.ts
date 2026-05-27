/**
 * Firebase Auth Utilities
 * Handles environment detection, URL construction, and domain validation
 * for Firebase authentication across different deployment environments.
 */

/**
 * Get the application URL from environment variables.
 * Used for OAuth callbacks and self-referential links.
 *
 * Priority:
 * 1. VITE_APP_URL (recommended for Vite + frontend)
 * 2. window.location.origin (current domain)
 * 3. Default to localhost
 */
export const getAppUrl = (): string => {
  const viteAppUrl = import.meta.env.VITE_APP_URL;

  if (viteAppUrl && viteAppUrl.trim()) {
    return viteAppUrl;
  }

  // Fallback to current window location
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

/**
 * Detect the current deployment environment
 */
export const getEnvironmentInfo = () => {
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.MODE === "development";
  const isProduction =
    import.meta.env.PROD || import.meta.env.MODE === "production";
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const isVercel =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("vercel-api.com"));

  return {
    isDevelopment,
    isProduction,
    isLocalhost,
    isVercel,
    hostname:
      typeof window !== "undefined" ? window.location.hostname : "unknown",
    appUrl: getAppUrl(),
  };
};

/**
 * Handle Firebase unauthorized-domain errors with helpful debugging info
 */
export const handleUnauthorizedDomainError = (error: any): string => {
  const env = getEnvironmentInfo();

  let message =
    "Authentication failed: Domain is not authorized in Firebase Console.";

  if (error.code === "auth/unauthorized-domain") {
    message += `\n\nTroubleshooting:
1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", ensure this domain is listed:
   - Current domain: ${env.hostname}
   - App URL: ${env.appUrl}
3. For Vercel production:
   - Add your Vercel production domain (e.g., your-app.vercel.app)
   - Add any custom domains
4. For local development:
   - localhost and 127.0.0.1 should be auto-added
5. After updating, wait 2-5 minutes for changes to propagate`;
  }

  console.error("[Auth Error]", message, { error, env });
  return message;
};

/**
 * Validate Firebase configuration completeness
 */
export const validateFirebaseConfig = (): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  const requiredVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === "") {
      errors.push(`Missing or empty: ${varName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Log authentication debug information for troubleshooting
 */
export const logAuthDebugInfo = (): void => {
  const env = getEnvironmentInfo();
  const firebaseConfig = validateFirebaseConfig();

  console.group("[Auth Debug Info]");
  console.log("Environment:", {
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    isLocalhost: env.isLocalhost,
    isVercel: env.isVercel,
  });
  console.log("URLs:", {
    currentDomain: env.hostname,
    appUrl: env.appUrl,
  });
  console.log("Firebase Config:", {
    isConfigured: firebaseConfig.valid,
    errors: firebaseConfig.errors,
  });
  console.groupEnd();
};
