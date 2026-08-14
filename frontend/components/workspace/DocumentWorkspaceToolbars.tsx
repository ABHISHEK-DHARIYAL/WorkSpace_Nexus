import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
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
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  visibility: 'public' | 'private';
  [key: string]: any;
}

interface DocumentTopToolbarProps {
  selectedProject: Project | null;
  activeTab: 'pages' | 'index';
  setActiveTab: (tab: 'pages' | 'index') => void;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>> | ((val: number | ((prev: number) => number)) => void);
  filteredPages: any[];
  setViewingPageIds: (ids: string[]) => void;
  pages: any[];
  editingTitle: boolean;
  setEditingTitle: (editing: boolean) => void;
  tempTitle: string;
  setTempTitle: (title: string) => void;
  handleTitleUpdate: (pageId: string) => void;
  readerTheme: 'slate' | 'vanilla' | 'midnight';
  setReaderTheme: (theme: 'slate' | 'vanilla' | 'midnight') => void;
  isReaderMode: boolean;
  setIsReaderMode: (mode: boolean) => void;
  handleToggleVisibility: (id: string, visibility: 'public' | 'private') => void;
  handleSeedSampleWorkspace: () => void;
  handlePageAdd: () => void;
  getHeaderToolbarClasses: () => string;
}

export const DocumentTopToolbar: React.FC<DocumentTopToolbarProps> = ({
  selectedProject,
  activeTab,
  setActiveTab,
  currentIndex,
  setCurrentIndex,
  filteredPages,
  setViewingPageIds,
  pages,
  editingTitle,
  setEditingTitle,
  tempTitle,
  setTempTitle,
  handleTitleUpdate,
  readerTheme,
  setReaderTheme,
  isReaderMode,
  setIsReaderMode,
  handleToggleVisibility,
  handleSeedSampleWorkspace,
  handlePageAdd,
  getHeaderToolbarClasses,
}) => {
  return (
    <div id="document-top-toolbar" className={`min-h-[4rem] h-auto py-3 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-8 z-30 gap-3 shadow-xs transition-colors duration-300 ${getHeaderToolbarClasses()}`}>
      <div>
        {selectedProject && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-1.5 select-none ${
            selectedProject.visibility === 'public'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 animate-in fade-in'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 animate-in fade-in'
          }`}>
            {selectedProject.visibility === 'public' ? '🌍 Public Content Portal' : '🔒 Private Outline Spec'}
          </span>
        )}
        <div className="flex items-center gap-2.5">
          {activeTab === 'pages' && filteredPages.length > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
                title="Previous Page Division"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-mono font-black px-1.5 text-slate-500 dark:text-slate-400">
                {String(currentIndex + 1).padStart(2, '0')} / {String(filteredPages.length).padStart(2, '0')}
              </span>
              <button
                disabled={currentIndex === filteredPages.length - 1}
                onClick={() => setCurrentIndex(Math.min(filteredPages.length - 1, currentIndex + 1))}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
                title="Next Page Division"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          
          <h1 
            className={`text-base font-black transition-colors truncate ${filteredPages[currentIndex] ? 'cursor-pointer hover:text-black dark:hover:text-[#eee1ba]' : 'cursor-default'} ${readerTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}
            onClick={() => { 
              if (filteredPages[currentIndex]) {
                setTempTitle(filteredPages[currentIndex].title || ''); 
                setEditingTitle(true); 
              }
            }}
          >
            {editingTitle && filteredPages[currentIndex] ? (
              <input 
                autoFocus
                type="text"
                className="border-b-2 border-black dark:border-[#eee1ba] bg-transparent outline-none"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => handleTitleUpdate(filteredPages[currentIndex]?.id || '')}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate(filteredPages[currentIndex]?.id || '')}
              />
            ) : (
              filteredPages[currentIndex] 
                ? `${activeTab === 'pages' ? `Page ${String(currentIndex + 1).padStart(2, '0')}: ` : ''}${filteredPages[currentIndex].title}`
                : 'Blank Page Documentation'
            )}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 max-w-full">
        {/* Theme switcher for eye fatigue modes slate/vanilla */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 select-none">
          <button 
            onClick={() => setReaderTheme('slate')} 
            className={`p-1 px-2 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'slate' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            title="Slate eye fatigue pairing theme"
          >
            <Sun size={10} />
            <span className="hidden sm:inline">Slate</span>
          </button>
          <button 
            onClick={() => setReaderTheme('vanilla')} 
            className={`p-1 px-2 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'vanilla' ? 'bg-white/15 dark:bg-[#eee1ba]/15 text-[#5b4636] dark:text-[#eee1ba] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            title="Vanilla warm eyes styling alignment"
          >
            <Coffee size={10} />
            <span className="hidden sm:inline">Vanilla</span>
          </button>
          <button 
            onClick={() => setReaderTheme('midnight')} 
            className={`p-1 px-2 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'midnight' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            title="Dark Midnight theme"
          >
            <Moon size={10} />
            <span className="hidden sm:inline">Midnight</span>
          </button>
        </div>

        {/* Core Layout Type Division Toggle */}
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner select-none shrink-0">
          <button
            onClick={() => {
              setActiveTab('pages');
              if (pages[currentIndex]) {
                setViewingPageIds([pages[currentIndex].id]);
              } else {
                setViewingPageIds([]);
              }
            }}
            className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'pages'
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Pages Division view: separate pages"
          >
            <FileText size={10} />
            <span className="hidden sm:inline">Pages</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('index');
              setViewingPageIds([]);
            }}
            className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'index'
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Index-Based view: full sequential index flow"
          >
            <LayoutList size={10} />
            <span className="hidden sm:inline">Index Based</span>
          </button>
        </div>

        {/* Custom Segment Toggle for Reading and Writing modes */}
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner shrink-0 select-none">
          <button
            onClick={() => setIsReaderMode(false)}
            className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              !isReaderMode
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch to Document Writing Mode"
          >
            <Edit2 size={10} />
            <span className="hidden sm:inline">Write</span>
          </button>
          <button
            onClick={() => setIsReaderMode(true)}
            className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              isReaderMode
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch to Document Reading Mode"
          >
            <BookOpen size={10} />
            <span className="hidden sm:inline">Read</span>
          </button>
        </div>

        {/* Visibility Control Options Segment Control */}
        {selectedProject && (
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner shrink-0 select-none animate-in fade-in">
            <button
              onClick={() => handleToggleVisibility(selectedProject.id, 'private')}
              className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedProject.visibility !== 'public'
                  ? 'bg-slate-850 dark:bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Restrict access to private workspace outlines"
            >
              <span>🔒 <span className="hidden sm:inline">Private</span></span>
            </button>
            <button
              onClick={() => handleToggleVisibility(selectedProject.id, 'public')}
              className={`py-1 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedProject.visibility === 'public'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Publish document to public content portal"
            >
              <span>🌍 <span className="hidden sm:inline">Public</span></span>
            </button>
          </div>
        )}

        {!isReaderMode && (
          <>
            <button
              onClick={handleSeedSampleWorkspace}
              className="px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-black hover:from-violet-700 hover:to-black text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm shrink-0"
              title="Seed Workspace guides"
            >
              <Sparkles size={10} className="text-amber-300 animate-pulse" />
              <span className="hidden md:inline">Seed Guides</span>
            </button>

            <button 
              onClick={handlePageAdd}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shrink-0"
            >
              <Plus size={11} />
              <span className="hidden md:inline">Add Page</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface DocumentCanvasToolbarProps {
  selectedProject: Project | null;
  activeTab: 'pages' | 'index';
  setActiveTab: (tab: 'pages' | 'index') => void;
  readerTheme: 'slate' | 'vanilla' | 'midnight';
  setReaderTheme: (theme: 'slate' | 'vanilla' | 'midnight') => void;
  isReaderMode: boolean;
  setIsReaderMode: (mode: boolean) => void;
  handleToggleVisibility: (id: string, visibility: 'public' | 'private') => void;
  handlePageAdd: () => void;
  handleSeedSampleWorkspace: () => void;
  setShowIndexModal: (show: boolean) => void;
  onBackToProjects?: () => void;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean) => void;
}

export const DocumentCanvasToolbar: React.FC<DocumentCanvasToolbarProps> = ({
  selectedProject,
  activeTab,
  setActiveTab,
  readerTheme,
  setReaderTheme,
  isReaderMode,
  setIsReaderMode,
  handleToggleVisibility,
  handlePageAdd,
  handleSeedSampleWorkspace,
  setShowIndexModal,
  onBackToProjects,
  isSidebarCollapsed = false,
  setIsSidebarCollapsed,
}) => {
  const [activeHighlightColor, setActiveHighlightColor] = useState('#FFFF00');
  const [toolbarMinimized, setToolbarMinimized] = useState(false);

  const toolbarClasses = useMemo(() => {
    if (readerTheme === 'slate') return {
      main: 'bg-white/95 border-slate-200 text-slate-800 shadow-xl',
      title: 'text-slate-800',
      segment: 'bg-slate-100 border-slate-205',
      inactiveBtn: 'text-slate-500 hover:text-slate-900',
      actionBtn: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700',
      iconBox: 'bg-[#eee1ba]/10 text-black',
    };
    if (readerTheme === 'vanilla') return {
      main: 'bg-[#fcfaf2]/95 border-[#ecdcb4] text-[#5b4636] shadow-xl',
      title: 'text-[#5b4636]',
      segment: 'bg-[#eae3cb] border-[#dcceab]',
      inactiveBtn: 'text-[#8c745d] hover:text-[#5b4636]',
      actionBtn: 'bg-[#f4ecd8] hover:bg-[#eae3cb] border-[#dcceab] text-[#8c745d]',
      iconBox: 'bg-[#eae3cb] text-[#8c745d]',
    };
    // midnight
    return {
      main: 'bg-[#151922]/95 border-[#222938] text-white shadow-xl shadow-black/40',
      title: 'text-slate-100',
      segment: 'bg-[#0f1116] border-[#222938]',
      inactiveBtn: 'text-slate-400 hover:text-white',
      actionBtn: 'bg-[#1e2635] hover:bg-[#273247] border-[#222938] text-slate-300',
      iconBox: 'bg-[#1f2535] text-[#eee1ba]',
    };
  }, [readerTheme]);

  return (
    <div id="document-canvas-toolbar" className={`sticky top-0 z-30 backdrop-blur-md rounded-3xl border flex flex-col xl:flex-row items-center justify-between gap-4 animate-in fade-in duration-300 transition-all ${toolbarMinimized ? 'p-3' : 'p-5'} ${toolbarClasses.main}`}>
      {/* Left Block: Logo, Info & Project Access Status */}
      <div className="flex items-center gap-3 w-full xl:w-auto">
        <button
          onClick={onBackToProjects}
          className="flex items-center text-left gap-2 p-1 px-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-all active:scale-97 group border border-transparent hover:border-slate-250/30 dark:hover:border-slate-700/30"
          title="Return to Workspace Projects Section"
        >
          <div className={`p-2 rounded-xl transition-transform group-hover:-translate-x-0.5 ${toolbarClasses.iconBox}`}>
            <ChevronLeft size={13} className="group-hover:text-black transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-black uppercase tracking-wider ${toolbarClasses.title} transition-all group-hover:text-black`}>
                {selectedProject ? selectedProject.title : 'Back to Projects'}
              </span>
            </div>
            {!toolbarMinimized && (
              <p className="text-[9px] text-slate-400 font-bold block leading-none mt-0.5 group-hover:text-[#eee1ba] transition-colors">
                Return to Project Section
              </p>
            )}
          </div>
        </button>

        {setIsSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${toolbarClasses.actionBtn}`}
            title={isSidebarCollapsed ? "Expand Sidebar Outline" : "Collapse Sidebar Outline"}
          >
            {isSidebarCollapsed ? (
              <>
                <ChevronRight size={11} />
                <span className="text-[9px] font-black uppercase tracking-wider">Show Outline</span>
              </>
            ) : (
              <>
                <ChevronLeft size={11} />
                <span className="text-[9px] font-black uppercase tracking-wider">Hide Outline</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setToolbarMinimized(prev => !prev)}
          className={`p-1.5 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${toolbarClasses.actionBtn}`}
          title={toolbarMinimized ? 'Expand toolbar' : 'Minimize toolbar'}
        >
          {toolbarMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {/* Middle Block: Comfort Eye Themes & Dynamic Actions & Active Highlight controller */}
      {!toolbarMinimized && (
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-center">
        {/* Comfort Themes Switcher */}
        <div className={`flex p-1 rounded-xl border shrink-0 ${toolbarClasses.segment}`}>
          <button 
            onClick={() => setReaderTheme('slate')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'slate' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' : toolbarClasses.inactiveBtn}`}
            title="Slate Eye Comfort Core Theme"
          >
            <Sun size={10} />
            <span>Slate</span>
          </button>
          <button 
            onClick={() => setReaderTheme('vanilla')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${readerTheme === 'vanilla' ? 'bg-[#fdf6e3] text-[#5b4636] shadow-sm font-bold' : toolbarClasses.inactiveBtn}`}
            title="Vanilla Warm Eye Comfort styling scale"
          >
            <Coffee size={10} />
            <span>Vanilla</span>
          </button>
          <button 
            onClick={() => setReaderTheme('midnight')} 
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${readerTheme === 'midnight' ? 'bg-slate-950 text-white shadow-sm font-bold' : toolbarClasses.inactiveBtn}`}
            title="Dark Midnight eye strain reducer"
          >
            <Moon size={10} />
            <span>Midnight</span>
          </button>
        </div>

        {/* Division Pages and Index based Layout Switcher */}
        <div className={`flex p-1 rounded-xl border shrink-0 select-none ${toolbarClasses.segment}`}>
          <button
            onClick={() => setActiveTab('pages')}
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'pages'
                ? 'bg-black text-white shadow-sm font-bold'
                : toolbarClasses.inactiveBtn
            }`}
            title="Split layout into separate Pages Division sheets"
          >
            <FileText size={10} />
            <span>Pages Division</span>
          </button>
          <button
            onClick={() => setActiveTab('index')}
            className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'index'
                ? 'bg-black text-white shadow-sm font-bold'
                : toolbarClasses.inactiveBtn
            }`}
            title="Consolidated sequential Index-Based continuous stream outline"
          >
            <LayoutList size={10} />
            <span>Index Based</span>
          </button>
        </div>

        {/* Brand New Real-Time Page Highlighter & Eraser Controller */}
        <div className={`flex items-center gap-1.5 p-1 border rounded-xl shrink-0 ${toolbarClasses.segment}`}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('editor-global-highlight', { detail: { color: activeHighlightColor } }));
            }}
            className="p-1 px-2.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 bg-black text-white shadow-sm hover:bg-black active:scale-95"
            title="Highlight Selected Page Content"
          >
            <Highlighter size={10} />
            <span>Highlight</span>
          </button>

          {/* Preset Colors selector */}
          <div className="flex items-center gap-1 px-1 border-r border-[#cbd5e1] dark:border-[#384152]">
            {[
              { label: 'Yellow', color: '#FFFF00' },
              { label: 'Green', color: '#00FF00' },
              { label: 'Cyan', color: '#00FFFF' },
              { label: 'Pink', color: '#FF00FF' },
              { label: 'Orange', color: '#FF9900' }
            ].map((item) => (
              <button
                key={item.color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setActiveHighlightColor(item.color);
                  window.dispatchEvent(new CustomEvent('editor-global-highlight', { detail: { color: item.color } }));
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  activeHighlightColor === item.color 
                    ? 'border-black dark:border-[#eee1ba] scale-120 ring-2 ring-[#eee1ba]/30' 
                    : 'border-slate-300 dark:border-slate-600 hover:scale-110'
                }`}
                style={{ backgroundColor: item.color }}
                title={`Use ${item.label} Highlighter`}
              />
            ))}
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('editor-global-erase'));
            }}
            className="p-1 px-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/45 dark:hover:bg-red-900/35 dark:text-red-300 active:scale-95"
            title="Erase Highlight from Selected Page Content"
          >
            <Eraser size={10} />
            <span>Erase</span>
          </button>
        </div>

        {/* Page & Guide controls */}
        {!isReaderMode && (
          <>
            <button 
              onClick={handlePageAdd}
              className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${toolbarClasses.actionBtn}`}
              title="Add a new blank page documentation boundary line"
            >
              <Plus size={11} />
              <span>Add Page</span>
            </button>

            <button 
              onClick={handleSeedSampleWorkspace}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                readerTheme === 'midnight'
                  ? 'bg-black/40 hover:bg-black/50 text-[#eee1ba]/40 border-black/35'
                  : 'bg-[#eee1ba]/10 hover:bg-[#eee1ba]/15 text-black border-[#eee1ba]/15'
              }`}
              title="Seed starter outlines guide and API spec guide"
            >
              <Sparkles size={11} className="text-amber-500 animate-pulse" />
              <span>Seed Guides</span>
            </button>
          </>
        )}

        <button 
          onClick={() => setShowIndexModal(true)}
          className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${toolbarClasses.actionBtn}`}
          title="Configure parent-child TOC connector maps"
        >
          <LayoutList size={11} />
          <span>Index</span>
        </button>
      </div>
      )}

      {/* Right Block: Switch Mode & Fullscreen Controls */}
      <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
        {/* Switch Mode button */}
        <button
          onClick={() => setIsReaderMode(!isReaderMode)}
          className={`flex-grow xl:flex-grow-0 rounded-xl text-[10px] font-black uppercase tracking-[0.08em] transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-102 active:scale-98 ${toolbarMinimized ? 'py-1.5 px-3' : 'py-2.5 px-4'} ${
            isReaderMode
              ? 'bg-black text-white hover:bg-black shadow-black/10'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10'
          }`}
        >
          {isReaderMode ? (
            <>
              <Edit2 size={11} />
              <span>Switch to Write Mode</span>
            </>
          ) : (
            <>
              <BookOpen size={11} />
              <span>Switch to Reading Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
