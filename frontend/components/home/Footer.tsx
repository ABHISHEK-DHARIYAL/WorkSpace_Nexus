import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthModal } from '../../context/AuthModalContext';

const Footer: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { openLogin, openSignup } = useAuthModal();

  return (
    <footer className="bg-white dark:bg-[#0f1115] border-t border-slate-100 dark:border-[#2d323f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-black dark:bg-[#eee1ba] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-[#eee1ba] dark:text-black" />
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">WorkSpace Nexus</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              A modern workspace for writing, organizing, publishing, and discovering technical knowledge.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-10 gap-y-6">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Explore</span>
              <Link to="/public-content" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] transition-colors">
                Public Docs
              </Link>
              <Link to="/document" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] transition-colors">
                Start Writing
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Account</span>
              <button onClick={openLogin} className="text-sm font-bold text-left text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] transition-colors">
                Login
              </button>
              <button onClick={openSignup} className="text-sm font-bold text-left text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] transition-colors">
                Get Started
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Appearance</span>
              <button
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-[#2d323f] text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} WorkSpace Nexus. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
