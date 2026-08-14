import React from 'react';
import { Sun, Coffee, Moon, Focus, Ruler, Eye } from 'lucide-react';

interface ReaderSettingsProps {
  theme: 'light' | 'sepia' | 'dark';
  onThemeChange: (theme: 'light' | 'sepia' | 'dark') => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  focusLine: boolean;
  setFocusLine: (val: boolean) => void;
  rulerMode: boolean;
  setRulerMode: (val: boolean) => void;
  readingMode: 'standard' | 'guide' | 'focus';
  setReadingMode: (mode: 'standard' | 'guide' | 'focus') => void;
  cardClasses: Record<string, string>;
}

export const ReaderSettings: React.FC<ReaderSettingsProps> = ({
  theme,
  onThemeChange,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  focusLine,
  setFocusLine,
  rulerMode,
  setRulerMode,
  readingMode,
  setReadingMode,
  cardClasses,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Theme</span>
        <div className="grid grid-cols-3 gap-2">
          <button 
            id="reader-theme-light-btn"
            onClick={() => onThemeChange('light')} 
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold gap-1 ${theme === 'light' ? 'bg-[#eee1ba]/70 border-[#eee1ba]/25 text-black' : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
          >
            <Sun size={18} />
            <span className="text-[9px]">Slate</span>
          </button>
          <button 
            id="reader-theme-sepia-btn"
            onClick={() => onThemeChange('sepia')} 
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold gap-1 ${theme === 'sepia' ? 'bg-[#5b4636]/10 border-[#5b4636]/20 text-[#5b4636]' : 'border-transparent hover:bg-slate-[#1a1c22] hover:bg-opacity-50'}`}
          >
            <Coffee size={18} />
            <span className="text-[9px]">Vanilla</span>
          </button>
          <button 
            id="reader-theme-dark-btn"
            onClick={() => onThemeChange('dark')} 
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold gap-1 ${theme === 'dark' ? 'bg-black border-[#eee1ba] text-white' : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
          >
            <Moon size={18} />
            <span className="text-[9px]">Midnight</span>
          </button>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Typography</span>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">Font Size</span>
            <div className="flex items-center gap-3">
              <button 
                id="reader-font-size-dec"
                onClick={() => setFontSize(f => Math.max(12, f - 2))} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-101/60 hover:bg-slate-200/50 dark:bg-white/5 dark:hover:bg-white/10 font-bold"
              >
                -
              </button>
              <span className="text-xs font-mono">{fontSize}px</span>
              <button 
                id="reader-font-size-inc"
                onClick={() => setFontSize(f => Math.min(32, f + 2))} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-101/60 hover:bg-slate-200/50 dark:bg-white/5 dark:hover:bg-white/10 font-bold"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">Line Height</span>
            <div className="flex items-center gap-2">
              <button 
                id="reader-lh-tight"
                onClick={() => setLineHeight(1.2)} 
                className={`px-2 py-1 rounded text-[10px] font-bold ${lineHeight === 1.2 ? 'bg-[#eee1ba] text-white' : 'bg-slate-100 hover:bg-slate-200/40 dark:bg-white/5 dark:hover:bg-white/10'}`}
              >
                Tight
              </button>
              <button 
                id="reader-lh-normal"
                onClick={() => setLineHeight(1.6)} 
                className={`px-2 py-1 rounded text-[10px] font-bold ${lineHeight === 1.6 ? 'bg-[#eee1ba] text-white' : 'bg-slate-100 hover:bg-slate-200/40 dark:bg-white/5 dark:hover:bg-white/10'}`}
              >
                Normal
              </button>
              <button 
                id="reader-lh-wide"
                onClick={() => setLineHeight(2.0)} 
                className={`px-2 py-1 rounded text-[10px] font-bold ${lineHeight === 2.0 ? 'bg-[#eee1ba] text-white' : 'bg-slate-100 hover:bg-slate-200/40 dark:bg-white/5 dark:hover:bg-white/10'}`}
              >
                Wide
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Reading Aids</span>
        <div className="grid grid-cols-2 gap-2">
          <button 
            id="reader-aid-focus"
            onClick={() => { setFocusLine(!focusLine); setRulerMode(false); setReadingMode('standard'); }} 
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${focusLine ? 'bg-[#eee1ba] border-[#eee1ba] text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10'}`}
          >
            <Focus size={14} /> Focus Line
          </button>
          <button 
            id="reader-aid-ruler"
            onClick={() => { setRulerMode(!rulerMode); setFocusLine(false); setReadingMode('standard'); }} 
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${rulerMode ? 'bg-[#eee1ba] border-[#eee1ba] text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10'}`}
          >
            <Ruler size={14} /> Ruler
          </button>
          <button 
            id="reader-aid-guide"
            onClick={() => { setReadingMode(readingMode === 'guide' ? 'standard' : 'guide'); setFocusLine(false); setRulerMode(false); }} 
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 col-span-2 ${readingMode === 'guide' ? 'bg-[#eee1ba] border-[#eee1ba] text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10'}`}
          >
            <Eye size={14} /> Reading Guide Overlay
          </button>
        </div>
      </div>
    </div>
  );
};
