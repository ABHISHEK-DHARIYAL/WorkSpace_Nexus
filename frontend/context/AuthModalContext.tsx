import React, { createContext, useContext, useState, useCallback } from 'react';

type AuthModalMode = 'login' | 'signup' | null;

interface AuthModalContextType {
  mode: AuthModalMode;
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

/**
 * Lets any component (Navbar buttons, ProtectedRoute, etc.) open the
 * Login/Signup popup without prop-drilling — a single source of truth for
 * "is the auth modal open, and in which mode".
 */
export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AuthModalMode>(null);

  const openLogin = useCallback(() => setMode('login'), []);
  const openSignup = useCallback(() => setMode('signup'), []);
  const close = useCallback(() => setMode(null), []);

  return (
    <AuthModalContext.Provider value={{ mode, openLogin, openSignup, close }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return ctx;
};
