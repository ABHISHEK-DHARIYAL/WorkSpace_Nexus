/**
 * ============================================================================
 * 📂 SUBSYSTEM: WORKSPACE HUB - LISTING METADATA EDITOR
 * ============================================================================
 * 
 * 🏢 Role & Scope:
 * This component handles editing metadata and pages of standard listings in the
 * Workspace Hub. Unlike the multi-page Document Nexus canvas, this is focused on
 * core structural listing pages, description data, visibility rules, and tagging.
 * 
 * 🛠️ Key Associated Assets:
 * - EditorSidebar: Index and page sequencing sidebar
 * - EditorStats: High-level word count, reading time, and metadata metrics
 * ============================================================================
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api/client';
import { 
  ChevronLeft, CheckCircle2, Trash2, Maximize2, Minimize2, BookOpen,
  PanelLeftClose, PanelLeftOpen, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '../components/editor/Editor';

// Import split modular components
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { EditorStats } from '../components/editor/EditorStats';
import { ComfortWorkspaceSettings } from '../components/workspace/ComfortWorkspaceSettings';

import SharedLoader from '../components/ui/Loader';

const Loader: React.FC = () => (
  <SharedLoader size="lg" message="Loading editor controls..." />
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

const ListingEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, characters: 0, readingTime: 0 });

  useEffect(() => {
    // Notify top-level App.tsx to hide global Navbar and Sidebar
    window.dispatchEvent(new CustomEvent('immersive-mode-change', { detail: { active: isZenMode } }));

    if (isZenMode) {
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
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isZenMode) {
        setIsZenMode(false);
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
  }, [isZenMode]);

  // Comfort layout & eyecare settings states
  const [readerTheme, setReaderTheme] = useState<'slate' | 'vanilla' | 'midnight'>('slate');
  const [divisionMode, setDivisionMode] = useState<'pages' | 'index'>('pages');
  const [activeHighlightColor, setActiveHighlightColor] = useState('#FFFF00');
  const [isEraserActive, setIsEraserActive] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleVisibility = async () => {
    if (!listing) return;
    const newVisibility = listing.visibility === 'public' ? 'private' : 'public';
    try {
      await listingService.update(listing.id, { visibility: newVisibility });
      setListing({ ...listing, visibility: newVisibility });
    } catch (err) {
      alert('Failed to update visibility');
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
    };
  }, []);

  const fetchListingData = useCallback(async () => {
    try {
      const [listingRes, pagesRes] = await Promise.all([
        listingService.getById(id!),
        pageService.getByListing(id!)
      ]);
      const pagesArray = Array.isArray(pagesRes.data) ? pagesRes.data : [];
      setListing(listingRes.data);
      setPages(pagesArray);
      if (pagesArray.length > 0) {
        setCurrentPageId(pagesArray[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch listing data', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const safePages = Array.isArray(pages) ? pages : [];
  const currentPage = safePages.find((p) => p.id === currentPageId);

  const handlePageAdd = async () => {
    try {
      const currentPagesArr = Array.isArray(pages) ? pages : [];
      const { data } = await pageService.create({
        listingId: id,
        title: 'Untitled Page',
        content: '',
        pageNumber: currentPagesArr.length
      });
      setPages([...currentPagesArr, data]);
      setCurrentPageId(data.id);
    } catch (err) {
      alert('Failed to add page');
    }
  };

  const handlePageDelete = async (pageId: string) => {
    setDeleteConfirmId(pageId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await pageService.delete(deleteConfirmId);
      const newPages = pages.filter(p => p.id !== deleteConfirmId);
      setPages(newPages);
      if (currentPageId === deleteConfirmId) {
        setCurrentPageId(newPages.length > 0 ? newPages[0].id : null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed. Please try again.');
    }
  };

  const handlePageUpdate = async (content: string) => {
    if (!currentPageId) return;
    
    // Optimistic UI update for content
    const updatedPages = pages.map(p => 
      p.id === currentPageId ? { ...p, content } : p
    );
    setPages(updatedPages);

    // Auto-save logic with 1 second debounce
    setSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const idToSave = currentPageId;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await pageService.update(idToSave, { content });
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const handlePageRename = async (id: string, title: string) => {
    if (!id) return;
    const updatedPages = pages.map(p => 
      p.id === id ? { ...p, title } : p
    );
    setPages(updatedPages);

    setSaving(true);
    if (renameTimeoutRef.current) {
      clearTimeout(renameTimeoutRef.current);
    }

    renameTimeoutRef.current = setTimeout(async () => {
      try {
        await pageService.update(id, { title });
        setLastSaved(new Date());
      } catch (err) {
        console.error('Title save failed', err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const handleReorder = async (newPages: any[]) => {
    setPages(newPages);
    // Ideally update pageNumbers in backend for all changed pages
    // For now we just sync local state, would need a bulk update endpoint or sequential calls
  };

  if (loading) return <Loader />;

  return (
    <div className={`flex flex-col overflow-hidden ${isZenMode ? 'fixed inset-0 z-[100]' : 'adaptive-view-height'} ${
      readerTheme === 'midnight' 
        ? 'bg-[#0a0f1d] text-slate-100' 
        : readerTheme === 'vanilla' 
          ? 'bg-[#f4ecd8] text-[#5b4636]' 
          : 'bg-slate-50 text-slate-800'
    } transition-all duration-300`}>
      {/* Delete Confirmation Modal - Moved to Top Level */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Page?</h3>
              <p className="text-slate-500 mb-10 font-medium">This action cannot be undone. All content on this page will be permanently removed.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-grow py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-grow py-3 px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comfort Settings Toolbar moved above BOTH the sidebar and editor layout area */}
      <div className="p-4 border-b border-slate-200/50 dark:border-[#2a2f3c]/60 bg-slate-100/10 shrink-0">
        <ComfortWorkspaceSettings
          projectTitle={listing?.title || 'Active Outline'}
          isPublic={listing?.visibility === 'public'}
          onToggleVisibility={handleToggleVisibility}
          theme={readerTheme}
          onThemeChange={setReaderTheme}
          divisionMode={divisionMode}
          onDivisionModeChange={setDivisionMode}
          isReaderMode={false}
          onModeToggle={(isRead) => {
            if (isRead) {
              navigate(`/listing/read/${id}`);
            }
          }}
          onBack={() => navigate(-1)}
          activeHighlightColor={activeHighlightColor}
          onHighlightColorSelect={setActiveHighlightColor}
          isEraserActive={isEraserActive}
          onEraserToggle={() => setIsEraserActive(!isEraserActive)}
          hideHighlightControl={true}
          onAddPage={handlePageAdd}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
        />
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        {!isZenMode && isSidebarOpen && (
          <div className="w-64 min-w-[200px] max-w-[400px] resize-x overflow-hidden border-r border-slate-200">
            <EditorSidebar 
              pages={pages}
              currentPageId={currentPageId}
              onPageSelect={(id) => setCurrentPageId(id)}
              onPageAdd={handlePageAdd}
              onPageDelete={handlePageDelete}
              onPageRename={handlePageRename}
              onReorder={handleReorder}
              onToggleSidebar={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {/* Editor Area */}
        <div className={`flex-grow relative overflow-hidden flex flex-col transition-colors duration-500 ${
          readerTheme === 'midnight' 
            ? 'bg-[#0a0f1d] text-slate-100' 
            : readerTheme === 'vanilla' 
              ? 'bg-[#f4ecd8] text-[#5b4636]' 
              : 'bg-slate-50 text-slate-800'
        }`}>
          <div className="flex-grow overflow-y-auto relative">
            {!isSidebarOpen && !isZenMode && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute left-6 top-6 z-40 p-3 bg-white/95 dark:bg-[#15181e]/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-[#2d323f]/80 shadow-lg text-slate-500 hover:text-indigo-605 dark:text-slate-300 dark:hover:text-white hover:scale-105 transition-all cursor-pointer active:scale-95 group flex items-center justify-center gap-1.5 font-bold text-xs"
                title="Open Sidebar"
                id="editor-open-sidebar-btn"
              >
                <PanelLeftOpen size={16} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">Show Sidebar</span>
              </button>
            )}

            {/* Floating exit zen mode button removed as requested, since the option is present in the toolbar */}

            {isZenMode && (
              <button
                type="button"
                onClick={() => setIsZenMode(false)}
                className="fixed top-6 right-6 z-50 px-4 py-2 bg-slate-900/80 dark:bg-black/70 hover:bg-rose-600 hover:text-white text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md border border-slate-700/50"
                title="Exit Immersive Mode (Esc)"
              >
                <Minimize2 size={13} />
                <span>Exit Immersive</span>
              </button>
            )}

            <div className={`flex flex-col transition-all duration-500 ${isZenMode ? 'w-full h-full p-0 max-w-none' : 'mx-auto h-full p-6 lg:p-10 max-w-5xl w-full'}`}>
              {currentPageId ? (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex-grow flex flex-col transition-colors duration-500 overflow-hidden ${
                    isZenMode 
                      ? 'border-0 bg-transparent shadow-none' 
                      : (
                        readerTheme === 'midnight' 
                          ? 'bg-[#151924]/90 border border-[#2d323f]/80 shadow-2xl shadow-black/40 rounded-[32px]' 
                          : readerTheme === 'vanilla' 
                            ? 'bg-[#fdf6e3] border-[#eee1ba] shadow-lg text-[#5b4636] rounded-[32px]' 
                            : 'bg-white border border-slate-200 shadow-sm text-slate-800 rounded-[32px]'
                      )
                  }`}
                >
                <div className={`flex-grow overflow-y-auto custom-scrollbar ${isZenMode ? 'p-8 md:p-20 max-w-3xl mx-auto w-full' : 'p-12'}`}>
                  <Editor 
                    content={currentPage?.content || ''} 
                    onChange={handlePageUpdate} 
                    onStatsChange={setStats}
                    listingId={id}
                    pageId={currentPageId!}
                    className={readerTheme === 'midnight' ? 'prose-invert text-white' : ''}
                  />
                </div>
                {!isZenMode && <EditorStats stats={stats} />}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FileText size={64} className="mb-4 opacity-20" />
                <p className="text-lg">Select a page to start editing</p>
                <button 
                  onClick={handlePageAdd}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Create your first page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default ListingEditor;
export { ListingEditor };
