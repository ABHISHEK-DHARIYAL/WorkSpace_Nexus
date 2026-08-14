import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book, Bookmark, Globe, Edit3, Trash2, Check, X, FileText, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface WorkspaceHubProjectCardProps {
  listing: any;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleBookmark: (id: string, currentStatus: boolean) => void;
  isEditing: boolean;
  tempTitle: string;
  onTempTitleChange: (v: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onOpenProjectSettings?: (listing: any) => void;
}

export const WorkspaceHubProjectCard: React.FC<WorkspaceHubProjectCardProps> = ({ 
  listing, 
  onDelete,
  onRename,
  onToggleBookmark,
  isEditing,
  tempTitle,
  onTempTitleChange,
  onSaveRename,
  onCancelRename,
  onOpenProjectSettings
}) => {
  const { user } = useAuth();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all group ${isEditing ? 'ring-2 ring-black ring-opacity-20' : ''}`}
    >
      <div className="p-6 transition-colors group-hover:bg-slate-50/50">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-lg transition-colors ${isEditing ? 'bg-black text-white shadow-xl scale-110' : 'bg-slate-100 text-black group-hover:bg-black group-hover:text-white border border-slate-200 shadow-sm'}`}>
            <Book size={24} />
          </div>
          <div className="flex gap-1">
            {!isEditing && (
              <>
                <button 
                  onClick={() => onToggleBookmark(listing.id, !!listing.isBookmarked)}
                  className={`p-2 rounded-lg transition-all shadow-sm border ${
                    listing.isBookmarked 
                      ? 'bg-amber-500 text-white border-amber-600' 
                      : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-white border-slate-200'
                  }`}
                  title={listing.isBookmarked ? "Unbookmark" : "Bookmark Project"}
                >
                  <Bookmark size={18} fill={listing.isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button 
                  onClick={() => onOpenProjectSettings && onOpenProjectSettings(listing)}
                  className="p-2 bg-slate-100 hover:bg-white rounded-lg text-slate-600 transition-all border border-slate-200 shadow-sm"
                  title="Project Visibility & Tags"
                >
                  <Globe size={18} />
                </button>
                <button 
                  onClick={() => onRename(listing.id, listing.title)}
                  className="p-2 bg-slate-100 hover:bg-white rounded-lg text-slate-600 transition-all border border-slate-200"
                  title="Rename"
                >
                  <Edit3 size={18} />
                </button>
                {listing.visibility === 'public' && user?.role !== 'admin' ? (
                  <button 
                    disabled
                    className="p-2 bg-slate-50 text-slate-300 rounded-lg cursor-not-allowed border border-slate-100"
                    title="Public projects can only be deleted by administrators"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => onDelete(listing.id)}
                    className="p-2 bg-slate-100 hover:bg-red-50 rounded-lg text-slate-600 hover:text-red-600 transition-all border border-slate-200"
                    title="Delete Listing"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <button 
                  onClick={onSaveRename}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                  title="Save"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={onCancelRename}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mb-4">
            <input 
              autoFocus
              className="w-full text-xl font-bold text-slate-900 border-b-2 border-black outline-none bg-slate-50 px-1"
              value={tempTitle}
              onChange={(e) => onTempTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename();
                if (e.key === 'Escape') onCancelRename();
              }}
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Press Enter to Save</p>
          </div>
        ) : (
          <Link to={`/listing/read/${listing.id}`} className="block group/title">
            <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover/title:text-black transition-colors">
              {listing.title}
            </h3>
          </Link>
        )}
        
        <Link to={`/listing/read/${listing.id}`} className="block">
          <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed hover:text-slate-900 transition-colors">
            {listing.description || "No description provided."}
          </p>
        </Link>

        {/* Project visibility & tag badge summary line */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
            listing.visibility === 'public'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span>{listing.visibility === 'public' ? '🌍 Public' : '🔒 Private'}</span>
          </span>
          {(listing.tags || []).map((t: string) => (
            <span key={t} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500">
              #{t}
            </span>
          ))}
        </div>
 
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-300 bg-slate-50 border border-slate-200/50 group-hover:bg-slate-900 group-hover:shadow-lg group-hover:shadow-slate-900/20 group-hover:border-slate-900 group-hover:scale-105">
              <FileText size={14} className="text-slate-500 group-hover:text-white/80" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-slate-900 group-hover:text-white tabular-nums leading-none">
                  {listing.pages?.length || 0}
                </span>
                <span className="text-[9px] text-slate-400 group-hover:text-white/70 font-bold uppercase tracking-wider leading-none">
                  {listing.pages?.length === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <Clock size={12} className="opacity-50" />
            <span>{listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString() : 'Just now'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col border-t border-slate-100 bg-slate-50/50">
        <Link 
          to={`/listing/read/${listing.id}`}
          className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all group/read shadow-inner shadow-black/20"
        >
          <BookOpen size={18} className="group-hover/read:scale-110 transition-transform" />
          Reading Mode
          <ChevronRight size={16} className="group-hover/read:translate-x-1 transition-transform" />
        </Link>
        
        <Link 
          to={`/listing/edit/${listing.id}`}
          className="w-full py-2 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-slate-600 transition-colors border-t border-slate-100"
        >
          Open Editor
        </Link>

        {/* Eye-Comfort Settings Link Indicator inside selecting options footer */}
        <div className="px-6 py-2.5 bg-[#eee1ba]/30 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400/90 flex items-center gap-1">
            👁️ CLARITY TUNABLE:
          </span>
          <div className="flex gap-1 text-[8px] font-black uppercase tracking-wider">
            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100/50">Slate</span>
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100/50">Vanilla</span>
            <span className="px-1.5 py-0.5 bg-[#eee1ba]/10 text-[#eee1ba] rounded border border-[#eee1ba]/50">Midnight</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
