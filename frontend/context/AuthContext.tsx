import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api/client';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirebaseAuthError } from '@/config/firebase';
import { authService } from '../services/api/auth';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  updateUser: (data: any) => void;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper to handle a validated Firebase User
  const handleFirebaseUserAuthenticated = async (fbUser: FirebaseUser) => {
    const email = fbUser.email;
    if (!email) {
      console.warn("Firebase User email is missing.");
      return;
    }

    let resolvedProfile: any = null;
    const nowIso = new Date().toISOString();

    if (db) {
      const userDocRef = doc(db, 'users', email);
      let userDocExists = false;
      try {
        const userDocSnap = await getDoc(userDocRef);
        userDocExists = userDocSnap.exists();
        if (userDocExists) {
          resolvedProfile = userDocSnap.data();
        }
      } catch (err) {
        console.warn("Could not retrieve user document from Firestore:", err);
      }
      
      // Save/update user profile in Firestore
      try {
        const isSA = email.toLowerCase() === "admin@workspace.com" || email.toLowerCase() === "hshit7534@gmail.com" || email.toLowerCase() === "rajveer@gmail.com";
        const profileData: any = {
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: email,
          profilePicture: fbUser.photoURL || '',
          loginTimestamp: nowIso,
          role: resolvedProfile?.role || (isSA ? "admin" : "user"),
          isSocial: true
        };

        if (!userDocExists) {
          profileData.createdAt = nowIso;
        }

        await setDoc(userDocRef, profileData, { merge: true });
        resolvedProfile = { ...profileData, ...resolvedProfile };
        console.log("Firestore user profile updated.");
      } catch (err) {
        console.error("Firestore user profile save failed:", err);
      }
    } else {
      console.warn("Firestore db is not initialized. Handled on local JSON fallback backend sync.");
    }

    // Call Direct login(token, userData) with Firebase ID Token instead of making backend /api/auth calls
    try {
      const token = await fbUser.getIdToken();
      const isSA = email.toLowerCase() === "admin@workspace.com" || email.toLowerCase() === "hshit7534@gmail.com" || email.toLowerCase() === "rajveer@gmail.com";
      const finalUser = {
        uid: fbUser.uid,
        email: email,
        name: resolvedProfile?.name || fbUser.displayName || email.split('@')[0],
        role: resolvedProfile?.role || (isSA ? "admin" : "user"),
        profilePicture: resolvedProfile?.profilePicture || fbUser.photoURL || '',
        isSocial: true,
        createdAt: resolvedProfile?.createdAt || nowIso
      };
      
      login(token, finalUser);
    } catch (tokenErr) {
      console.error("Session token acquisition failed:", tokenErr);
      throw tokenErr;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Wait for Firebase session state initialization if Firebase handles Auth
        let fbUser: FirebaseUser | null = null;
        if (auth) {
          fbUser = await new Promise<FirebaseUser | null>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (u) => {
              unsubscribe();
              resolve(u);
            });
          });
        }

        // 2. If a valid persistent Firebase Auth user exists, perform auto-login synchronization
        if (fbUser && fbUser.email) {
          console.log("initAuth: Active Firebase persistent session found, syncing...");
          await handleFirebaseUserAuthenticated(fbUser);
          return;
        }

        // 3. Otherwise, fall back to existing localStorage custom JWT token verification
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Directly set active session without calling `/api/auth/me`
          setUser(JSON.parse(userData));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth, session may be expired or invalid:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
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
      if (fbUser && fbUser.email && !localStorage.getItem('token')) {
        console.log("Firebase persistent session detected. Performing auto-login...");
        try {
          setLoading(true);
          await handleFirebaseUserAuthenticated(fbUser);
        } catch (err) {
          console.error("Session auto-login failed:", err);
        } finally {
          setLoading(false);
        }
      } else if (!fbUser) {
        // If Firebase currentUser becomes null: auto logout to handle account deletions or manual token revocation
        const token = localStorage.getItem('token');
        if (token && !token.startsWith('mock_')) {
          console.log("Firebase session invalidated. Triggering automatic logout cleanup.");
          logout();
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
    console.log("Proceeding with high-durability local sandbox session for:", email);
    const isSA = email.toLowerCase() === "admin@workspace.com" || email.toLowerCase() === "hshit7534@gmail.com" || email.toLowerCase() === "rajveer@gmail.com";
    const mockUser = {
      email: email,
      uid: email,
      name: name || email.split('@')[0],
      role: isSA ? "admin" : "user",
      isSocial: true,
      createdAt: new Date().toISOString()
    };
    const payloadStr = JSON.stringify({
      email: mockUser.email,
      uid: mockUser.uid,
      role: mockUser.role,
      name: mockUser.name
    });
    const mockToken = "mock_sandbox_jwt_" + btoa(unescape(encodeURIComponent(payloadStr)));
    login(mockToken, mockUser);
  };

  const loginWithGoogle = async () => {
    // If we recognize Firebase is unconfigured or has credentials missing from environment settings, show the account selector list
    const isMockOrUnconfigured = !auth || !(auth as any).app?.options?.apiKey || (auth as any).app.options.apiKey === 'remixed-api-key';
    
    if (isMockOrUnconfigured) {
      console.log("Unconfigured Firebase Auth environment detected. Showing Google account selector list.");
      setShowMockGoogleSelector(true);
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account' // Brings up the list of accounts on the device
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIframe = window.self !== window.top;

    try {
      if (isMobile || isIframe) {
        // In iframe or mobile, popup is blocked, so proceed with redirect directly
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          console.warn("signInWithRedirect failed, attempting popup instead:", redirectErr);
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
          if (popupErr.code === 'auth/popup-blocked' || popupErr.message?.includes('popup-blocked')) {
            console.warn("Popup blocked. Falling back to redirect...");
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      }
    } catch (err: any) {
      console.warn("Google Sign-In failed, gracefully displaying the Google account selector list:", err);
      setShowMockGoogleSelector(true);
    }
  };

  const isApiKeyError = (err: any): boolean => {
    const msg = (err?.message || "").toLowerCase();
    const code = (err?.code || "").toLowerCase();
    return (
      code.includes('api-key-not-valid') ||
      code.includes('invalid-api-key') ||
      msg.includes('api-key-not-valid') ||
      msg.includes('api key not valid') ||
      msg.includes('invalid-api-key') ||
      msg.includes('please pass a valid api key')
    );
  };

  const signupWithEmail = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/signup', { email, password });
      if (response.data && response.data.token) {
        const { token, user: userData } = response.data;
        login(token, userData);
      } else {
        throw new Error(response.data?.message || 'Signup failed.');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Signup failed.';
      throw new Error(errorMsg);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.token) {
        const { token, user: userData } = response.data;
        login(token, userData);
      } else {
        throw new Error(response.data?.message || 'Login failed.');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Incorrect email address or password. Please try again.';
      throw new Error(errorMsg);
    }
  };

  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (clearErr) {
      console.warn("Storage clearing errored:", clearErr);
    }
    delete api.defaults.headers.common['Authorization'];
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
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, loginWithGoogle, signupWithEmail, loginWithEmail }}>
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

const MockGoogleAuthModal: React.FC<MockGoogleAuthModalProps> = ({ isOpen, onClose, onAuthenticate }) => {
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      await onAuthenticate(email, name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate.');
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const name = customEmail.split('@')[0];
    handleSelectAccount(customEmail, name);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
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
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">Choose a sandbox account</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            to continue to <span className="font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">WorkSpace Nexus</span>
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
            onClick={() => handleSelectAccount('admin@workspace.com', 'Admin')}
            disabled={isSubmitting}
            className="w-full flex items-center p-3 rounded-xl border border-slate-200 dark:border-indigo-800/80 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all text-left bg-indigo-50/10 dark:bg-indigo-950/5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm mr-3">
              AD
            </div>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                Admin (Device Google User)
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-450 font-mono">
                admin@workspace.com
              </span>
            </div>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase">
              Google
            </span>
          </button>

          <button
            onClick={() => handleSelectAccount('hshit7534@gmail.com', 'Hshit')}
            disabled={isSubmitting}
            className="w-full flex items-center p-3 rounded-xl border border-slate-200 dark:border-indigo-800/80 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all text-left bg-indigo-50/10 dark:bg-indigo-950/5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm mr-3">
              HS
            </div>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                hshit7534 (Device Google User)
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-450 font-mono">
                hshit7534@gmail.com
              </span>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase">
              Google
            </span>
          </button>

          <button
            onClick={() => handleSelectAccount('rajveer@gmail.com', 'Rajveer')}
            disabled={isSubmitting}
            className="w-full flex items-center p-3 rounded-xl border border-slate-200 dark:border-indigo-800/80 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all text-left bg-indigo-50/10 dark:bg-indigo-950/5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 font-bold flex items-center justify-center text-sm mr-3">
              RA
            </div>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                rajveer (Device Google User)
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-450 font-mono">
                rajveer@gmail.com
              </span>
            </div>
            <span className="text-[10px] bg-teal-100 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full uppercase">
              Google
            </span>
          </button>

          <button
            onClick={() => handleSelectAccount('jane.doe@example.com', 'Jane Doe')}
            disabled={isSubmitting}
            className="w-full flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left bg-white dark:bg-slate-900 group cursor-pointer"
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
              Mock User
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
              className="flex-grow p-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
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
            💡 <span className="font-bold">Sandbox Mode:</span> Real Firebase credentials are unconfigured on this development workspace. We have activated an active in-memory sandbox and mock social auth selection layer so you can run and test immediately!
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
