import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Square, Minus, MessageSquare, Ruler
} from 'lucide-react';

// Import split components
import { ReaderSettings } from './ReaderSettings';
import { ReaderToolbar } from './ReaderToolbar';

interface ReaderProps {
  content: string;
  title: string;
  chapterNumber?: number;
  totalChapters?: number;
  theme: 'light' | 'sepia' | 'dark';
  onThemeChange: (theme: 'light' | 'sepia' | 'dark') => void;
  onPageChange: (dir: 'next' | 'prev') => void;
  onAnnotate?: (type: 'highlight' | 'underline', color?: string, style?: string) => void;
  onClearAnnotations?: (type?: 'highlight' | 'underline' | 'all' | 'eraser_mode') => void;
  activeTools?: { highlight?: string; underline?: { color: string; style: string }; eraser?: boolean };
  setActiveTools?: (tools: any) => void;
  isBookmarked?: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
}

const Reader: React.FC<ReaderProps> = ({ 
  content, 
  title, 
  chapterNumber, 
  totalChapters,
  theme,
  onThemeChange,
  onPageChange,
  onAnnotate,
  onClearAnnotations,
  activeTools = {},
  setActiveTools,
  isBookmarked = false,
  onBookmarkChange
}) => {
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [maxWidth] = useState('max-w-3xl');
  const [focusLine, setFocusLine] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [readingMode, setReadingMode] = useState<'standard' | 'guide' | 'focus'>('standard');
  const [showUnderlinePicker, setShowUnderlinePicker] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  
  const colors = [
    '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#FF9900',
    '#D9EAD3', '#CFE2F3', '#D9D2E9', '#F4CCCC', '#FFF2CC', '#EAD1DC',
    '#808080'
  ];

  const underlineStyles = [
    { name: 'Normal', value: 'solid', icon: Ruler },
    { name: 'Thick', value: 'thick', icon: Square },
    { name: 'Dashed', value: 'dashed', icon: Minus },
    { name: 'Wavy', value: 'wavy', icon: MessageSquare },
  ];

  const [sessionStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (el) {
        const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
        setProgress(Math.min(100, Math.max(0, scrolled * 100)));
      }
    };
    
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (focusRef.current) {
      focusRef.current.style.top = `${e.clientY}px`;
    }
    if (rulerRef.current) {
      rulerRef.current.style.top = `${e.clientY}px`;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const readingTimeEstimate = Math.ceil((content || '').split(/\s+/).length / 200);

  const themeClasses = {
    light: 'bg-white text-slate-800',
    sepia: 'bg-[#f5f2e9] text-[#5b4636]',
    dark: 'bg-[#0a0a0a] text-slate-100'
  };

  const cardClasses = {
    light: 'bg-white border-slate-200 shadow-xl',
    sepia: 'bg-[#fdf6e3] border-[#eee1ba] shadow-lg shadow-[#d3c6a1]/20',
    dark: 'bg-[#121212] border-[#2a2a2a] shadow-2xl shadow-black/80'
  };

  return (
    <div 
      className={`relative w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses[theme]}`}
      onMouseMove={handleMouseMove}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200/20 z-50">
        <motion.div 
          className="h-full bg-[#eee1ba] shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading Guide Overlay */}
      {readingMode === 'guide' && (
        <>
          <div className="fixed inset-0 bg-black/40 pointer-events-none z-[45]" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, 0% 45%, 100% 45%, 100% 55%, 0% 55%, 0% 45%)' }} />
          <div ref={focusRef} className="fixed left-0 w-full h-[10vh] bg-[#eee1ba]/5 pointer-events-none z-[46] border-y border-[#eee1ba]/20 -translate-y-1/2" />
        </>
      )}

      {/* Focus Line */}
      {focusLine && (
        <div ref={focusRef} className="fixed left-0 w-full h-1 bg-[#eee1ba] pointer-events-none z-50 shadow-[0_0_10px_rgba(99,102,241,1)] -translate-y-1/2" />
      )}

      {/* Ruler Mode */}
      {rulerMode && (
        <div ref={rulerRef} className="fixed left-0 w-full h-px bg-[#eee1ba]/40 pointer-events-none z-50 -translate-y-1/2">
          <div className="absolute right-4 top-2 text-[8px] font-black uppercase tracking-tighter opacity-50 bg-[#eee1ba] text-white px-1 py-0.5 rounded">Ruler</div>
        </div>
      )}

      {/* Header and Toolbar component */}
      <ReaderToolbar
        title={title}
        chapterNumber={chapterNumber}
        totalChapters={totalChapters}
        readingTimeEstimate={readingTimeEstimate}
        timeSpentStr={formatTime(timeSpent)}
        isBookmarked={isBookmarked}
        onBookmarkChange={onBookmarkChange}
        activeTools={activeTools}
        setActiveTools={setActiveTools}
        onAnnotate={onAnnotate}
        onClearAnnotations={onClearAnnotations}
        showUnderlinePicker={showUnderlinePicker}
        setShowUnderlinePicker={setShowUnderlinePicker}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onPageChange={onPageChange}
        cardClasses={cardClasses}
        theme={theme}
        colors={colors}
        underlineStyles={underlineStyles}
        collapsed={toolbarCollapsed}
        onToggleCollapsed={() => setToolbarCollapsed(prev => !prev)}
      />

      {/* Settings Overlay panel component */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-16 right-8 z-40 p-6 rounded-2xl border shadow-2xl ${cardClasses[theme]} w-80 text-left`}
          >
            <ReaderSettings
              theme={theme}
              onThemeChange={onThemeChange}
              fontSize={fontSize}
              setFontSize={setFontSize}
              lineHeight={lineHeight}
              setLineHeight={setLineHeight}
              focusLine={focusLine}
              setFocusLine={setFocusLine}
              rulerMode={rulerMode}
              setRulerMode={setRulerMode}
              readingMode={readingMode}
              setReadingMode={setReadingMode}
              cardClasses={cardClasses}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      <div 
        ref={contentRef}
        className="flex-grow overflow-y-auto px-8 py-20 flex flex-col items-center custom-scrollbar"
      >
        <motion.div 
          className={`w-full ${maxWidth} transition-all duration-500 ${rulerMode ? 'border-l-2 border-[#eee1ba]/20 pl-8' : ''}`}
        >
          <div 
            className={`prose prose-lg max-w-none transition-all duration-300 ${theme === 'dark' ? 'prose-invert' : 'prose-slate'}`}
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: lineHeight,
              fontFamily: theme === 'sepia' ? 'Charter, Georgia, serif' : 'Inter, sans-serif'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </motion.div>
      </div>

      {/* Navigation Footer */}
      <div className={`h-16 border-t flex items-center justify-center px-8 text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${
        theme === 'dark' 
          ? 'bg-[#0f0f0f] border-white/5 text-white/40' 
          : theme === 'sepia'
            ? 'bg-[#f4ecd8] border-[#eee1ba] text-[#5b4636]/40'
            : 'bg-slate-100 border-slate-200 text-slate-400'
      }`}>
        End of Section
      </div>
    </div>
  );
};

export default Reader;
export { Reader };
