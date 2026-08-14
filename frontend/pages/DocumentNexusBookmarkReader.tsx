import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FileText, 
  LayoutList, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Coffee, 
  Moon, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Search, 
  X,
  ChevronDown,
  ArrowLeft,
  Calendar,
  User,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { publicService } from '../services/api/public';
import Editor from '../components/editor/Editor';

export interface PageItem {
  id: string;
  title: string;
  pageNumber: number;
  content?: string;
  createdAt?: string;
}

export interface IndexItem {
  id: string;
  title: string;
  linkedPage: string | string[];
  linkedSectionId?: string;
  position: number;
}

const DocumentNexusBookmarkReader: React.FC = () => {
  const { projectId, pageId } = useParams<{ projectId: string; pageId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState<any>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout and theme states
  const [readerTheme, setReaderTheme] = useState<'slate' | 'vanilla' | 'midnight'>('slate');
  const [activeTab, setActiveTab] = useState<'pages' | 'index'>('pages');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingPageIds, setViewingPageIds] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPagesCollapsed, setIsPagesCollapsed] = useState(false);
  const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');

  // Fetch project details, pages and indices on mount
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const res = await publicService.getProjectById(projectId!);
        const data = res.data;
        if (!data) {
          throw new Error("Project details not found");
        }
        setProject(data);
        const pagesArray = Array.isArray(data.pagesDetails) ? data.pagesDetails : [];
        const indicesArray = Array.isArray(data.indicesDetails) ? data.indicesDetails : [];
        
        setPages(pagesArray);
        setIndices(indicesArray);

        // If there's a bookmarked pageId, navigate to that page directly in the index list!
        if (pageId && pagesArray.length > 0) {
          const pgIndex = pagesArray.findIndex(p => p.id === pageId);
          if (pgIndex !== -1) {
            setCurrentIndex(pgIndex);
            setViewingPageIds([pageId]);
          } else {
            setViewingPageIds([pagesArray[0].id]);
          }
        } else if (pagesArray.length > 0) {
          setViewingPageIds([pagesArray[0].id]);
        }
      } catch (err) {
        console.error("Failed to load Document Nexus bookmarked project:", err);
        navigate('/bookmarks');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId, pageId, navigate]);

  // Color mapping logic depending on active eye themes
  const themeClasses = useMemo(() => {
    if (readerTheme === 'slate') return {
      backdrop: 'bg-slate-50 text-slate-900',
      aside: 'bg-white border-slate-200 text-slate-800',
      header: 'bg-slate-50 border-slate-205',
      tabContainer: 'bg-slate-100 border-slate-200/60',
      searchRow: 'bg-[#fbfcfd] border-slate-200/80',
      searchInput: 'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
      divider: 'bg-slate-100',
      contentView: 'bg-white',
      itemRow: 'bg-slate-50 border-slate-200/50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900',
      itemRowActive: 'bg-black text-white border-black font-bold shadow-md shadow-black/10',
      itemTitle: 'text-slate-800',
      itemTitleActive: 'text-white',
      itemBadge: 'bg-slate-200 text-slate-600 font-medium',
      itemBadgeActive: 'bg-[#eee1ba] text-[#eee1ba]/10',
      textMuted: 'text-slate-500',
      headerToolbar: 'bg-white border-slate-200 text-slate-900 border-b border-slate-200 shadow-sm',
      canvasBg: 'bg-white border-slate-200/80 shadow-md',
      segment: 'bg-slate-100 border-slate-205',
      inactiveBtn: 'text-slate-500 hover:text-slate-900',
      activeBtn: 'bg-white text-slate-900 shadow-xs border-slate-250',
      brandBox: 'bg-[#eee1ba]/10 text-black',
      cardFooter: 'bg-slate-50/50 border-slate-100 text-slate-400',
      prose: 'prose-emerald prose-indigo',
    };
    if (readerTheme === 'vanilla') return {
      backdrop: 'bg-[#f4ecd8] text-[#5b4636]',
      aside: 'bg-[#eae3cb] border-[#dcceab] text-[#5b4636]',
      header: 'bg-[#e2dac0] border-[#ecdcb4]',
      tabContainer: 'bg-[#d5cca6] border-[#ecdcb4]',
      searchRow: 'bg-[#eae3cb] border-[#dcceab]',
      searchInput: 'bg-[#fcfaf2] border-[#dcceab] text-[#5b4636] placeholder-[#a6957a]',
      divider: 'bg-[#dcceab]',
      contentView: 'bg-[#eae3cb]',
      itemRow: 'bg-[#f4ecd8] border-[#e2dac0] hover:bg-[#fcfaf2] border-[#e0cb9d] text-[#8c745d] hover:text-[#5b4636]',
      itemRowActive: 'bg-black text-white border-black font-bold shadow-md shadow-black/10',
      itemTitle: 'text-[#5b4636]',
      itemTitleActive: 'text-white',
      itemBadge: 'bg-[#e3d8b9] text-[#8c745d] font-medium',
      itemBadgeActive: 'bg-[#eee1ba] text-[#eee1ba]/10',
      textMuted: 'text-[#a6957a]',
      headerToolbar: 'bg-[#fcfaf2] border-[#ecdcb4] text-[#5b4636] border-b border-[#ecdcb4]',
      canvasBg: 'bg-[#fdf6e3] text-[#5b4636] border-[#ecdcb4] shadow-md',
      segment: 'bg-[#eae3cb] border-[#dcceab]',
      inactiveBtn: 'text-[#8c745d] hover:text-[#5b4636]',
      activeBtn: 'bg-[#fdf6e3] text-[#5b4636] shadow-xs border-[#dcceab]',
      brandBox: 'bg-[#eae3cb] text-[#8c745d]',
      cardFooter: 'bg-[#f4ecd8]/60 border-[#eee1ba] text-[#8c745d]',
      prose: 'prose-emerald',
    };
    // midnight Theme
    return {
      backdrop: 'bg-[#0f1115] text-slate-100',
      aside: 'bg-[#0f1116] border-[#222938] text-slate-100',
      header: 'bg-[#151922] border-[#222938]',
      tabContainer: 'bg-[#0f1116] border-[#222938]',
      searchRow: 'bg-[#151922] border-[#222938]',
      searchInput: 'bg-[#0f1116] border-[#222938] text-white placeholder-slate-500',
      divider: 'bg-[#222938]',
      contentView: 'bg-[#0f1116]',
      itemRow: 'bg-[#151922] border-[#222938] hover:bg-[#1c2230] border-[#273248] text-slate-300 hover:text-white',
      itemRowActive: 'bg-black text-white border-black font-bold shadow-md shadow-black/10',
      itemTitle: 'text-slate-200',
      itemTitleActive: 'text-white',
      itemBadge: 'bg-[#1e2635] text-[#eee1ba]/40 font-medium',
      itemBadgeActive: 'bg-[#eee1ba] text-[#eee1ba]/10',
      textMuted: 'text-slate-400',
      headerToolbar: 'bg-[#151922] border-[#222938] text-white border-b border-[#222938] shadow-lg',
      canvasBg: 'bg-[#151922] text-slate-100 border-[#222938] shadow-md',
      segment: 'bg-[#0f1116] border-[#222938]',
      inactiveBtn: 'text-slate-400 hover:text-white',
      activeBtn: 'bg-[#1e2635] text-white shadow-xs border-[#222938]',
      brandBox: 'bg-[#1f2535] text-[#eee1ba]',
      cardFooter: 'bg-[#1b212f]/60 border-[#222938] text-slate-400',
      prose: 'prose-emerald prose-invert text-white',
    };
  }, [readerTheme]);

  // Sidebar Sorters & Filters
  const filteredPages = useMemo(() => {
    return pages.filter((page) =>
      page && (page.title || '').toLowerCase().includes(sidebarSearchQuery.toLowerCase())
    );
  }, [pages, sidebarSearchQuery]);

  const filteredIndices = useMemo(() => {
    return indices.filter((item) => {
      if (!item) return false;
      const ids = Array.isArray(item.linkedPage) 
        ? item.linkedPage 
        : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
      const pageTitles = ids.map((id) => pages.find((p) => p.id === id)?.title || '');
      const matchesTitle = (item.title || '').toLowerCase().includes(sidebarSearchQuery.toLowerCase());
      const matchesPageTitle = pageTitles.some((title) => title.toLowerCase().includes(sidebarSearchQuery.toLowerCase()));
      return matchesTitle || matchesPageTitle;
    });
  }, [indices, pages, sidebarSearchQuery]);

  // Pages currently aligned for canvas display rendering
  const pagesToRender = useMemo(() => {
    if (activeTab === 'pages') {
      const page = filteredPages[currentIndex];
      return page ? [page] : [];
    } else {
      if (viewingPageIds.length > 0) {
        return viewingPageIds
          .map(id => pages.find(p => p.id === id))
          .filter((p): p is PageItem => !!p);
      }
      return filteredPages;
    }
  }, [activeTab, filteredPages, currentIndex, viewingPageIds, pages]);

  const handlePageSelectWithScroll = useCallback((pageId: string) => {
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setViewingPageIds([pageId]);
    }
  }, [pages]);

  const handleIndexSelectWithScroll = useCallback((linkedPage: string | string[], linkedSectionId?: string) => {
    const linkedIds = Array.isArray(linkedPage)
      ? linkedPage
      : (typeof linkedPage === 'string' ? linkedPage.split(',').filter(Boolean) : [linkedPage].filter(Boolean));
    
    setViewingPageIds(linkedIds);
    if (linkedSectionId) {
      setTimeout(() => {
        const element = document.getElementById(linkedSectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] flex flex-col items-center justify-center pt-20">
        <div className="p-8 text-center max-w-sm rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15181e] shadow-xl">
          <BookOpen size={40} className="mx-auto text-[#eee1ba] animate-pulse mb-4" />
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Opening Library Reference...</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">Resolving your bookmarked document sequence elements safe & sound.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col pt-16 transition-colors duration-300 ${themeClasses.backdrop}`}>
      
      {/* Top Reading Module Header Bar */}
      <header id="nexus-bookmark-reader-top-toolbar" className={`min-h-[4rem] h-auto py-3 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-8 z-30 gap-4 ${themeClasses.headerToolbar}`}>
        <div className="flex items-center gap-3">
          <Link
            to="/bookmarks"
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              readerTheme === 'midnight'
                ? 'bg-[#1b212f] hover:bg-[#222a3d] border-[#222938] text-slate-400' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Back to Saved Bookmarks"
          >
            <ArrowLeft size={14} />
          </Link>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#eee1ba]/10 text-black border border-[#eee1ba]/25 dark:bg-black/20 dark:text-[#eee1ba] dark:border-black/30">
              🔖 Bookmarked Document Nexus Mode
            </span>
            <div className="flex items-center gap-2.5">
              {activeTab === 'pages' && filteredPages.length > 1 && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 select-none">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    className="p-1 text-slate-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-mono font-black px-1.5 text-slate-500 dark:text-slate-400 min-w-[36px] text-center">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(filteredPages.length).padStart(2, '0')}
                  </span>
                  <button
                    disabled={currentIndex === filteredPages.length - 1}
                    onClick={() => setCurrentIndex(Math.min(filteredPages.length - 1, currentIndex + 1))}
                    className="p-1 text-slate-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <h1 className="text-base font-black truncate max-w-md">
                {project ? project.title : 'Saved Compilation'}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Eye Fatigue Comfort Mode Theme Switchers */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 select-none items-center shrink-0">
            <button 
              onClick={() => setReaderTheme('slate')} 
              className={`p-1 px-2.5 rounded text-[9.5px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'slate' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white'}`}
              title="Slate light comfort design mode"
            >
              <Sun size={11} />
              <span className="hidden sm:inline">Slate</span>
            </button>
            <button 
              onClick={() => setReaderTheme('vanilla')} 
              className={`p-1 px-2.5 rounded text-[9.5px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'vanilla' ? 'bg-amber-100 hover:bg-amber-150 text-[#5b4636] shadow-xs' : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white'}`}
              title="Vanilla eye-strain mitigation custom paper pairing"
            >
              <Coffee size={11} />
              <span className="hidden sm:inline">Vanilla</span>
            </button>
            <button 
              onClick={() => setReaderTheme('midnight')} 
              className={`p-1 px-2.5 rounded text-[9.5px] font-black uppercase transition-all flex items-center gap-1 ${readerTheme === 'midnight' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white'}`}
              title="Midnight dark highcontrast mode"
            >
              <Moon size={11} />
              <span className="hidden sm:inline">Midnight</span>
            </button>
          </div>

          {/* Core Layout Division Mode Toggles */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner select-none shrink-0">
            <button
              onClick={() => {
                setActiveTab('pages');
                if (pages[currentIndex]) {
                  setViewingPageIds([pages[currentIndex].id]);
                }
              }}
              className={`py-1 px-3 rounded-lg font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'pages'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-655 dark:text-slate-350 hover:text-slate-900'
              }`}
            >
              <FileText size={11} />
              <span className="hidden sm:inline">Pages</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('index');
                setViewingPageIds([]);
              }}
              className={`py-1 px-3 rounded-lg font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'index'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-655 dark:text-slate-350 hover:text-slate-900'
              }`}
            >
              <LayoutList size={11} />
              <span className="hidden sm:inline">Index Based</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div id="nexus-bookmark-reader-layout-split" className="flex-grow flex relative overflow-hidden">
        
        {/* Left Sidebar Custom Navigation View */}
        {!isFullScreen && !isSidebarCollapsed && (
          <>
            {/* Click-to-dismiss mobile outline sidebar backdrop */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity cursor-pointer border-none outline-none p-0 m-0"
              title="Close outline drawer overlay"
            />
            <aside className={`nexus-responsive-aside border-r shadow-xs select-none ${themeClasses.aside}`}>
            
            {/* Realtime filter row */}
            <div className={`px-4 py-2 border-b flex items-center justify-between gap-1.5 ${themeClasses.searchRow}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeClasses.textMuted}`}>
                <Search size={11} /> Filter Outline
              </span>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className={`p-1 rounded bg-transparent hover:bg-slate-150/40 transition-all cursor-pointer flex-shrink-0 ${themeClasses.textMuted}`}
                title="Collapse Panel"
              >
                <ChevronLeft size={13} />
              </button>
            </div>

            <div className={`px-4 py-2.5 border-b ${themeClasses.searchRow}`}>
              <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={activeTab === 'pages' ? "Search page outlines..." : "Search index paths..."}
                  className={`w-full border focus:border-[#eee1ba] focus:ring-1 focus:ring-[#eee1ba]/20 rounded-lg py-1.5 pl-9 pr-8 text-[11.5px] outline-none transition-all ${themeClasses.searchInput}`}
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                />
                {sidebarSearchQuery && (
                  <button
                    onClick={() => setSidebarSearchQuery('')}
                    className="absolute right-2.5 p-0.5 hover:bg-slate-100 rounded-full text-slate-450"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar View Switcher & lists */}
            <div className={`flex-grow overflow-hidden flex flex-col ${themeClasses.contentView}`}>
              <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${themeClasses.header}`}>
                <div className={`flex-grow flex p-0.5 rounded-lg border shadow-inner ${themeClasses.tabContainer}`}>
                  <button
                    onClick={() => {
                      setActiveTab('pages');
                      setSidebarSearchQuery('');
                    }}
                    className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                      activeTab === 'pages'
                        ? 'bg-black text-white shadow-xs'
                        : `${themeClasses.textMuted} hover:text-slate-900`
                    }`}
                  >
                    <FileText size={11} />
                    <span>Pages</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('index');
                      setSidebarSearchQuery('');
                    }}
                    className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                      activeTab === 'index'
                        ? 'bg-black text-white shadow-xs'
                        : `${themeClasses.textMuted} hover:text-slate-900`
                    }`}
                  >
                    <LayoutList size={11} />
                    <span>Index</span>
                  </button>
                </div>
              </div>

              {/* Layout Content Items List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {activeTab === 'pages' && (
                  <div className="space-y-2">
                    <div 
                      onClick={() => setIsPagesCollapsed(!isPagesCollapsed)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/50 cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#a6957a] flex items-center gap-1.5">
                        {isPagesCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        Documentation Pages
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${themeClasses.itemBadge}`}>{filteredPages.length}</span>
                    </div>

                    {!isPagesCollapsed && (
                      filteredPages.length === 0 ? (
                        <div className={`text-center py-6 rounded-xl border border-dashed text-slate-450 ${themeClasses.itemRow}`}>
                          <p className="text-[11px] font-medium font-sans">No matching pages found</p>
                        </div>
                      ) : (
                        filteredPages.map((page, idx) => {
                          const isCurrent = filteredPages[currentIndex]?.id === page.id;
                          const pageDisplayNumber = String(idx + 1).padStart(2, '0');

                          return (
                            <div
                              key={page.id || `page-side-${idx}`}
                              onClick={() => handlePageSelectWithScroll(page.id)}
                              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                                isCurrent ? themeClasses.itemRowActive : themeClasses.itemRow
                              }`}
                            >
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded leading-none ${
                                isCurrent ? themeClasses.itemBadgeActive : themeClasses.itemBadge
                              }`}>
                                Page {pageDisplayNumber}
                              </span>

                              <span className={`text-[11.5px] font-semibold truncate flex-grow ml-3 text-left ${
                                isCurrent ? themeClasses.itemTitleActive : themeClasses.itemTitle
                              }`}>
                                {page.title}
                              </span>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                )}

                {activeTab === 'index' && (
                  <div className="space-y-2">
                    <div 
                      onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/50 cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#a6957a] flex items-center gap-1.5">
                        {isIndexCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        Combined Indices
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${themeClasses.itemBadge}`}>{filteredIndices.length}</span>
                    </div>

                    {!isIndexCollapsed && (
                      filteredIndices.length === 0 ? (
                        <div className={`text-center py-10 rounded-xl border border-dashed ${themeClasses.itemRow}`}>
                          <LayoutList size={22} className="mx-auto text-slate-300 mb-1.5" />
                          <p className="text-[11px] font-medium">No index maps configured</p>
                        </div>
                      ) : (
                        filteredIndices.map((item, indexIdx) => {
                          const sequentialNumber = String(indexIdx + 1).padStart(2, '0');
                          
                          const pageIds = Array.isArray(item.linkedPage)
                            ? item.linkedPage
                            : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
                          const mappedTitles = pageIds.map((id) => pages.find((p) => p.id === id)?.title || 'Unnamed Page');
                          const linkedBreadcrumb = mappedTitles.join(' ➔ ');
                          
                          const isCurrent = filteredPages[currentIndex]?.id && pageIds.includes(filteredPages[currentIndex].id);

                          return (
                            <div
                              key={item.id || `idx-side-${indexIdx}`}
                              onClick={() => handleIndexSelectWithScroll(item.linkedPage, item.linkedSectionId)}
                              className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                                isCurrent ? themeClasses.itemRowActive : themeClasses.itemRow
                              }`}
                            >
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded leading-none mt-0.5 select-none ${
                                isCurrent ? themeClasses.itemBadgeActive : themeClasses.itemBadge
                              }`}>
                                Idx {sequentialNumber}
                              </span>

                              <div className="flex-grow min-w-0">
                                <div className={`text-[12px] font-bold truncate tracking-tight ${
                                  isCurrent ? themeClasses.itemTitleActive : themeClasses.itemTitle
                                }`}>
                                  {item.title}
                                </div>
                                {linkedBreadcrumb && (
                                  <div className={`text-[9.5px] truncate mt-1 font-medium flex items-center gap-1 ${
                                    isCurrent ? 'text-[#eee1ba]/15' : 'opacity-80'
                                  }`}>
                                    <span className={`text-[8px] px-1 py-0.5 rounded leading-none font-bold ${
                                      isCurrent ? 'bg-[#eee1ba] text-[#eee1ba]/10' : themeClasses.itemBadge
                                    }`}>Path</span>
                                    <span className="truncate">{linkedBreadcrumb}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                )}

              </div>
            </div>

          </aside>
          </>
        )}

        {/* Leftmost Sidebar Expanded/Collapsed trigger rail */}
        {!isFullScreen && isSidebarCollapsed && (
          <div className={`w-14 shrink-0 border-r hidden lg:flex flex-col items-center py-4 gap-4 h-full ${themeClasses.aside}`}>
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 rounded-xl bg-[#eee1ba]/10 dark:bg-black hover:bg-[#eee1ba]/15 text-black font-bold transition-all flex items-center justify-center cursor-pointer"
              title="Expand Navigation Outlines"
            >
              <ChevronRight size={15} />
            </button>
            <div className={`w-full h-px ${themeClasses.divider}`} />
            <button
              onClick={() => {
                setActiveTab('pages');
                setIsSidebarCollapsed(false);
              }}
              className={`p-2 rounded-xl transition-all ${
                activeTab === 'pages' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
              }`}
              title="View Pages"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={() => {
                setActiveTab('index');
                setIsSidebarCollapsed(false);
              }}
              className={`p-2 rounded-xl transition-all ${
                activeTab === 'index' ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
              }`}
              title="View Combined Index"
            >
              <LayoutList size={16} />
            </button>
          </div>
        )}

        {/* Central Reading Canvas Container */}
        <main className={`flex-grow flex flex-col relative z-10 transition-colors duration-300 overflow-hidden`}>
          <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto pb-32 space-y-6">
              
              {/* Toolbar Actions Placement Box inside viewport */}
              <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${themeClasses.canvasBg}`}>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className={`p-2.5 rounded-xl ${themeClasses.brandBox}`}>
                    <Bookmark size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {project ? project.title : 'Overview'}
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Distraction-Free Immersion Layout
                    </p>
                  </div>
                </div>

                {/* Right side controls (Fullscreen mode toggles) */}
                <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                  {project && project.owner && (
                    <div className="flex items-center gap-3 mr-3 text-[10px] font-bold text-slate-450 uppercase border-r pr-3 select-none">
                      <span className="flex items-center gap-1"><User size={12} /> {project.owner.split('@')[0]}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`p-2 rounded-xl border transition-all ${
                      isFullScreen
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-600'
                        : 'bg-slate-50 dark:bg-[#1f242e] border-[#dcceab] text-slate-500 hover:bg-slate-100'
                    }`}
                    title={isFullScreen ? "Minimize reader view" : "Enter fullscreen immersive writing canvas"}
                  >
                    {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>

              {/* Rendering canvas page pagesToRender sequence */}
              {pagesToRender.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-[#151922] rounded-3xl border border-dashed border-slate-200 dark:border-[#222938] p-8 shadow-md">
                  <FileText size={32} className="mx-auto text-[#eee1ba] mb-3" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">Documentation Empty</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">This public portal has currently no published documentation sequences inside its outline sheets.</p>
                </div>
              ) : (
                pagesToRender.map((page, pIdx) => (
                  <motion.div 
                    key={page.id || `doc-read-${pIdx}`} 
                    id={page.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative group/page rounded-2xl border transition-all overflow-hidden ${themeClasses.canvasBg}`}
                  >
                    <div className="p-8">
                      {/* Interactive Header for each document canvas block */}
                      <div className="border-b pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 text-[9px] uppercase tracking-wider font-extrabold text-[#5b4636]/60 dark:text-[#eee1ba]">
                            <Bookmark size={9} className="fill-current" />
                            Saved Reference Item
                          </div>
                          <h2 className="text-lg font-black tracking-tight">{page.title}</h2>
                          {page.createdAt && (
                            <p className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5 select-none font-semibold">
                              <Calendar size={10} /> Published {new Date(page.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <Editor 
                        content={page.content || ''}
                        onChange={() => {}}
                        readOnly={true}
                        placeholder=""
                        className={`${themeClasses.prose}`}
                        listingId={project?.id}
                        pageId={page.id}
                      />
                    </div>

                    {/* Canvas Item Segment visual boundary line */}
                    <div className={`p-4 border-t flex justify-between items-center text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${themeClasses.cardFooter}`}>
                      <span>{page.title} — Page {pages.findIndex(p => p.id === page.id) + 1} Boundary</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono">Doc-Nexus Saved Reference</span>
                    </div>
                  </motion.div>
                ))
              )}

            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default DocumentNexusBookmarkReader;
