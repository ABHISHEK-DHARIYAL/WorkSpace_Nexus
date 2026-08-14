import React from 'react';
import { Bookmark, PenTool as UnderlineIcon, Eraser, Settings, ChevronLeft, ChevronRight, Pipette, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReaderToolbarProps {
  title: string;
  chapterNumber?: number;
  totalChapters?: number;
  readingTimeEstimate: number;
  timeSpentStr: string;
  isBookmarked: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
  activeTools: any;
  setActiveTools?: (tools: any) => void;
  onAnnotate?: (type: 'highlight' | 'underline', color?: string, style?: string) => void;
  onClearAnnotations?: (type?: 'highlight' | 'underline' | 'all' | 'eraser_mode') => void;
  showUnderlinePicker: boolean;
  setShowUnderlinePicker: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  onPageChange: (dir: 'next' | 'prev') => void;
  cardClasses: Record<string, string>;
  theme: 'light' | 'sepia' | 'dark';
  colors: string[];
  underlineStyles: any[];
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  title,
  chapterNumber,
  totalChapters,
  readingTimeEstimate,
  timeSpentStr,
  isBookmarked,
  onBookmarkChange,
  activeTools,
  setActiveTools,
  onAnnotate,
  onClearAnnotations,
  showUnderlinePicker,
  setShowUnderlinePicker,
  showSettings,
  setShowSettings,
  onPageChange,
  cardClasses,
  theme,
  colors,
  underlineStyles,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const barBg = theme === 'dark'
    ? 'border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl'
    : theme === 'sepia'
      ? 'border-[#e8d5a7] bg-[#fdf6e3]/80 backdrop-blur-xl'
      : 'border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm';

  const CollapseToggle = (
    <button
      id="reader-toolbar-collapse-btn"
      onClick={onToggleCollapsed}
      className="p-1.5 rounded-lg hover:bg-slate-500/10 opacity-50 hover:opacity-100 transition-all shrink-0"
      title={collapsed ? 'Expand toolbar' : 'Minimize toolbar'}
    >
      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
    </button>
  );

  if (collapsed) {
    return (
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        className={`h-10 flex items-center justify-between px-4 sm:px-8 gap-3 border-b transition-colors duration-500 ${barBg}`}
      >
        <h1 className="text-xs font-bold truncate max-w-[60%]">{title}</h1>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onPageChange('prev')}
            className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-[#eee1ba]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange('next')}
            className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-[#eee1ba]"
          >
            <ChevronRight size={16} />
          </button>
          {CollapseToggle}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-20 py-3 flex flex-wrap items-center justify-between px-4 sm:px-8 gap-3 border-b transition-colors duration-500 ${barBg}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 truncate">
            Chapter {chapterNumber} of {totalChapters} • {readingTimeEstimate} min read
          </span>
          <h1 className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* Session Info */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Session</span>
          <span className="text-[10px] font-mono font-bold">{timeSpentStr}</span>
        </div>

        <button 
          id="reader-bookmark-toggle-btn"
          onClick={() => onBookmarkChange?.(!isBookmarked)} 
          className={`p-2 rounded-lg transition-all ${isBookmarked ? 'bg-[#eee1ba] text-white shadow-sm shadow-[#eee1ba]/15' : 'hover:bg-slate-500/10 opacity-40 hover:opacity-100'}`}
          title="Bookmark current chapter"
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        <div className="w-px h-6 bg-slate-200/20 mx-1" />

        {/* Annotation Tools */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <button 
              id="reader-underline-picker-toggle-btn"
              onClick={() => { 
                if (activeTools.underline) {
                  setActiveTools?.((prev: any) => {
                    const { underline, ...rest } = prev;
                    return rest;
                  });
                } else {
                  onAnnotate?.('underline', '#000000'); // Default black underline
                }
                setShowUnderlinePicker(!showUnderlinePicker); 
                setShowSettings(false); 
              }}
              className={`p-2 rounded-lg transition-all ${activeTools.underline ? 'bg-[#eee1ba] text-white shadow-md ring-2 ring-[#eee1ba]/50' : 'hover:bg-slate-500/10 opacity-70'}`}
              title="Underline Mode"
            >
              <UnderlineIcon size={18} />
            </button>
            
            <AnimatePresence>
              {showUnderlinePicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full mt-2 right-0 p-3 rounded-xl border shadow-xl ${cardClasses[theme]} w-48 z-[60] text-left`}
                >
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-3">Underline Style</div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {underlineStyles.map(style => (
                      <button 
                        key={style.name} 
                        onClick={() => { onAnnotate?.('underline', undefined, style.value); setShowUnderlinePicker(false); }}
                        className={`p-2 rounded-lg border border-slate-100 dark:border-white/10 hover:bg-[#eee1ba]/10 dark:hover:bg-black hover:text-black transition-all ${activeTools.underline?.style === style.value ? 'bg-[#eee1ba]/10 border-[#eee1ba]/25 dark:bg-black/40' : ''}`}
                        title={style.name}
                      >
                        <style.icon size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Underline Color</div>
                  <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {colors.map(color => (
                      <button 
                        key={color} 
                        onClick={() => { onAnnotate?.('underline', color); setShowUnderlinePicker(false); }}
                        className={`w-6 h-6 rounded-md border border-slate-200 dark:border-white/10 hover:scale-110 transition-transform ${activeTools.underline?.color === color ? 'ring-2 ring-[#eee1ba] ring-offset-2' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="w-6 h-6 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer shadow-sm relative">
                      <Pipette size={10} className="text-slate-400" />
                      <input 
                        type="color" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => { onAnnotate?.('underline', e.target.value); setShowUnderlinePicker(false); }}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              id="reader-clear-annotations-btn"
              onClick={() => {
                if (activeTools.eraser) {
                  setActiveTools?.({});
                } else {
                  onClearAnnotations?.('eraser_mode');
                }
              }}
              className={`p-2 rounded-lg transition-colors ${activeTools.eraser ? 'bg-red-500 text-white shadow-md ring-2 ring-red-500/50' : 'hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500'}`}
              title="Eraser Tool"
            >
              <Eraser size={18} />
            </button>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200/20 mx-1" />
        <button 
          id="reader-toggle-settings-btn"
          onClick={() => { setShowSettings(!showSettings); setShowUnderlinePicker(false); }} 
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-[#eee1ba] text-white' : 'hover:bg-slate-500/10 opacity-70'}`}
        >
          <Settings size={18} />
        </button>
        <button 
          id="reader-prev-chapter-btn"
          onClick={() => onPageChange('prev')} 
          className="p-2 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-[#eee1ba]"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          id="reader-next-chapter-btn"
          onClick={() => onPageChange('next')} 
          className="p-2 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-[#eee1ba]"
        >
          <ChevronRight size={20} />
        </button>

        <div className="w-px h-6 bg-slate-200/20 mx-1" />
        {CollapseToggle}
      </div>
    </div>
  );
};
