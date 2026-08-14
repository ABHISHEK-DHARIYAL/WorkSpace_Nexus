import React, { useState } from 'react';
import { 
  Sun, 
  Coffee, 
  Moon, 
  FileText, 
  LayoutList, 
  Edit2, 
  BookOpen, 
  Plus, 
  Sparkles,
  Highlighter,
  Eraser,
  Globe,
  Settings,
  Maximize2,
  Minimize2,
  ChevronLeft
} from 'lucide-react';

export interface ComfortWorkspaceSettingsProps {
  // Title/General Meta Props
  projectTitle?: string;
  isPublic?: boolean;
  onToggleVisibility?: () => void;
  isLoading?: boolean;
  onBack?: () => void;

  // Eye Comfort Themes
  theme: 'slate' | 'vanilla' | 'midnight';
  onThemeChange: (theme: 'slate' | 'vanilla' | 'midnight') => void;

  // View Divisions Mode
  divisionMode: 'pages' | 'index';
  onDivisionModeChange: (mode: 'pages' | 'index') => void;

  // Edit / Read Mode Transition
  isReaderMode: boolean;
  onModeToggle?: (isRead: boolean) => void;

  // Highlight Features
  activeHighlightColor?: string;
  onHighlightColorSelect?: (color: string) => void;
  isEraserActive?: boolean;
  onEraserToggle?: () => void;
  hideHighlightControl?: boolean;

  // Actions
  onAddPage?: () => void;
  onSeedGuides?: () => void;
  onToggleIndexOutline?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const ComfortWorkspaceSettings: React.FC<ComfortWorkspaceSettingsProps> = ({
  projectTitle = 'Active Project',
  isPublic = false,
  onToggleVisibility,
  isLoading = false,
  onBack,
  theme,
  onThemeChange,
  divisionMode,
  onDivisionModeChange,
  isReaderMode,
  onModeToggle,
  activeHighlightColor = '#FFFF00',
  onHighlightColorSelect,
  isEraserActive = false,
  onEraserToggle,
  hideHighlightControl = false,
  onAddPage,
  onSeedGuides,
  onToggleIndexOutline,
  isZenMode = false,
  onToggleZenMode
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#FF9900',
    '#D9EAD3', '#CFE2F3', '#D9D2E9', '#F4CCCC', '#FFF2CC', '#EAD1DC'
  ];

  // Dynamic Theme-Driven Styling definitions
  const containerThemeClass = {
    slate: 'bg-white/95 dark:bg-[#15181e]/95 border-slate-200 dark:border-[#2d323f]/80 text-slate-800 dark:text-white shadow-xl',
    vanilla: 'bg-[#f4ecd8] dark:bg-[#201813] border-[#eee1ba] dark:border-[#382f27] text-[#5b4636] dark:text-[#f4ecd8] shadow-sm',
    midnight: 'bg-[#0a0f1d]/95 dark:bg-[#070b14]/95 border-[#1e293b] dark:border-[#1a2333] text-slate-100 dark:text-slate-200 shadow-2xl shadow-black/40',
  }[theme] || 'bg-white/95 dark:bg-[#15181e]/95 border-slate-200 dark:border-[#2d323f]/80 text-slate-800 dark:text-white shadow-xl';

  const brandIconThemeClass = {
    slate: 'bg-[#eee1ba]/10 dark:bg-black/40 text-black dark:text-[#eee1ba]',
    vanilla: 'bg-[#eadfca] dark:bg-[#342921] text-[#7d5d42] dark:text-[#edd6c1]',
    midnight: 'bg-black/50 dark:bg-[#131929] text-[#eee1ba] dark:text-[#eee1ba] border border-[#eee1ba]/10',
  }[theme] || 'bg-[#eee1ba]/10 dark:bg-black/40 text-[#eee1ba] dark:text-[#eee1ba]';

  const brandTitleThemeClass = {
    slate: 'text-slate-800 dark:text-white',
    vanilla: 'text-[#5b4636] dark:text-[#eedcbf]',
    midnight: 'text-white dark:text-[#eee1ba]',
  }[theme] || 'text-slate-800 dark:text-white';

  const brandDescThemeClass = {
    slate: 'text-slate-400 dark:text-slate-500',
    vanilla: 'text-[#8c7462] dark:text-[#aba198]',
    midnight: 'text-slate-450 dark:text-[#eee1ba]/80',
  }[theme] || 'text-slate-400';

  const pillThemeClass = {
    slate: 'bg-slate-100 dark:bg-[#1f242e] border-slate-205 dark:border-[#2a2f3c]',
    vanilla: 'bg-[#eadfca] dark:bg-[#30251c] border-[#dfd2b5] dark:border-[#433529]',
    midnight: 'bg-slate-950 dark:bg-[#121826] border-slate-800 dark:border-[#1e293b]/50',
  }[theme] || 'bg-slate-100 dark:bg-[#1f242e] border-slate-205 dark:border-[#2a2f3c]';

  return (
    <div id="comfort-workspace-settings-toolbar" className={`w-full backdrop-blur-md rounded-2xl border p-5 flex flex-col xl:flex-row items-center justify-between gap-4 animate-in fade-in duration-350 z-30 transition-all duration-500 ${containerThemeClass}`}>
      {/* Brand Subheader Group */}
      <div className="flex items-center gap-3 w-full xl:w-auto">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-800 cursor-pointer text-slate-500 dark:text-slate-300 mr-1 shrink-0 active:scale-95"
            title="Go Back"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div className={`p-2.5 rounded-xl transition-all duration-500 ${brandIconThemeClass}`}>
          <FileText size={18} className="animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black uppercase tracking-wider transition-all duration-500 ${brandTitleThemeClass}`}>
              {projectTitle}
            </span>
          </div>
          <p className={`text-[10px] font-semibold mt-0.5 transition-all duration-500 ${brandDescThemeClass}`}>
            Unified Writing Playground & Layout Engine
          </p>
        </div>
      </div>

      {/* Middle Custom Settings Controls */}
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-center">
        {/* SLATE | VANILLA | MIDNIGHT Themes */}
        <div className={`flex p-1 rounded-xl border shrink-0 select-none transition-all duration-500 ${pillThemeClass}`}>
          <button 
            type="button"
            onClick={() => onThemeChange('slate')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              theme === 'slate' 
                ? 'bg-white dark:bg-slate-705 text-slate-900 dark:text-white shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun size={10} />
            <span>Slate</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('vanilla')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              theme === 'vanilla' 
                ? 'bg-[#fdf6e3] dark:bg-[#201813] text-[#5b4636] dark:text-[#f4ecd8] shadow-sm font-extrabold' 
                : 'text-slate-550 dark:text-slate-400 hover:text-[#5b4636] dark:hover:text-white'
            }`}
          >
            <Coffee size={10} />
            <span>Vanilla</span>
          </button>
          <button 
            type="button"
            onClick={() => onThemeChange('midnight')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              theme === 'midnight' 
                ? 'bg-[#0a0f1d] dark:bg-[#1a233d] text-white dark:text-[#eee1ba] shadow-sm font-extrabold' 
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon size={10} />
            <span>Midnight</span>
          </button>
        </div>



        {/* HIGHLIGHT & ERASE Actions */}
        {!hideHighlightControl && onHighlightColorSelect && (
          <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 relative transition-all duration-500 ${pillThemeClass}`}>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`p-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 ${
                theme === 'vanilla' 
                  ? 'text-[#5b4636]' 
                  : theme === 'midnight' 
                    ? 'text-slate-200' 
                    : 'text-slate-700 dark:text-slate-300'
              }`}
              title="Select highlight markup color"
            >
              <Highlighter size={12} style={{ color: activeHighlightColor === '#FFFF00' ? '#eab308' : activeHighlightColor }} />
              <span>Highlight</span>
            </button>
            
            {showColorPicker && (
              <div className="absolute top-10 left-0 bg-white dark:bg-[#15181e] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xl grid grid-cols-4 gap-1.5 z-50 animate-in zoom-in-95 duration-150">
                {colors.map((c) => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => {
                      onHighlightColorSelect(c);
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}

            {onEraserToggle && (
              <button
                type="button"
                onClick={onEraserToggle}
                className={`p-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  isEraserActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : `hover:bg-black/5 dark:hover:bg-white/5 ${
                        theme === 'vanilla' 
                          ? 'text-[#5b4636]' 
                          : theme === 'midnight' 
                            ? 'text-slate-200' 
                            : 'text-[#5b4636] dark:text-slate-400'
                      }`
                }`}
                title="Pick annotator eraser tool"
              >
                <Eraser size={11} />
                <span>Erase</span>
              </button>
            )}
          </div>
        )}

        {/* + ADD PAGE | # SEED GUIDES actions if in edit mode */}
        {!isReaderMode && (onAddPage || onSeedGuides) && (
          <div className="flex items-center gap-1 shrink-0">
            {onSeedGuides && (
              <button
                type="button"
                onClick={onSeedGuides}
                className="px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-black hover:from-violet-700 hover:to-black text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles size={10} className="text-amber-300 animate-pulse" />
                <span>Seed Guides</span>
              </button>
            )}
            {onAddPage && (
              <button 
                type="button"
                onClick={onAddPage}
                className={`px-2.5 py-1.5 border rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  theme === 'vanilla'
                    ? 'bg-[#f4ecd8] border-[#dfd2b5] text-[#5b4636] hover:bg-[#eadfca]'
                    : theme === 'midnight'
                      ? 'bg-slate-900 border-[#1e293b] text-slate-100 hover:bg-slate-850'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Plus size={11} />
                <span>Add Page</span>
              </button>
            )}
          </div>
        )}

        {/* SWITCH TO READING MODE / EDIT MODE */}
        {onModeToggle && (
          <button
            type="button"
            onClick={() => onModeToggle(!isReaderMode)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              isReaderMode
                ? theme === 'vanilla'
                  ? 'bg-[#5b4636] border-[#5b4636] text-[#f4ecd8] hover:bg-[#4a392b]'
                  : theme === 'midnight'
                    ? 'bg-[#eee1ba] border-[#eee1ba] text-black hover:bg-[#dfd4bd]'
                    : 'bg-slate-900 border-slate-950 text-white dark:bg-[#eee1ba] dark:text-black dark:border-[#eee1ba] hover:opacity-90'
                : 'bg-black border-black text-white hover:bg-black'
            }`}
          >
            {isReaderMode ? <Edit2 size={10} /> : <BookOpen size={10} />}
            <span>{isReaderMode ? 'Switch to Writing Mode' : 'Switch to Reading Mode'}</span>
          </button>
        )}

        {/* ENTER IMMERSIVE DISTRACTION-FREE FULL WRITING MODE */}
        {onToggleZenMode && (
          <button
            type="button"
            onClick={onToggleZenMode}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              isZenMode
                ? 'bg-amber-600 border-amber-700 text-white hover:bg-amber-750'
                : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-750'
            }`}
            title="Enter Immersive distraction-free full writing mode"
          >
            {isZenMode ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            <span>{isZenMode ? 'Exit Immersive Mode' : 'Enter Immersive Mode'}</span>
          </button>
        )}

        {/* Index outlines option toggle */}
        {onToggleIndexOutline && (
          <button
            type="button"
            onClick={onToggleIndexOutline}
            className={`p-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              theme === 'vanilla' 
                ? 'text-[#8c7462] hover:text-[#5b4636] hover:bg-black/5' 
                : theme === 'midnight' 
                  ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                  : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Toggle outline index list view"
          >
            <LayoutList size={11} />
            <span>& Index</span>
          </button>
        )}
      </div>
    </div>
  );
};
