import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Book, Bookmark, FileText, Check, X, BookOpen, Edit3, Trash2, Clock, ChevronRight } from 'lucide-react';
import { WorkspaceHubProjectCard } from './WorkspaceHubProjectCard';
import { useAuth } from '../../context/AuthContext';

export interface WorkspaceHubProjectsViewProps {
  filteredListings: any[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  projectsViewMode: 'grid' | 'list';
  setProjectsViewMode: (v: 'grid' | 'list') => void;
  setShowCreateModal: (v: boolean) => void;
  setDeleteConfirmId: (id: string | null) => void;
  setEditingId: (id: string | null) => void;
  tempTitle: string;
  setTempTitle: (v: string) => void;
  handleToggleListingBookmark: (id: string, status: boolean) => void;
  editingId: string | null;
  handleRename: (id: string) => void;
  handleOpenProjectSettings: (listing: any) => void;
  navigate: (path: string) => void;
}

export const WorkspaceHubProjectsView: React.FC<WorkspaceHubProjectsViewProps> = ({
  filteredListings,
  searchTerm,
  setSearchTerm,
  projectsViewMode,
  setProjectsViewMode,
  setShowCreateModal,
  setDeleteConfirmId,
  setEditingId,
  tempTitle,
  setTempTitle,
  handleToggleListingBookmark,
  editingId,
  handleRename,
  handleOpenProjectSettings,
  navigate
}) => {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 border border-slate-100 p-4 rounded-3xl animate-in fade-in duration-300">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Filter projects..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#eee1ba]/20 outline-none shadow-sm transition-all text-slate-900 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1">
            <button 
              onClick={() => setProjectsViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                projectsViewMode === 'grid' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              Grid
            </button>
            <button 
              onClick={() => setProjectsViewMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                projectsViewMode === 'list' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-black text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-[#eee1ba]/15"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <Book className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No projects found</h3>
          <p className="text-slate-500 mb-8">Get started by creating your first project!</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-black font-bold hover:underline"
          >
            Create your first project
          </button>
        </div>
      ) : projectsViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredListings.map((listing) => (
            <WorkspaceHubProjectCard 
              key={listing.id} 
              listing={listing} 
              onDelete={(id) => setDeleteConfirmId(id)}
              onRename={(id, title) => {
                setEditingId(id);
                setTempTitle(title);
              }}
              onToggleBookmark={handleToggleListingBookmark}
              isEditing={editingId === listing.id}
              tempTitle={tempTitle}
              onTempTitleChange={setTempTitle}
              onSaveRename={() => handleRename(listing.id)}
              onCancelRename={() => setEditingId(null)}
              onOpenProjectSettings={handleOpenProjectSettings}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                  <th className="px-8 py-4">Project Title</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4">Details</th>
                  <th className="px-8 py-4">Last Modified</th>
                  <th className="px-10 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredListings.map((listing: any) => (
                  <tr key={`project-list-${listing.id}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleListingBookmark(listing.id, !!listing.isBookmarked)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-110 ${
                            listing.isBookmarked 
                              ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                          title={listing.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                        >
                          <Bookmark size={14} fill={listing.isBookmarked ? "currentColor" : "none"} />
                        </button>
                        {editingId === listing.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input 
                              autoFocus
                              className="text-sm font-bold text-slate-900 border-b-2 border-black outline-none bg-slate-50 px-2 py-1 rounded"
                              value={tempTitle}
                              onChange={(e) => setTempTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(listing.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button onClick={() => handleRename(listing.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X size={14} /></button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-700 hover:text-black transition-colors cursor-pointer" onClick={() => navigate(`/listing/read/${listing.id}`)}>
                            {listing.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 max-w-xs">
                      <span className="text-sm text-slate-500 line-clamp-1">{listing.description || 'No description provided.'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eee1ba]/10 text-black text-[10px] font-black uppercase rounded-lg border border-[#eee1ba]/15">
                        <FileText size={12} />
                        {listing.pages?.length || 0} {listing.pages?.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs text-slate-400 font-medium">
                        {listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/listing/read/${listing.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                          <BookOpen size={12} />
                          Read
                        </Link>
                        <Link to={`/listing/edit/${listing.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                          <Edit3 size={12} />
                          Edit
                        </Link>
                        <button 
                          onClick={() => {
                            setEditingId(listing.id);
                            setTempTitle(listing.title);
                          }} 
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all" 
                          title="Rename"
                        >
                          <Edit3 size={12} />
                        </button>
                        {listing.visibility === 'public' && user?.role !== 'admin' ? (
                          <button 
                            disabled 
                            className="p-1.5 text-slate-200 cursor-not-allowed rounded-lg" 
                            title="Public projects can only be deleted by administrators"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId(listing.id)} 
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all" 
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
