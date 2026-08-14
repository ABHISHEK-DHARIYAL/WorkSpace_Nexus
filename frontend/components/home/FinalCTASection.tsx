import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

const FinalCTASection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-[#eee1ba] dark:bg-[#eee1ba]">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-black/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight mb-5">
            Your knowledge deserves a better home.
          </h2>
          <p className="text-base sm:text-lg font-bold text-black/70 mb-10 max-w-xl mx-auto">
            Write clearly. Organize intelligently. Publish confidently.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/document"
              className="inline-flex items-center gap-2 px-7 py-4 bg-black text-[#eee1ba] hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/public-content"
              className="inline-flex items-center gap-2 px-7 py-4 bg-transparent border-2 border-black text-black hover:bg-black hover:text-[#eee1ba] text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Explore Public Docs
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default FinalCTASection;
