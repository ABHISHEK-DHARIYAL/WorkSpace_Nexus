import React from 'react';
import { Star } from 'lucide-react';
import { DocumentNexusProjectCard } from './DocumentNexusProjectCard';

export interface DocumentNexusProjectsViewProps {
  filteredProjects: any[];
  projectViewMode: 'grid' | 'list';
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

export const DocumentNexusProjectsView: React.FC<DocumentNexusProjectsViewProps> = ({
  filteredProjects,
  projectViewMode,
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
  if (projectViewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
        {filteredProjects.map((p) => (
          <DocumentNexusProjectCard
            key={p.id}
            p={p}
            user={user}
            isAdmin={isAdmin}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            setCurrentMainTab={setCurrentMainTab}
            handleOpenProjectSettings={handleOpenProjectSettings}
            onToggleBookmark={onToggleBookmark}
            setProjectToDelete={setProjectToDelete}
            setIsReaderMode={setIsReaderMode}
            pages={pages}
            onRenameProject={onRenameProject}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-[#525d70]/70 border-b border-slate-100">
              <th className="p-4 pl-6">Document Title</th>
              <th className="p-4">Status & Bookmarks</th>
              <th className="p-4 text-right pr-6">Activity Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredProjects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="p-4 pl-6 font-extrabold text-[#111827]">{p.title}</td>
                <td className="p-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(p.id, !!p.isBookmarked);
                      }} 
                      className={`p-1.5 rounded border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                        p.isBookmarked 
                          ? 'bg-amber-50 border-amber-300 text-amber-500' 
                          : 'border-slate-250 text-slate-400 bg-white'
                      }`}
                      title={p.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    >
                      <Star size={12} fill={p.isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                      p.visibility === 'public' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {p.visibility}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right pr-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(p);
                      setCurrentMainTab('document-canvas');
                    }}
                    className="px-3 py-1.5 bg-black hover:bg-slate-900 text-white rounded-lg font-bold transition-colors"
                  >
                    Open Workspace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
