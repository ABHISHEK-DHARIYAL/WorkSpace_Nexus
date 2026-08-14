import React from 'react';
import { FileText, Save, ChevronUp, Bookmark, BookOpen, Minimize2 } from 'lucide-react';
import Reveal from './Reveal';

const EditorShowcase: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-[#0c0e12] border-y border-slate-100 dark:border-[#2d323f] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-[#eee1ba]">The Writing Experience</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 mb-4">
            Write without friction.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Stay focused on your ideas with an immersive document editor built for technical writing.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            aria-hidden="true"
            className="rounded-3xl border border-slate-200 dark:border-[#2d323f] bg-white dark:bg-[#12141a] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.35)] dark:shadow-[0_50px_120px_-40px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-4 border-b border-slate-100 dark:border-[#2d323f]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-black text-[#eee1ba]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">Architecture / API Reference</p>
                  <p className="text-[10px] text-slate-400 font-bold">Rich Text &middot; 1,204 words</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                  <Save className="w-3 h-3" /> Autosaved
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eee1ba]/20 text-black dark:text-[#eee1ba] text-[9px] font-black uppercase tracking-wider">
                  <Bookmark className="w-3 h-3" /> Bookmarked
                </span>
                <span className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500">
                  <Minimize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[22rem]">
              {/* Document structure sidebar */}
              <div className="hidden lg:flex flex-col gap-1 p-5 border-r border-slate-100 dark:border-[#2d323f] bg-slate-50/60 dark:bg-[#15181e]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Document Structure</p>
                {['Overview', 'Authentication', 'Endpoints', 'Rate Limits', 'Errors', 'Changelog'].map((h, i) => (
                  <div
                    key={h}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${
                      i === 1
                        ? 'bg-black text-[#eee1ba] dark:bg-[#eee1ba] dark:text-black'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>

              {/* Rich text editor canvas */}
              <div className="p-6 sm:p-10 space-y-3">
                <div className="h-5 w-3/5 rounded bg-slate-900 dark:bg-white" />
                <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-[#2d323f]" />
                <div className="h-2.5 w-11/12 rounded bg-slate-100 dark:bg-[#2d323f]" />
                <div className="h-2.5 w-4/6 rounded bg-slate-100 dark:bg-[#2d323f]" />

                <div className="flex items-center gap-2 mt-6 mb-2">
                  <ChevronUp className="w-3.5 h-3.5 text-[#eee1ba] rotate-90" />
                  <div className="h-3 w-1/3 rounded bg-slate-300 dark:bg-[#3a4150]" />
                </div>
                <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-[#2d323f]" />
                <div className="h-2.5 w-5/6 rounded bg-slate-100 dark:bg-[#2d323f]" />

                <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1e26] border border-slate-100 dark:border-[#2d323f] font-mono text-[10px] text-slate-400 space-y-1.5">
                  <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-[#2d323f]" />
                  <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-[#2d323f]" />
                  <div className="h-2 w-3/5 rounded bg-slate-200 dark:bg-[#2d323f]" />
                </div>

                <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-[#2d323f] mt-5" />
                <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-[#2d323f]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default EditorShowcase;
