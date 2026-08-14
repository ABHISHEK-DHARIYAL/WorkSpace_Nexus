import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';

/**
 * Same tilt-towards-cursor 3D card effect used elsewhere in the app,
 * scaled down to fit a popup instead of a full page.
 */
const TiltCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-white/70 dark:bg-[#15181e]/60 backdrop-blur-2xl p-8 sm:p-10 rounded-[28px] border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] relative overflow-hidden"
      >
        {/* Thin gold accent line along the top edge, echoing the black/gold identity */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#eee1ba] to-transparent" />

        {/* Soft gold glow bleeding through the glass, matching the site's ambient accents */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-56 h-56 bg-[#eee1ba]/40 dark:bg-[#eee1ba]/10 rounded-full blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 bg-[#eee1ba]/20 dark:bg-[#eee1ba]/5 rounded-full blur-[70px]" />

        <div style={{ transform: 'translateZ(30px)' }} className="absolute -top-4 -right-4 w-11 h-11 bg-black dark:bg-[#eee1ba] rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/40 dark:ring-black/20">
          <Sparkles className="w-5 h-5 text-[#eee1ba] dark:text-black" />
        </div>
        <div style={{ transform: 'translateZ(15px)' }} className="relative">{children}</div>
      </motion.div>
    </div>
  );
};

const AuthModal: React.FC = () => {
  const { mode, close, openLogin, openSignup } = useAuthModal();
  const [prefillEmail, setPrefillEmail] = useState<string | undefined>(undefined);

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md"
        >
          <div className="relative w-full flex items-center justify-center">
            <button
              onClick={close}
              aria-label="Close"
              className="absolute -top-12 right-0 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 hover:rotate-90 backdrop-blur-md text-white transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            <TiltCard>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'signup' ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'signup' ? -16 : 16 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {mode === 'login' ? (
                    <LoginForm
                      initialEmail={prefillEmail}
                      onSuccess={close}
                      onSwitchToSignup={() => {
                        setPrefillEmail(undefined);
                        openSignup();
                      }}
                    />
                  ) : (
                    <SignupForm
                      onSuccess={close}
                      onSwitchToLogin={(email) => {
                        setPrefillEmail(email);
                        openLogin();
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </TiltCard>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
