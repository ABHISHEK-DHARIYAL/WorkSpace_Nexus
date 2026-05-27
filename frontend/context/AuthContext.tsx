import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api/client";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import {
  handleUnauthorizedDomainError,
  logAuthDebugInfo,
} from "@/frontend/services/auth/authUtils";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  updateUser: (data: any) => void;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper to handle a validated Firebase User
  const handleFirebaseUserAuthenticated = async (fbUser: FirebaseUser) => {
    const email = fbUser.email;
    if (!email) {
      console.warn("Firebase User email is missing.");
      return;
    }

    if (db) {
      const userDocRef = doc(db, "users", email);
      let userDocExists = false;
      try {
        const userDocSnap = await getDoc(userDocRef);
        userDocExists = userDocSnap.exists();
      } catch (err) {
        console.warn("Could not retrieve user document from Firestore:", err);
      }

      const nowIso = new Date().toISOString();

      // Save/update user profile in FireStore
      try {
        const isSA = email.toLowerCase() === "heroofthevil311@gmail.com";
        const profileData: any = {
          uid: fbUser.uid,
          name: fbUser.displayName || email.split("@")[0],
          email: email,
          profilePicture: fbUser.photoURL || "",
          loginTimestamp: nowIso,
          role: isSA ? "admin" : "user",
          isSocial: true,
        };

        if (!userDocExists) {
          profileData.createdAt = nowIso;
        }

        await setDoc(userDocRef, profileData, { merge: true });
        console.log("Firestore user profile updated.");
      } catch (err) {
        console.error("Firestore user profile save failed:", err);
      }
    } else {
      console.warn(
        "Firestore db is not initialized. Handled on local JSON fallback backend sync."
      );
    }

    // Call backend endpoint to register/retrieve custom JWT
    try {
      const { data } = await api.post("/auth/signup", {
        email: email,
        password: "GOOGLE_AUTH_EXTERNAL",
        isSocial: true,
      });
      login(data.token, data.user);
    } catch (apiErr) {
      console.error("Backend login sync failed:", apiErr);
      throw apiErr;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Log debug info on initialization
        logAuthDebugInfo();

        // 1. Wait for Firebase session state initialization if Firebase handles Auth
        let fbUser: FirebaseUser | null = null;
        if (auth) {
          fbUser = await new Promise<FirebaseUser | null>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth as any, (u) => {
              unsubscribe();
              resolve(u);
            });
          });
        }

        // 2. If a valid persistent Firebase Auth user exists, perform auto-login synchronization
        if (fbUser && fbUser.email) {
          console.log(
            "initAuth: Active Firebase persistent session found, syncing..."
          );
          await handleFirebaseUserAuthenticated(fbUser);
          return;
        }

        // 3. Otherwise, fall back to existing localStorage custom JWT token verification
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          // Verify with custom endpoint that token is active and valid
          await api.get("/auth/me");
          setUser(JSON.parse(userData));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(
          "Failed to initialize auth, session may be expired or invalid:",
          err
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Monitor Firebase auth session changes for automatic login
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // If Firebase session exists but local JWT token has expired or is missing, trigger auto-login
      if (fbUser && fbUser.email && !localStorage.getItem("token")) {
        console.log(
          "Firebase persistent session detected. Performing auto-login..."
        );
        try {
          setLoading(true);
          await handleFirebaseUserAuthenticated(fbUser);
        } catch (err) {
          console.error("Session auto-login failed:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Check redirects on mobile
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          await handleFirebaseUserAuthenticated(result.user);
        }
      } catch (err) {
        console.error("Redirect login result processing failed:", err);
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, []);

  const [showMockGoogleSelector, setShowMockGoogleSelector] = useState(false);

  const handleMockAuthenticate = async (email: string, name: string) => {
    try {
      const { data } = await api.post("/auth/signup", {
        email,
        password: "GOOGLE_AUTH_EXTERNAL",
        isSocial: true,
      });
      login(data.token, data.user);
    } catch (apiErr) {
      console.error("Backend mock signup/login sync failed:", apiErr);
      throw apiErr;
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      setShowMockGoogleSelector(true);
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account", // Brings up the list of accounts on the device
    });

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isIframe = window.self !== window.top;

    try {
      if (isMobile || isIframe) {
        // In iframe or mobile, popup is blocked, so proceed with redirect directly
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          console.warn(
            "signInWithRedirect failed, attempting popup instead:",
            redirectErr
          );

          // Log debug info if unauthorized-domain error
          if (redirectErr.code === "auth/unauthorized-domain") {
            logAuthDebugInfo();
            throw new Error(handleUnauthorizedDomainError(redirectErr));
          }

          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            await handleFirebaseUserAuthenticated(result.user);
          }
        }
      } else {
        try {
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            await handleFirebaseUserAuthenticated(result.user);
          }
        } catch (popupErr: any) {
          // Handle unauthorized-domain error
          if (popupErr.code === "auth/unauthorized-domain") {
            logAuthDebugInfo();
            throw new Error(handleUnauthorizedDomainError(popupErr));
          }

          if (
            popupErr.code === "auth/popup-blocked" ||
            popupErr.message?.includes("popup-blocked")
          ) {
            console.warn("Popup blocked. Falling back to redirect...");
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      }
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      if (err.code === "auth/popup-blocked") {
        throw new Error(
          "Popup blocked by your browser. Please unblock popups or open the application in a new tab using the link below to authenticate successfully."
        );
      }
      throw err;
    }
  };

  const login = (token: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    if (auth) {
      try {
        await auth.signOut();
      } catch (err) {
        console.error("Firebase Sign-out failed:", err);
      }
    }
  };

  const updateUser = (data: any) => {
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, loginWithGoogle }}
    >
      {children}
      <MockGoogleAuthModal
        isOpen={showMockGoogleSelector}
        onClose={() => setShowMockGoogleSelector(false)}
        onAuthenticate={handleMockAuthenticate}
      />
    </AuthContext.Provider>
  );
};

interface MockGoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (email: string, name: string) => Promise<void>;
}

const MockGoogleAuthModal: React.FC<MockGoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
}) => {
  const [customEmail, setCustomEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string) => {
    setIsSubmitting(true);
    setError("");
    try {
      await onAuthenticate(email, name);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate.");
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const name = customEmail.split("@")[0];
    handleSelectAccount(customEmail, name);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header matching Google style */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-3">
            {/* Google G Logo inside circle */}
            <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-850 flex items-center justify-center bg-white shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">
            Choose a sandbox account
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            to continue to{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
              WorkSpace Nexus
            </span>
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/30 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Account Selector List */}
        <div className="p-6 space-y-3">
          <button
            onClick={() =>
              handleSelectAccount("jane.doe@example.com", "Jane Doe")
            }
            disabled={isSubmitting}
            className="w-full flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-sm mr-3">
              JD
            </div>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Jane Doe (User Role)
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-450 font-mono">
                jane.doe@example.com
              </span>
            </div>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full uppercase">
              User
            </span>
          </button>

          <div className="py-2 flex items-center justify-center relative">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-white dark:bg-slate-900 px-3 z-10">
              or enter custom email
            </span>
            <hr className="w-full border-slate-100 dark:border-slate-800/85 absolute" />
          </div>

          <form onSubmit={handleCustomSubmit} className="pt-1 flex gap-2">
            <input
              type="email"
              placeholder="name@example.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              disabled={isSubmitting}
              className="grow p-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-sm hover:shadow transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Footer info explaining Firebase is unconfigured */}
        <div className="bg-slate-50 dark:bg-slate-950 p-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col justify-between items-center text-center">
          <div className="text-[11px] text-slate-400 dark:text-slate-450 max-w-sm mb-3 font-normal leading-relaxed">
            💡 <span className="font-bold">Sandbox Mode:</span> Real Firebase
            credentials are unconfigured on this development workspace. We have
            activated an active in-memory sandbox and mock social auth selection
            layer so you can run and test immediately!
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
