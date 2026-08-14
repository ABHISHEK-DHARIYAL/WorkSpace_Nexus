import React from 'react';
import { FileText, Settings2, Star, Clock, BookOpen, Clock as TimeIcon } from 'lucide-react';

export interface DocumentNexusProjectCardProps {
  p: any;
  user: any;
  isAdmin: boolean;
  selectedProject: any;
  setSelectedProject: (p: any) => void;
  setCurrentMainTab: (tab: 'workspaces' | 'project-hub' | 'document-canvas') => void;
  handleOpenProjectSettings: (p: any) => void;
  onToggleBookmark: (projectId: string, currentStatus: boolean) => void;
  setProjectToDelete: (p: any) => void;
  setIsReaderMode: (mode: boolean) => void;
  pages?: any[];
  onRenameProject: (projectId: string, newTitle: string) => void;
}

export const DocumentNexusProjectCard: React.FC<DocumentNexusProjectCardProps> = ({
  p,
  user,
  isAdmin,
  selectedProject,
  setSelectedProject,
  setCurrentMainTab,
  handleOpenProjectSettings,
  onToggleBookmark,
  setProjectToDelete,
  setIsReaderMode,
  pages,
  onRenameProject
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(p.title);

  const allowedToEdit = p.owner === user?.email || p.userId === user?.id || isAdmin;
  const docPagesCount = pages ? pages.filter((page: any) => page.projectId === p.id).length : 0;
  const pageCount = docPagesCount || p.pages?.length || p.pageIds?.length || 0;
  const formattedDate = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Just now';

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(p.title);
    setIsEditing(true);
  };

  const handleSaveRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && editTitle.trim() !== p.title) {
      onRenameProject(p.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div 
      onClick={() => { setSelectedProject(p); setCurrentMainTab('document-canvas'); }}
      className={`rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg duration-250 ${
        selectedProject?.id === p.id 
          ? 'bg-[#eee1ba]/20 border-[#eee1ba] shadow-md ring-2 ring-[#eee1ba]/10' 
          : 'bg-white border-slate-200 hover:border-slate-350'
      }`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-[#eee1ba]/10 text-black rounded-lg"><FileText size={20} /></div>
          <div className="flex items-center gap-1">
            {/* Project Settings Trigger */}
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenProjectSettings(p); }}
              className="p-1.5 rounded border border-slate-250 text-slate-400 bg-white hover:text-black hover:border-[#eee1ba]/40 text-xs font-bold transition-all hover:scale-105 active:scale-95 mr-1"
              title="Project Settings"
            >
              <Settings2 size={14} />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(p.id, !!p.isBookmarked); }} 
              className={`p-1.5 rounded border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${p.isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-500' : 'border-slate-250 text-slate-400 bg-white hover:text-amber-500 hover:border-amber-300'}`}
              title={p.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            >
              <Star size={14} fill={p.isBookmarked ? "currentColor" : "none"} />
            </button>
            {allowedToEdit && (
              <button 
                onClick={handleStartRename} 
                className="p-1 px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-black rounded border border-transparent text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                Rename
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); }} 
              className="p-1 px-2.5 hover:bg-red-50 text-red-650 rounded border border-transparent text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div>
          {isEditing ? (
            <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#eee1ba] focus:bg-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(e as any);
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsEditing(false);
                  }
                }}
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                  }}
                  className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-605 rounded font-bold transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRename}
                  className="px-2 py-1 text-[10px] bg-black hover:bg-slate-900 text-white rounded font-bold transition-all hover:scale-105"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{p.title}</h4>
              <p className="text-xs text-slate-400 font-semibold line-clamp-2 mt-1">{p.description || 'Raw indices parsing projects description metadata.'}</p>
            </>
          )}
        </div>

        {/* Custom Details Block */}
        <div className="flex flex-wrap items-center gap-3 py-1 text-slate-500 dark:text-slate-400 border-t border-slate-100/50 dark:border-[#2d323f]/50 pt-3">
          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border ${
            p.visibility === 'public'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-930/10'
              : 'bg-slate-100 dark:bg-[#1c202a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}>
            <span>{p.visibility === 'public' ? '🌍 Public' : '🔒 Private'}</span>
          </span>

          <div className="flex items-center gap-1 text-[10px] font-bold">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>

          <div className="flex items-center gap-[5px] text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            <Clock size={11} className="opacity-50" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Actions & Buttons section */}
      <div className="pt-4 border-t border-slate-100/60 mt-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Active Project</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setCurrentMainTab('document-canvas'); }}
            className={`font-black uppercase tracking-wider text-[10px] flex items-center gap-1 border-b transition-all ${
              selectedProject?.id === p.id 
                ? 'text-black border-black font-extrabold' 
                : 'text-slate-500 border-transparent hover:text-black hover:border-black'
            }`}
          >
            {selectedProject?.id === p.id ? 'Workspace Bound ✓' : 'Load Document Workspace'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setSelectedProject(p); 
              setCurrentMainTab('document-canvas'); 
              setIsReaderMode(true); 
            }}
            className="py-2.5 px-3 bg-slate-900 hover:bg-black text-[9px] font-black uppercase tracking-[0.12em] text-white rounded-xl flex items-center justify-center gap-1 transition-all outline-none border border-slate-950"
          >
            <BookOpen size={11} className="text-white/80" />
            <span>Reading Mode</span>
          </button>

          {allowedToEdit ? (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedProject(p); 
                setCurrentMainTab('document-canvas'); 
                setIsReaderMode(false); 
              }}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[9px] font-black uppercase tracking-[0.12em] text-slate-650 rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition-all outline-none"
            >
              <span>Open Editor</span>
            </button>
          ) : (
            <div className="py-2.5 px-3 bg-slate-50 text-[9px] font-bold uppercase text-slate-400 rounded-xl flex items-center justify-center border border-slate-150 select-none">
              <span>Locked</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
