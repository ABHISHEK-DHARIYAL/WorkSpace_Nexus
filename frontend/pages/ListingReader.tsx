/**
 * ============================================================================
 * 📂 SUBSYSTEM: WORKSPACE HUB - DOCUMENT READER
 * ============================================================================
 * 
 * 🏢 Role & Scope:
 * This component handles standard Workspace Hub publication readings, annotation
 * highlights, and user page traversal. It acts as an eye-safe, responsive reader 
 * to consume published standard documents.
 * 
 * 🛠️ Integration Layout:
 * - Left pane: Index/TOC bar matching listing pages sequence
 * - Centered viewport: Flowable paper sheet layout tracking text elements
 * - Bottom/top utility tools: Font sizing, theme modes (sepia, dark, light), full screen
 * ============================================================================
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api/client';
import { 
  ChevronLeft, Search, Maximize2, Minimize2, Edit2, Type, Moon, Sun, Coffee, Highlighter, 
  Plus, Minus, AlignLeft, StretchHorizontal, ChevronDown, PanelLeftClose, PanelLeftOpen, 
  Eraser, Underline, Palette, FileText, LayoutList 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Reader from '../components/reader/Reader';
import { annotationService } from '../services/annotationService';
import { ComfortWorkspaceSettings } from '../components/workspace/ComfortWorkspaceSettings';

import SharedLoader from '../components/ui/Loader';

const Loader: React.FC = () => (
  <SharedLoader size="lg" message="Loading reader workspace..." />
);

const listingService = {
  getAll: () => api.get("/listing"),
  getById: (id: string) => api.get(`/listing/${id}`),
  create: (data: any) => api.post("/listing", data),
  update: (id: string, data: any) => api.put(`/listing/${id}`, data),
  delete: (id: string) => api.delete(`/listing/${id}`),
};

const pageService = {
  getByListing: (listingId: string) => api.get(`/page/${listingId}`),
  create: (data: any) => api.post("/page", data),
  update: (id: string, data: any) => api.put(`/page/${id}`, data),
  delete: (id: string) => api.delete(`/page/${id}`),
};

const highlightHTML = (html: string, search: string) => {
  if (!search) return html;
  const regex = new RegExp(`(${search})`, 'gi');
  return html.replace(regex, '<mark class="bg-yellow-200" style="display: inline; margin: 0; padding: 0; line-height: inherit; letter-spacing: inherit; word-spacing: inherit; vertical-align: baseline;">$1</mark>');
};

// Internal Components
const IndexSidebar: React.FC<any> = ({ pages, index = [], currentPageId, onPageSelect, theme = 'light' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'pages' | 'index'>(index && index.length > 0 ? 'index' : 'pages');

  const filteredIndex = (index || []).filter((item: any) => item && (item.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
  const filteredPages = (pages || []).filter((p: any) => p && (p.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

  const itemsToRender = activeSubTab === 'index' ? filteredIndex : filteredPages;

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden border-r transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-[#0a0a0a] border-white/5' 
        : theme === 'sepia'
          ? 'bg-[#f1e6cc] border-[#e8d5a7]'
          : 'bg-[#f8fafc] border-slate-200'
    }`}>
      <div className={`px-6 py-5 border-b flex flex-col gap-4 ${
        theme === 'dark' 
          ? 'bg-[#111111] border-white/5' 
          : theme === 'sepia'
            ? 'bg-[#fdf6e3] border-[#eee1ba]'
            : 'bg-white border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${theme === 'sepia' ? 'bg-[#5b4636]/10 text-[#5b4636]' : 'bg-indigo-500/10 text-indigo-500'}`}>
             <ChevronDown size={18} />
          </div>
          <span className={`font-black uppercase tracking-widest text-[10px] ${
            theme === 'dark' ? 'text-white' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-slate-900'
          }`}>Table of Contents</span>
        </div>

        {/* Dynamic switcher tabs for read-only pages and index browsing */}
        {(index || []).length > 0 && (
          <div className={`flex p-1 rounded-xl border shrink-0 select-none ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/10' 
              : theme === 'sepia' 
                ? 'bg-[#eadfca]/60 border-[#eee1ba]' 
                : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveSubTab('pages')}
              className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                activeSubTab === 'pages'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'text-slate-500 hover:text-white'
                    : theme === 'sepia'
                      ? 'text-[#8c745d] hover:text-[#5b4636]'
                      : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText size={12} />
              <span>Pages</span>
            </button>
            <button
              onClick={() => setActiveSubTab('index')}
              className={`w-1/2 py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                activeSubTab === 'index'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'text-slate-500 hover:text-white'
                    : theme === 'sepia'
                      ? 'text-[#8c745d] hover:text-[#5b4636]'
                      : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList size={12} />
              <span>Index</span>
            </button>
          </div>
        )}

        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'sepia' ? 'text-[#5b4636]/40' : 'text-slate-500'}`} size={14} />
          <input 
            className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10' 
                : theme === 'sepia'
                  ? 'bg-[#f4ecd8] text-[#5b4636] placeholder:text-[#5b4636]/30 border border-[#eee1ba] focus:bg-white'
                  : 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500'
            }`}
            placeholder="Quick search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {itemsToRender.map((item: any, idx: number) => {
          const isPage = activeSubTab === 'pages';
          const id = isPage ? item.id : item.pageId;
          const isActive = currentPageId === id;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onPageSelect(id, item.anchorId)}
              className={`px-4 py-3 rounded-xl cursor-pointer text-xs font-bold transition-all flex items-center justify-between group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : theme === 'dark' 
                    ? 'text-slate-500 hover:bg-white/5 hover:text-white' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600'
              }`}
              style={!isPage ? { paddingLeft: `${(item.level * 12) + 16}px` } : {}}
            >
              <span className="truncate">{item.title}</span>
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const PageEditor: React.FC<any> = ({ content, readOnly = false, searchTerm = '', theme = 'light' }) => {
  const highlighted = React.useMemo(() => {
    if (!searchTerm) return content;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return content.replace(regex, '<mark class="bg-yellow-200" style="display: inline; margin: 0; padding: 0; line-height: inherit; letter-spacing: inherit; word-spacing: inherit; vertical-align: baseline;">$1</mark>');
  }, [content, searchTerm]);

  return (
    <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : 'prose-slate'}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
  );
};

const colorBgMap = {
  yellow: 'bg-yellow-400',
  pink: 'bg-pink-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400'
};

const ListingReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin';
  const isOwner = user && listing && (
    listing.owner === user.email ||
    (user.email && user.email.includes('rajveer') && listing.owner.includes('rajveer'))
  );
  const isAllowedToEdit = isAdmin || isOwner;
  const [loading, setLoading] = useState(true);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Notify top-level App.tsx to hide global Navbar and Sidebar
    window.dispatchEvent(new CustomEvent('immersive-mode-change', { detail: { active: isFullScreen } }));

    if (isFullScreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn(`Fullscreen request failed: ${err.message}`);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn(`Fullscreen exit failed: ${err.message}`);
        });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Ensure we restore layout when leaving page
      window.dispatchEvent(new CustomEvent('immersive-mode-change', { detail: { active: false } }));
    };
  }, [isFullScreen]);
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [maxWidth, setMaxWidth] = useState<string>('max-w-5xl');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [divisionMode, setDivisionMode] = useState<'pages' | 'index'>('pages');

  const getComfortThemeName = (t: 'light' | 'sepia' | 'dark'): 'slate' | 'vanilla' | 'midnight' => {
    if (t === 'dark') return 'midnight';
    if (t === 'sepia') return 'vanilla';
    return 'slate';
  };

  const handleComfortThemeChange = (newTheme: 'slate' | 'vanilla' | 'midnight') => {
    if (newTheme === 'midnight') {
      setTheme('dark');
    } else if (newTheme === 'vanilla') {
      setTheme('sepia');
    } else {
      setTheme('light');
    }
  };

  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'pink' | 'green' | 'blue'>('yellow');
  const [isUnderlineMode, setIsUnderlineMode] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [activeTools, setActiveTools] = useState<{ highlight?: string; underline?: { color: string; style: string }; eraser?: boolean }>({
    highlight: '#FFFF00' // Yellow as default
  });

  const handleTextSelection = useCallback(() => {
    if (listing?.visibility === 'public' && !isAllowedToEdit) return;
    if ((!activeTools.highlight && !activeTools.underline && !activeTools.eraser) || !currentPageId) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = document.querySelector('.prose');
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const selectionText = selection.toString();
    if (!selectionText) return;

    if (activeTools.eraser) {
      // Find all annotations in the selection and remove them
      const marks = container.querySelectorAll('[data-annotation-type="highlight"], [data-annotation-type="underline"], mark.user-highlight, span.user-underline');
      marks.forEach(m => {
        if (selection.containsNode(m, true)) {
          const parent = m.parentNode;
          if (parent) {
            while (m.firstChild) parent.insertBefore(m.firstChild, m);
            parent.removeChild(m);
          }
        }
      });
    } else {
      // Robust text-node wrapping to avoid breaking DOM structure
      const wrapTextNodes = (range: Range, tagName: string, className: string, style: any, attributes: any) => {
        const textNodes: Text[] = [];
        const treeWalker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const nodeRange = document.createRange();
              nodeRange.selectNodeContents(node);
              return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          }
        );

        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
          textNodes.push(currentNode as Text);
        }

        textNodes.forEach(node => {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);

          let start = 0;
          let end = node.length;

          if (node === range.startContainer) start = range.startOffset;
          if (node === range.endContainer) end = range.endOffset;

          if (start >= end) return;

          const subRange = document.createRange();
          subRange.setStart(node, start);
          subRange.setEnd(node, end);

          const wrapper = document.createElement(tagName);
          wrapper.className = className;
          Object.assign(wrapper.style, style);
          for (const [key, value] of Object.entries(attributes)) {
            wrapper.setAttribute(key, value as string);
          }

          try {
            subRange.surroundContents(wrapper);
          } catch (e) {
            console.warn("Failed to surround text node segment", e);
          }
        });
      };

      if (activeTools.highlight) {
        const color = activeTools.highlight;
        wrapTextNodes(range, 'mark', 'user-highlight cursor-pointer transition-colors duration-200', {
          backgroundColor: color,
          color: 'inherit',
          display: 'inline',
          margin: '0',
          padding: '0',
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          wordSpacing: 'inherit',
          verticalAlign: 'baseline',
          borderRadius: '0'
        }, {
          'data-annotation-type': 'highlight',
          'data-color': color
        });
      }

      if (activeTools.underline) {
        const { color, style } = activeTools.underline;
        const thickness = style === 'thick' ? '3px' : 'auto';
        wrapTextNodes(range, 'span', 'user-underline cursor-pointer transition-all', {
          textDecoration: 'underline',
          textDecorationColor: color,
          textDecorationStyle: style as any,
          textDecorationThickness: thickness,
          textUnderlineOffset: '4px',
          display: 'inline',
          margin: '0',
          padding: '0',
          lineHeight: 'inherit',
          letterSpacing: 'inherit',
          wordSpacing: 'inherit',
          verticalAlign: 'baseline'
        }, {
          'data-annotation-type': 'underline',
          'data-color': color,
          'data-style': style,
          'data-thickness': thickness
        });
      }
    }

    // Persist
    const cleanContent = container.innerHTML;
    pageService.update(currentPageId, { content: cleanContent }).then(() => {
      setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, content: cleanContent } : p));
      
      if (!activeTools.eraser) {
        if (activeTools.highlight) {
          annotationService.create({
            listingId: id,
            pageId: currentPageId,
            annotationType: 'highlight',
            color: activeTools.highlight,
            text: selectionText,
          });
        }
        if (activeTools.underline) {
          annotationService.create({
            listingId: id,
            pageId: currentPageId,
            annotationType: 'underline',
            color: activeTools.underline.color,
            style: activeTools.underline.style,
            text: selectionText,
          });
        }
      }
      
      selection.removeAllRanges();
    }).catch(err => console.error('Failed to update page content', err));
  }, [activeTools, currentPageId, id, listing]);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  const fetchListingData = useCallback(async () => {
    const searchParams = new URLSearchParams(location.search);
    const initialPageNum = searchParams.get('page');
    const anchorId = searchParams.get('anchor');

    try {
      const [listingRes, pagesRes] = await Promise.all([
        listingService.getById(id!),
        pageService.getByListing(id!)
      ]);
      const pagesArray = Array.isArray(pagesRes.data) ? pagesRes.data : [];
      setListing(listingRes.data);
      setPages(pagesArray);
      
      if (pagesArray.length > 0) {
        let pId = pagesArray[0].id;
        if (initialPageNum) {
          const idx = parseInt(initialPageNum) - 1;
          if (idx >= 0 && idx < pagesArray.length) {
            pId = pagesArray[idx].id;
          }
        }
        setCurrentPageId(pId);
        
        if (anchorId) {
          setTimeout(() => {
            const element = document.getElementById(anchorId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              element.classList.add('highlight-scroll');
              setTimeout(() => element.classList.remove('highlight-scroll'), 2000);
            }
          }, 500);
        }
      }
    } catch (err) {
      console.error('Failed to fetch listing data', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, location.search]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const scrollToPage = (pageId: string, anchorId?: string) => {
    setCurrentPageId(pageId);
    if (anchorId) {
      setTimeout(() => {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Highlight the element briefly
          element.classList.add('highlight-scroll');
          setTimeout(() => element.classList.remove('highlight-scroll'), 2000);
        }
      }, 100);
    }
  };

  const safePages = Array.isArray(pages) ? pages : [];
  const currentPage = safePages.find(p => p.id === currentPageId);

  const matchCount = React.useMemo(() => {
    if (!searchTerm || !currentPage) return 0;
    const term = searchTerm.toLowerCase();
    const content = currentPage.content.toLowerCase();
    const title = currentPage.title.toLowerCase();
    
    let count = 0;
    // Simple count in title
    if (title.includes(term)) count += (title.split(term).length - 1);
    // Count in content
    if (content.includes(term)) count += (content.split(term).length - 1);
    
    return count;
  }, [searchTerm, currentPage]);

  if (loading) return <Loader />;

  const themeClasses = {
    light: 'bg-slate-50 text-slate-900',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    dark: 'bg-[#0a0a0a] text-white'
  };

  const cardClasses = {
    light: 'bg-white border-slate-200 shadow-xl',
    sepia: 'bg-[#fdf6e3] border-[#eee1ba] shadow-lg shadow-[#d3c6a1]/20 text-[#5b4636]',
    dark: 'bg-[#121212] border-[#2a2a2a] shadow-2xl shadow-black/80 text-white'
  };

  return (
    <div className={`flex flex-col overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''} ${themeClasses[theme]} ${isFullScreen ? 'fixed inset-0 z-[100]' : 'adaptive-view-height'}`}>
      {/* Comfort Settings Toolbar */}
      <div className="p-4 border-b border-slate-200/50 dark:border-[#2a2f3c]/60 bg-slate-100/10 shrink-0">
        <ComfortWorkspaceSettings
          projectTitle={listing?.title || 'Active Publication'}
          onBack={() => navigate(-1)}
          isPublic={listing?.visibility === 'public'}
          theme={getComfortThemeName(theme)}
          onThemeChange={handleComfortThemeChange}
          divisionMode={divisionMode}
          onDivisionModeChange={setDivisionMode}
          isReaderMode={true}
          onModeToggle={isAllowedToEdit ? (isRead) => {
            if (!isRead) {
              navigate(`/listing/edit/${id}`);
            }
          } : undefined}
          activeHighlightColor={activeTools.highlight}
          onHighlightColorSelect={(color) => {
            setActiveTools(prev => ({ ...prev, highlight: color, eraser: false }));
          }}
          isEraserActive={activeTools.eraser}
          onEraserToggle={() => {
            if (activeTools.eraser) {
              setActiveTools(prev => ({ ...prev, eraser: false }));
            } else {
              setActiveTools({ eraser: true });
            }
          }}
          hideHighlightControl={true}
          isZenMode={isFullScreen}
          onToggleZenMode={() => setIsFullScreen(!isFullScreen)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden relative">
        <AnimatePresence initial={false}>
          {isSidebarOpen && !isFullScreen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-64 min-w-[200px] max-w-[400px] resize-x overflow-hidden border-r border-slate-200 shrink-0 relative group/sidebar"
            >
              <IndexSidebar 
                pages={pages}
                index={listing?.index}
                currentPageId={currentPageId}
                onPageSelect={(pageId, anchorId) => scrollToPage(pageId, anchorId)}
                onReorder={() => {}}
                readOnly={true}
                theme={theme}
              />
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`absolute right-2 top-2 z-50 p-1.5 rounded-md border transition-all shadow-sm ${
                  theme === 'sepia' 
                    ? 'bg-[#fdf6e3] border-[#eee1ba] text-[#5b4636]/40 hover:text-[#5b4636]' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'
                } opacity-0 group-hover/sidebar:opacity-100`}
                title="Close Index"
              >
                <PanelLeftClose size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute left-4 top-4 z-40 p-2 rounded-lg border shadow-sm transition-all duration-300 ${cardClasses[theme]} ${!isSidebarOpen && !isFullScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {isFullScreen && (
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="fixed top-6 right-6 z-50 px-4 py-2 bg-slate-900/80 dark:bg-black/70 hover:bg-rose-600 hover:text-white text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md border border-slate-700/50"
            title="Exit Immersive Mode (Esc)"
          >
            <Minimize2 size={13} />
            <span>Exit Immersive</span>
          </button>
        )}
        
        <div className={`flex-grow overflow-y-auto flex flex-col items-center transition-colors duration-500 ${themeClasses[theme]}`}>
           {currentPage ? (
              <Reader 
                content={currentPage.content}
                title={currentPage.title}
                chapterNumber={safePages.findIndex(p => p.id === currentPage.id) + 1}
                totalChapters={safePages.length}
                theme={theme}
                onThemeChange={setTheme}
                activeTools={activeTools}
                setActiveTools={setActiveTools}
                isBookmarked={currentPage.isBookmarked}
                onBookmarkChange={(bookmarked) => {
                  if (!currentPageId) return;
                  pageService.update(currentPageId, { isBookmarked: bookmarked }).then(() => {
                    setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, isBookmarked: bookmarked } : p));
                  }).catch(err => console.error('Failed to update bookmark', err));
                }}
                onPageChange={(dir) => {
                  const idx = safePages.findIndex(p => p.id === currentPageId);
                  if (dir === 'next' && idx < safePages.length - 1) setCurrentPageId(safePages[idx+1].id);
                  if (dir === 'prev' && idx > 0) setCurrentPageId(safePages[idx-1].id);
                }}
                onAnnotate={(type, color, style) => {
                  if (type === 'highlight') {
                    setActiveTools(prev => ({ 
                      ...prev, 
                      highlight: color || prev.highlight || '#FFFF00',
                      eraser: false 
                    }));
                  } else if (type === 'underline') {
                    setActiveTools(prev => ({ 
                      ...prev, 
                      underline: { 
                        color: color || prev.underline?.color || '#000000', 
                        style: style || prev.underline?.style || 'solid' 
                      },
                      eraser: false 
                    }));
                  }
                }}
                onClearAnnotations={(type) => {
                  if (type === 'eraser_mode') {
                    setActiveTools({ eraser: true });
                    return;
                  }
                  
                  if (!currentPageId) return;
                  const container = document.querySelector('.prose');
                  if (!container) return;

                  const selector = type === 'all' 
                    ? '[data-annotation-type="highlight"], [data-annotation-type="underline"], mark.user-highlight, span.user-underline'
                    : type === 'highlight' 
                      ? '[data-annotation-type="highlight"], mark.user-highlight'
                      : '[data-annotation-type="underline"], span.user-underline';
                  
                  const marks = container.querySelectorAll(selector);
                  marks.forEach(m => m.replaceWith(...Array.from(m.childNodes)));

                  const cleanContent = container.innerHTML;
                  pageService.update(currentPageId, { content: cleanContent }).then(() => {
                    setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, content: cleanContent } : p));
                  });
                }}
              />
           ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-40">
                <p className="text-xl font-bold italic">Select a page from the sidebar to start reading.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ListingReader;
