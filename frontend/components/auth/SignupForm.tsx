import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, UserPlus, AlertCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: (prefillEmail?: string) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signupWithEmail } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setIsSubmitting(true);
    try {
      await signupWithEmail(email, password);
      showToast('Account successfully created! Welcome onboard.', 'success', 'Account Created', 4000);
      const lastUrl = localStorage.getItem('last_private_url');
      onSuccess();
      if (lastUrl && lastUrl !== '/') {
        navigate(lastUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || 'Signup failed. Please try again.';
      setSignupError(errMsg);
      showToast(errMsg, 'error', 'Signup Failed', 4005);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-black dark:text-[#eee1ba]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-[#eee1ba]/50">New Member</span>
      </div>
      <h2 className="text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tight">Create Account</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">Set up your workspace in a minute.</p>

      {signupError && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="mb-4 text-xs text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm p-4 rounded-xl border border-red-200/60 dark:border-red-900/40 space-y-2"
        >
          <p className="font-bold flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{signupError}</span>
          </p>
          {signupError.includes('already exists') && (
            <div className="pt-2 border-t border-red-200/50 dark:border-red-900/40 flex flex-col gap-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                This user may already be seeded or pre-registered in the sandbox. You can use standard login directly!
              </p>
              <button
                type="button"
                onClick={() => onSwitchToLogin(email.trim())}
                className="w-full text-center py-2 bg-black hover:bg-slate-800 text-white rounded-lg font-bold text-[10.5px] uppercase transition-colors cursor-pointer"
              >
                Log In with {email || 'Account'} instead
              </button>
            </div>
          )}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-1">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-black dark:group-focus-within:text-[#eee1ba] transition-colors pointer-events-none" />
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#eee1ba]/50 focus:border-[#eee1ba] outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-1">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-black dark:group-focus-within:text-[#eee1ba] transition-colors pointer-events-none" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3.5 border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#eee1ba]/50 focus:border-[#eee1ba] outline-none transition-all placeholder:text-slate-400"
              required
            />
            <button
              id="signup-password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-black dark:hover:text-[#eee1ba] focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          id="signup-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full py-3.5 mt-2 overflow-hidden bg-black dark:bg-[#eee1ba] text-white dark:text-black font-bold rounded-xl cursor-pointer hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#eee1ba] disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <button type="button" onClick={() => onSwitchToLogin()} className="text-black dark:text-[#eee1ba] font-bold hover:underline">
          Login
        </button>
      </div>
    </div>
  );
};

export default SignupForm;
