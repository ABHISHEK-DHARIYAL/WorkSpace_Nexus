import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import ProductPreview from './ProductPreview';

const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0f1115] border-b border-slate-100 dark:border-[#2d323f] transition-colors duration-300">
      {/* Subtle gold glow accents, consistent with the rest of the app */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#eee1ba]/20 dark:bg-[#eee1ba]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#eee1ba]/10 dark:bg-[#eee1ba]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-black border border-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-7"
            >
              <Sparkles className="w-3 h-3 text-[#eee1ba]" />
              <span>Knowledge Repository</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
              className="text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.95] mb-6"
            >
              Build. Organize.
              <br />
              <span className="text-black bg-[#eee1ba]/40 dark:bg-[#eee1ba]/80 px-3 py-1 rounded-2xl inline-block mt-2">
                Publish.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mb-3"
            >
              Your knowledge, structured.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl mb-9"
            >
              WorkSpace Nexus is a modern workspace for writing, organizing, publishing, and
              discovering technical knowledge — built for developers and teams who value clarity,
              speed, and precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                to="/document"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-black dark:bg-[#eee1ba] text-[#eee1ba] dark:text-black hover:bg-slate-800 dark:hover:bg-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                Start Writing <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/public-content"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent border border-slate-200 dark:border-[#2d323f] text-slate-700 dark:text-slate-200 hover:border-[#eee1ba] hover:text-black dark:hover:text-[#eee1ba] text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Explore Public Docs
              </Link>
            </motion.div>
          </div>

          <div className="lg:pl-4">
            <ProductPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
