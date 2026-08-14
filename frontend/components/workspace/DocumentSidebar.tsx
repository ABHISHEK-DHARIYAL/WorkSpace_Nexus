import React, { useState } from 'react';
import { 
  FileText, 
  LayoutList, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  ChevronRight,
  ChevronDown,
  BookOpen,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PageItem {
  id: string;
  title: string;
  pageNumber: number;
}

export interface IndexItem {
  id: string;
  title: string;
  linkedPage: string | string[];
  linkedSectionId?: string;
  position: number;
}

interface DocumentSidebarProps {
  pages: PageItem[];
  indices: IndexItem[];
  currentPageId?: string;
  onPageSelect: (pageId: string) => void;
  onIndexSelect: (linkedPage: string | string[], linkedSectionId?: string) => void;
  onPageAdd: () => void;
  onPageDelete: (pageId: string) => void;
  onIndexDelete: (indexId: string) => void;
  onIndexAdd: () => void;
  
  // States & handlers for inline page renaming
  editingPageId: string | null;
  setEditingPageId: (id: string | null) => void;
  editingPageTitle: string;
  setEditingPageTitle: (title: string) => void;
  onPageRename: (id: string, newTitle: string) => Promise<void>;

  activeTab: 'pages' | 'index';
  setActiveTab: (tab: 'pages' | 'index') => void;
  readerTheme: 'slate' | 'vanilla' | 'midnight';
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean) => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  pages,
  indices,
  currentPageId,
  onPageSelect,
  onIndexSelect,
  onPageAdd,
  onPageDelete,
  onIndexDelete,
  onIndexAdd,
  editingPageId,
  setEditingPageId,
  editingPageTitle,
  setEditingPageTitle,
  onPageRename,
  activeTab,
  setActiveTab,
  readerTheme,
  isSidebarCollapsed: propIsSidebarCollapsed,
  setIsSidebarCollapsed: propSetIsSidebarCollapsed,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [isPagesCollapsed, setIsPagesCollapsed] = useState(false);
  const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
  
  const [localIsSidebarCollapsed, setLocalIsSidebarCollapsed] = useState(false);
  const isSidebarCollapsed = propIsSidebarCollapsed !== undefined ? propIsSidebarCollapsed : localIsSidebarCollapsed;
  const setIsSidebarCollapsed = propSetIsSidebarCollapsed !== undefined ? propSetIsSidebarCollapsed : setLocalIsSidebarCollapsed;

  const sidebarClasses = React.useMemo(() => {
    if (readerTheme === 'slate') return {
      aside: 'bg-white border-slate-200 text-slate-800',
      header: 'bg-slate-50 border-slate-205',
      tabContainer: 'bg-slate-100 border-slate-200/60',
      searchRow: 'bg-[#fbfcfd] border-slate-200/80',
      searchInput: 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 placeholder-slate-400',
      divider: 'bg-slate-100',
      contentView: 'bg-white',
      itemRow: 'bg-slate-50 border-slate-200/50 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700 hover:text-slate-900',
      itemTitle: 'text-slate-800 group-hover:text-slate-950',
      itemBadge: 'bg-slate-200 text-slate-600 font-medium',
      pathBadge: 'bg-slate-200/70 text-slate-600',
      textMuted: 'text-slate-500',
    };
    if (readerTheme === 'vanilla') return {
      aside: 'bg-[#eae3cb] border-[#dcceab] text-[#5b4636]',
      header: 'bg-[#e2dac0] border-[#ecdcb4]',
      tabContainer: 'bg-[#d5cca6] border-[#ecdcb4]',
      searchRow: 'bg-[#eae3cb] border-[#dcceab]',
      searchInput: 'bg-[#fcfaf2] border-[#dcceab] hover:border-[#bdad83] text-[#5b4636] placeholder-[#a6957a]',
      divider: 'bg-[#dcceab]',
      contentView: 'bg-[#eae3cb]',
      itemRow: 'bg-[#f4ecd8] border-[#e2dac0] hover:bg-[#fcfaf2] hover:border-[#cbbfa6] text-[#8c745d] hover:text-[#5b4636]',
      itemTitle: 'text-[#5b4636] group-hover:text-[#3d2e24]',
      itemBadge: 'bg-[#e3d8b9] text-[#8c745d] font-medium',
      pathBadge: 'bg-[#e3d8b9] text-[#8c745d]',
      textMuted: 'text-[#a6957a]',
    };
    // midnight
    return {
      aside: 'bg-[#0f1116] border-[#222938] text-slate-100',
      header: 'bg-[#151922] border-[#222938]',
      tabContainer: 'bg-[#0f1116] border-[#222938]',
      searchRow: 'bg-[#151922] border-[#222938]',
      searchInput: 'bg-[#0f1116] border-[#222938] hover:border-[#38435c] text-white placeholder-slate-500',
      divider: 'bg-[#222938]',
      contentView: 'bg-[#0f1116]',
      itemRow: 'bg-[#151922] border-[#222938] hover:bg-[#1c2230] hover:border-[#38435c] text-slate-300 hover:text-white',
      itemTitle: 'text-slate-200 group-hover:text-white',
      itemBadge: 'bg-[#1e2635] text-[#eee1ba]/40 font-medium',
      pathBadge: 'bg-[#1e2635] text-[#eee1ba]/40',
      textMuted: 'text-slate-400',
    };
  }, [readerTheme]);

  // Sorter / Filter for pages list
  const filteredPages = (pages || []).filter((page) =>
    page && (page.title || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  // Sorter / Filter for indices
  const filteredIndices = (indices || []).filter((item) => {
    if (!item) return false;
    const ids = Array.isArray(item.linkedPage) 
      ? item.linkedPage 
      : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
    const pageTitles = ids.map((id) => (pages || []).find((p) => p.id === id)?.title || '');
    const matchesTitle = (item.title || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesPageTitle = pageTitles.some((title) => (title || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
    return matchesTitle || matchesPageTitle;
  });

  const handlePageRenameSubmit = async (pageId: string) => {
    if (!editingPageTitle.trim()) {
      setEditingPageId(null);
      return;
    }
    await onPageRename(pageId, editingPageTitle.trim());
    setEditingPageId(null);
  };

  return (
    <aside className={`nexus-responsive-aside ${isSidebarCollapsed ? 'collapsed-aside' : ''} border-r h-full shadow-sm ${sidebarClasses.aside}`}>
      {isSidebarCollapsed ? (
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          {/* Compact collapsed view */}
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black text-sm shadow-md shadow-black/20">
            D
          </div>
          
          <div className={`w-full h-px ${sidebarClasses.divider}`} />
          
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="p-2 rounded-xl bg-[#eee1ba]/10 dark:bg-black/50 hover:bg-[#eee1ba]/15 dark:hover:bg-black/50 text-black dark:text-[#eee1ba] font-bold transition-all cursor-pointer flex items-center justify-center"
            title="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
          
          <div className={`w-full h-px ${sidebarClasses.divider}`} />
          
          {/* Mini tabs triggers */}
          <button
            onClick={() => {
              setActiveTab('pages');
              setIsSidebarCollapsed(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'pages' ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1f29]'
            }`}
            title="Pages"
          >
            <FileText size={18} />
          </button>
          
          <button
            onClick={() => {
              setActiveTab('index');
              setIsSidebarCollapsed(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'index' ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1f29]'
            }`}
            title="Index"
          >
            <LayoutList size={18} />
          </button>

          <div className="mt-auto flex flex-col items-center gap-4 pb-2">
            <button
              onClick={activeTab === 'index' ? onIndexAdd : onPageAdd}
              className="p-2 rounded-xl bg-slate-100 hover:bg-black dark:bg-slate-800 hover:text-white text-black dark:text-[#eee1ba] transition-all cursor-pointer"
              title={activeTab === 'index' ? "Add Index Item" : "Add Page"}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      ) : (
        <>


      {/* Real-time Search Input at the top of BOTH views */}
      <div className={`px-4 py-1.5 border-b flex items-center justify-between gap-1 ${sidebarClasses.searchRow}`}>
        <button
          onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-grow text-left justify-between ${sidebarClasses.textMuted}`}
          title={isSearchCollapsed ? "Expand Search Filter" : "Collapse Search Filter"}
        >
          <span className="flex items-center gap-1.5">
            <Search size={11} /> Search Filter
          </span>
          {isSearchCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </button>
        <button
          onClick={() => setIsSidebarCollapsed(true)}
          className={`p-1 rounded bg-transparent hover:bg-slate-150/40 dark:hover:bg-[#1a1f29]/40 transition-all cursor-pointer flex-shrink-0 ${sidebarClasses.textMuted}`}
          title="Collapse Sidebar"
        >
          <ChevronLeft size={13} />
        </button>
      </div>

      {!isSearchCollapsed && (
        <div className={`px-4 py-2.5 border-b ${sidebarClasses.searchRow}`}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={activeTab === 'pages' ? "Search page titles..." : "Search index outline elements..."}
              className={`w-full border focus:border-[#eee1ba] focus:ring-1 focus:ring-[#eee1ba]/20 rounded-lg py-1.5 pl-9 pr-8 text-[11.5px] outline-none transition-all ${sidebarClasses.searchInput}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Views container */}
      <div id="document-sidebar-content-view" className={`flex-grow overflow-hidden flex flex-col ${sidebarClasses.contentView}`}>
        
        {/* PAGES STRUCTURE TAB PANEL */}
        {activeTab === 'pages' && (
          <div id="sidebar-pages-list" className="flex flex-col h-full overflow-hidden">
            {/* Action Bar / Dual-anchor Segment Control */}
            <div className={`px-3 py-2 flex items-center justify-between border-b gap-2 ${sidebarClasses.header}`}>
              <div className={`flex-grow flex p-0.5 rounded-lg border shadow-inner ${sidebarClasses.tabContainer}`}>
                <a
                  href="#pages"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('pages');
                    setSearchQuery('');
                  }}
                  className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                    (activeTab as string) === 'pages'
                      ? 'bg-black text-white shadow-sm font-black'
                      : `${sidebarClasses.textMuted} hover:text-slate-950 dark:hover:text-white`
                  }`}
                >
                  <FileText size={11} />
                  <span>Pages</span>
                </a>
                <a
                  href="#index"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('index');
                    setSearchQuery('');
                  }}
                  className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                    (activeTab as string) === 'index'
                      ? 'bg-black text-white shadow-sm font-black'
                      : `${sidebarClasses.textMuted} hover:text-slate-950 dark:hover:text-white`
                  }`}
                >
                  <LayoutList size={11} />
                  <span>Index</span>
                </a>
              </div>
              <button
                onClick={onPageAdd}
                className="p-1.5 bg-black hover:bg-black active:bg-black text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-all shadow-sm flex-shrink-0"
                title="Create New Page"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Sequential List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <AnimatePresence initial={false}>
                {/* Single Pages Section */}
                <div className="space-y-2">
                  <div 
                    onClick={() => setIsPagesCollapsed(!isPagesCollapsed)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-[#151921]/20 cursor-pointer transition-colors select-none"
                    title={isPagesCollapsed ? "Expand Documentation Pages" : "Collapse Documentation Pages"}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a6957a] dark:text-slate-400 flex items-center gap-1.5">
                      {isPagesCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                      Documentation Pages
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${sidebarClasses.itemBadge}`}>{filteredPages.length}</span>
                  </div>
                  
                  {!isPagesCollapsed && (
                    filteredPages.length === 0 ? (
                      <div key="no-matching-pages" className={`text-center py-6 rounded-xl border border-dashed text-slate-400 ${sidebarClasses.itemRow}`}>
                        <p className="text-[11px] font-medium font-sans">No matching pages found</p>
                      </div>
                    ) : (
                      filteredPages.map((page, idx) => {
                        const isCurrent = currentPageId === page.id;
                        const pageDisplayNumber = String(idx + 1).padStart(2, '0');

                        return (
                          <motion.div
                            key={page?.id || `page-item-${idx}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => {
                              if (editingPageId !== page.id) {
                                onPageSelect(page.id);
                              }
                            }}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                              isCurrent
                                ? 'bg-black text-white border-black font-bold shadow-md shadow-black/10'
                                : sidebarClasses.itemRow
                            }`}
                          >
                            {editingPageId === page.id ? (
                              <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  type="text"
                                  className="flex-grow bg-white text-slate-900 px-2.5 py-1 rounded-lg text-[11px] border border-slate-300 font-semibold outline-none focus:border-[#eee1ba] focus:ring-1 focus:ring-[#eee1ba]/20"
                                  value={editingPageTitle}
                                  onChange={(e) => setEditingPageTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handlePageRenameSubmit(page.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingPageId(null);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handlePageRenameSubmit(page.id)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white transition-all shadow-sm"
                                    title="Confirm rename"
                                  >
                                    <Check size={10} />
                                  </button>
                                  <button
                                    onClick={() => setEditingPageId(null)}
                                    className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-md text-slate-700 transition-all shadow-sm"
                                    title="Cancel"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Page Monospace Badge */}
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded leading-none ${
                                  isCurrent ? 'bg-[#eee1ba]/40 text-[#eee1ba]/15 font-bold' : sidebarClasses.itemBadge
                                }`}>
                                  Page {pageDisplayNumber}
                                </span>

                                {/* Truncated Bold page title */}
                                <span className={`text-[11.5px] font-semibold truncate flex-grow ml-3 text-left ${
                                  isCurrent ? 'text-white' : sidebarClasses.itemTitle
                                }`}>
                                  {page.title}
                                </span>

                                {/* Discrete hover actions */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPageId(page.id);
                                      setEditingPageTitle(page.title);
                                    }}
                                    className={`p-1 rounded-md transition-colors ${
                                      isCurrent ? 'hover:bg-[#eee1ba] hover:text-black text-white' : 'hover:bg-slate-200/50 text-slate-500 hover:text-[#5b4636]'
                                    }`}
                                    title="Edit Title"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPageDelete(page.id);
                                    }}
                                    className={`p-1 rounded-md transition-colors ${
                                      isCurrent ? 'hover:bg-[#eee1ba] hover:text-black text-white' : 'hover:bg-slate-200/50 text-slate-500 hover:text-red-500'
                                    }`}
                                    title="Delete Page"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })
                    )
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* DOCUMENT OUTLINE TAB PANEL */}
        {activeTab === 'index' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Add index connector trigger */}
            <div className={`px-3 py-2 flex items-center justify-between border-b gap-2 ${sidebarClasses.header}`}>
              <div className={`flex-grow flex p-0.5 rounded-lg border shadow-inner ${sidebarClasses.tabContainer}`}>
                <a
                  href="#pages"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('pages');
                    setSearchQuery('');
                  }}
                  className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                    (activeTab as string) === 'pages'
                      ? 'bg-black text-white shadow-sm font-black'
                      : `${sidebarClasses.textMuted} hover:text-slate-900 dark:hover:text-white hover:bg-white/60`
                  }`}
                >
                  <FileText size={11} />
                  <span>Pages</span>
                </a>
                <a
                  href="#index"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('index');
                    setSearchQuery('');
                  }}
                  className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                    (activeTab as string) === 'index'
                      ? 'bg-black text-white shadow-sm font-black'
                      : `${sidebarClasses.textMuted} hover:text-slate-900 dark:hover:text-white hover:bg-white/60`
                  }`}
                >
                  <LayoutList size={11} />
                  <span>Index</span>
                </a>
              </div>
              <button
                onClick={onIndexAdd}
                className="p-1.5 bg-black hover:bg-black active:bg-black text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-all shadow-sm flex-shrink-0"
                title="Create New Index"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Outline list hierarchy mapping directly to pages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar font-sans">
              <AnimatePresence initial={false}>
                <div className="space-y-2">
                  <div 
                    onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-[#151921]/10 cursor-pointer transition-colors select-none"
                    title={isIndexCollapsed ? "Expand Combined Indices" : "Collapse Combined Indices"}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a6957a] dark:text-slate-400 flex items-center gap-1.5">
                      {isIndexCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                      Combined Indices
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${sidebarClasses.itemBadge}`}>{filteredIndices.length}</span>
                  </div>

                  {!isIndexCollapsed && (
                    filteredIndices.length === 0 ? (
                      <div key="no-matching-indices" className={`text-center py-12 rounded-xl border border-dashed ${sidebarClasses.itemRow}`}>
                        <LayoutList size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2 select-none" />
                        <p className="text-[11px] font-medium">No matching index paths found</p>
                      </div>
                    ) : (
                      filteredIndices.map((item, indexIdx) => {
                        const sequentialNumber = String(indexIdx + 1).padStart(2, '0');
                        
                        const pageIds = Array.isArray(item.linkedPage)
                          ? item.linkedPage
                          : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
                        const mappedTitles = pageIds.map((id) => (Array.isArray(pages) ? pages : []).find((p) => p.id === id)?.title || 'Unnamed Page');
                        const linkedBreadcrumb = mappedTitles.join(' ➔ ');
                        
                        const isCurrent = currentPageId && pageIds.includes(currentPageId);

                        return (
                          <motion.div
                            key={item?.id || `idx-item-${indexIdx}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => onIndexSelect(item.linkedPage, item.linkedSectionId)}
                            className={`group flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                              isCurrent
                                ? 'bg-black text-white border-black font-bold shadow-md shadow-black/10'
                                : sidebarClasses.itemRow
                            }`}
                          >
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded leading-none mt-0.5 select-none ${
                              isCurrent ? 'bg-[#eee1ba]/40 text-[#eee1ba]/15 font-bold' : sidebarClasses.itemBadge
                            }`}>
                              Idx {sequentialNumber}
                            </span>

                            <div className="flex-grow min-w-0">
                              <div className={`text-[12px] font-bold truncate tracking-tight ${
                                isCurrent ? 'text-white' : sidebarClasses.itemTitle
                              }`}>
                                {item.title}
                              </div>
                              {linkedBreadcrumb && (
                                <div className={`text-[9.5px] truncate mt-1 font-medium flex items-center gap-1 ${
                                  isCurrent ? 'text-[#eee1ba]/15' : 'opacity-80'
                                }`}>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded leading-none select-none font-bold ${
                                    isCurrent ? 'bg-[#eee1ba]/50 text-[#eee1ba]/15' : sidebarClasses.pathBadge
                                  }`}>Path</span>
                                  <span className="truncate">{linkedBreadcrumb}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIndexDelete(item.id);
                              }}
                              className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all flex-shrink-0 ${
                                isCurrent ? 'hover:bg-[#eee1ba] hover:text-black text-white' : 'hover:bg-slate-200/50 text-slate-500 hover:text-red-500'
                              }`}
                              title="Delete Index"
                            >
                              <Trash2 size={11} />
                            </button>
                          </motion.div>
                        );
                      })
                    )
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </aside>
  );
};
