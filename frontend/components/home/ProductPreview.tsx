import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FileText, Search, Layers, ChevronRight, Save, Type, BookOpen } from 'lucide-react';

/**
 * A hand-built, CSS-only mockup of WorkSpace Nexus's real interface shape
 * (sidebar, document list, editor canvas, toolbar) — not a screenshot.
 * Mirrors the actual layout patterns used in Sidebar.tsx / DocumentWorkspace.
 */
const ProductPreview: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: prefersReducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={prefersReducedMotion ? undefined : { y: -6, rotateX: 2 }}
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
      className="w-full max-w-xl mx-auto relative"
      aria-hidden="true"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-[#2d323f] bg-white dark:bg-[#12141a] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Window chrome */}
        <div className="h-9 flex items-center gap-1.5 px-4 border-b border-slate-100 dark:border-[#2d323f] bg-slate-50/80 dark:bg-[#15181e]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-[#2d323f] text-[9px] font-bold text-slate-400">
              <Search className="w-2.5 h-2.5" />
              workspacenexus.app
            </div>
          </div>
        </div>

        <div className="flex h-64 sm:h-80">
          {/* Sidebar */}
          <div className="w-[38%] sm:w-[32%] border-r border-slate-100 dark:border-[#2d323f] bg-slate-50/60 dark:bg-[#15181e] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
              <div className="w-4 h-4 rounded bg-black dark:bg-[#eee1ba] flex items-center justify-center">
                <Layers className="w-2.5 h-2.5 text-[#eee1ba] dark:text-black" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Workspace</span>
            </div>
            {[
              { label: 'Getting Started', active: false },
              { label: 'API Reference', active: true },
              { label: 'Architecture', active: false },
              { label: 'Deployment', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold truncate ${
                  item.active
                    ? 'bg-black text-[#eee1ba] dark:bg-[#eee1ba] dark:text-black'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <FileText className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Editor canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-[#2d323f]">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">API Reference.md</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Type className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-500">
                  <Save className="w-2.5 h-2.5" /> Saved
                </div>
              </div>
            </div>

            {/* Rich text content */}
            <div className="p-3 sm:p-5 space-y-2 flex-1 overflow-hidden">
              <div className="h-3 w-2/3 rounded bg-slate-800 dark:bg-white/80" />
              <div className="h-1.5 w-full rounded bg-slate-100 dark:bg-[#2d323f]" />
              <div className="h-1.5 w-5/6 rounded bg-slate-100 dark:bg-[#2d323f]" />
              <div className="h-1.5 w-4/6 rounded bg-slate-100 dark:bg-[#2d323f]" />
              <div className="flex items-center gap-1.5 mt-3 mb-1">
                <span className="w-3 h-1.5 rounded-sm bg-[#eee1ba]" />
                <div className="h-2 w-1/3 rounded bg-slate-300 dark:bg-[#3a4150]" />
              </div>
              <div className="h-1.5 w-full rounded bg-slate-100 dark:bg-[#2d323f]" />
              <div className="h-1.5 w-3/6 rounded bg-slate-100 dark:bg-[#2d323f]" />
              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#1a1e26] border border-slate-100 dark:border-[#2d323f] font-mono text-[8px] text-slate-400 space-y-1">
                <div className="h-1.5 w-3/4 rounded bg-slate-200 dark:bg-[#2d323f]" />
                <div className="h-1.5 w-1/2 rounded bg-slate-200 dark:bg-[#2d323f]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating callout chip, echoing the tilt-card style used elsewhere in the app */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="hidden sm:flex items-center gap-2 absolute -bottom-5 -right-5 bg-black dark:bg-[#eee1ba] text-white dark:text-black px-4 py-2.5 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-wider"
      >
        <ChevronRight className="w-3 h-3" />
        Autosave Enabled
      </motion.div>
    </motion.div>
  );
};

export default ProductPreview;
