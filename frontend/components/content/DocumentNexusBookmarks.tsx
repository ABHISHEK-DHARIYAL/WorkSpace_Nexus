import React from 'react';
import { 
  FileText, 
  Trash2, 
  BookOpen, 
  ExternalLink, 
  ChevronRight,
  ArrowRight,
  Calendar,
  Star,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface BookmarkItem {
  id: string;
  userId: string;
  projectId: string;
  pageId: string;
  pageTitle: string; // holds the page title for nexus bookmarks, or project title.
  createdAt: string;
}

interface DocumentNexusBookmarksProps {
  bookmarks: BookmarkItem[];
  onRemove: (pageId: string, projectId: string) => Promise<void>;
  hideEmptyState?: boolean;
}

export function DocumentNexusBookmarks({ bookmarks, onRemove, hideEmptyState }: DocumentNexusBookmarksProps) {
  if (bookmarks.length === 0) {
    if (hideEmptyState) return null;
    return (
      <div className="p-12 text-center border border-dashed border-[#eee1ba] dark:border-[#2d323f]/80 rounded-3xl bg-amber-50/10 dark:bg-[#15181e]/40 space-y-4 max-w-lg mx-auto">
        <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto opacity-30" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No Document Bookmarks</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            You haven't bookmarked any specific pages, chapters, or projects yet. Browse public registries and save elements to jump right back in!
          </p>
        </div>
        <Link
          to="/public-content"
          className="inline-flex items-center space-x-1 px-4 py-2 bg-[#5b4636] hover:bg-black dark:bg-[#eee1ba] text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
        >
          <span>Find Documents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#eee1ba] animate-pulse"></span>
          Document Nexus Saved Content & Stars ({bookmarks.length})
        </h3>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold font-bold">Public Bookmarks List</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {bookmarks.map((b) => {
            const isProjectStar = !b.pageId;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`group relative p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border ${
                  isProjectStar 
                    ? 'bg-[#fdfaf2] dark:bg-[#1a1e28] border-[#eee1ba]/85 dark:border-[#2d323f]/80 hover:border-yellow-500/30 dark:hover:border-yellow-500/30' 
                    : 'bg-[#f7fcf9] dark:bg-[#121b18] border-emerald-100/80 dark:border-[#1d2c25]/80 hover:border-emerald-500/30 dark:hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <Link to={isProjectStar ? `/nexus/bookmark/read/${b.projectId}` : `/nexus/bookmark/read/${b.projectId}/${b.pageId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                      {isProjectStar ? (
                        <div className="w-10 h-10 rounded-xl bg-yellow-101 dark:bg-yellow-950/20 text-yellow-600 dark:text-[#eee1ba] flex items-center justify-center shrink-0 shadow-inner">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link to={isProjectStar ? `/nexus/bookmark/read/${b.projectId}` : `/nexus/bookmark/read/${b.projectId}/${b.pageId}`}>
                        <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight text-sm line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
                          {b.pageTitle || "Untitled Resource Item"}
                        </h4>
                      </Link>
                      <div className="flex items-center space-x-2 mt-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                        <Calendar className={`w-3 h-3 ${isProjectStar ? 'text-yellow-600/30' : 'text-emerald-600/30'}`} />
                        <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemove(b.pageId, b.projectId)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    title={isProjectStar ? "Remove Star Bookmark" : "Remove Node Bookmark"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className={`mt-5 pt-4 border-t flex items-center justify-between ${
                  isProjectStar ? 'border-[#eee1ba]/30 dark:border-[#2d323f]/40' : 'border-emerald-100/30 dark:border-emerald-950/40'
                }`}>
                  {isProjectStar ? (
                    <span className="text-[10px] bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest leading-none border border-yellow-550/10">
                      Workspace Star
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest leading-none border border-emerald-50/10">
                      Nexus Chapter
                    </span>
                  )}
                  <Link
                    to={isProjectStar ? `/nexus/bookmark/read/${b.projectId}` : `/nexus/bookmark/read/${b.projectId}/${b.pageId}`}
                    className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider hover:underline ${
                      isProjectStar ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <span>{isProjectStar ? "Open Project" : "Read Document"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
