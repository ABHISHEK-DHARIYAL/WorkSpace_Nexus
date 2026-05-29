import React, { useEffect, useState } from 'react';
import api from '../services/api/client';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Layout, Search, Grid, List as ListIcon, X, 
  Folder, Clock, Edit3, Trash2, ChevronRight, FileText, 
  Check, TrendingUp, Users, Clock3, FileStack, ArrowUpRight,
  PlusCircle, FolderPlus, MoreVertical, Briefcase, Download, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const workspaceService = {
  getAll: () => api.get("/workspace"),
  create: (data: any) => api.post("/workspace", data),
  update: (id: string, data: any) => api.put(`/workspace/${id}`, data),
  delete: (id: string) => api.delete(`/workspace/${id}`),
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div
      animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
    />
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; isGlass?: boolean; onClick?: () => void }> = ({ icon, label, value, color, isGlass, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`p-6 sm:p-7 rounded-[26px] flex items-center gap-5 sm:gap-6 transition-all select-none active:scale-[0.98] ${
      onClick ? 'cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/15' : 'cursor-default'
    } group h-full ${
      isGlass 
        ? 'bg-slate-900/40 border border-slate-800/60 dark:border-[#2d323f]/50 text-white backdrop-blur-2xl hover:bg-slate-900/80 hover:border-indigo-500/50 shadow-2xl shadow-slate-950/35' 
        : 'bg-white border border-slate-100 shadow-lg hover:shadow-2xl hover:shadow-slate-200/20 dark:bg-[#15181e] dark:border-[#2d323f] dark:hover:shadow-none'
    }`}
  >
    <div className={`p-4 rounded-2xl transition-all ${isGlass ? 'bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-500/40' : color} group-hover:scale-110 shadow-sm ${isGlass ? 'border border-indigo-500/20' : ''}`}>
      {icon}
    </div>
    <div className="flex-grow min-w-0">
      <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-1.5 leading-none transition-colors ${isGlass ? 'text-indigo-200/80 group-hover:text-indigo-100' : 'text-slate-400 dark:text-slate-400'}`}>{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${isGlass ? 'bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        {onClick && (
          <ArrowUpRight size={16} className={`opacity-0 group-hover:opacity-100 transition-all translate-y-0.5 ${isGlass ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
        )}
      </div>
    </div>
  </motion.div>
);

const WorkspaceCard: React.FC<{ 
  workspace: any; 
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}> = ({ workspace, onDelete, onRename }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group relative"
    >
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 dark:group-hover:bg-[#eee1ba] group-hover:text-white dark:group-hover:text-black transition-all shadow-sm">
            <Briefcase size={28} />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onRename(workspace.id, workspace.name)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-[#eee1ba] hover:bg-indigo-50 dark:hover:bg-[#1f242e] rounded-lg transition-all"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => onDelete(workspace.id)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/45 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <Link to={`/workspace/${workspace.id}`} className="block group/title">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 truncate group-hover/title:text-indigo-600 dark:group-hover/title:text-[#eee1ba] transition-colors">
            {workspace.name}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed mb-6">
            {workspace.description || "Manage your projects in this workspace."}
          </p>
        </Link>
        
        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-[#2d323f]">
           <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-50 dark:bg-[#1f242e] text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-[#2d323f]">
                {workspace.projectCount || 0} Projects
              </div>
           </div>
           <Link 
            to={`/workspace/${workspace.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-[#eee1ba] hover:bg-slate-800 dark:hover:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
           >
             Open Workspace <ChevronRight size={14} className="text-white dark:text-black" />
           </Link>
        </div>
      </div>
    </motion.div>
  );
};

const WorkspaceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [editingId, setEditingId] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [downloadState, setDownloadState] = useState<{
    isLoading: boolean;
    projectName: string;
    step: 'preparing' | 'compressing' | 'downloading' | 'idle';
    errors: string[];
    success: boolean;
  }>({
    isLoading: false,
    projectName: '',
    step: 'idle',
    errors: [],
    success: false,
  });

  const handleDownloadAllProjects = async () => {
    if (!user) {
      alert("Please log in to download your projects!");
      return;
    }

    setDownloadState({
      isLoading: true,
      projectName: '',
      step: 'preparing',
      errors: [],
      success: false,
    });

    try {
      const res = await api.get("/export/all-projects");
      const projects = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);

      if (projects.length === 0) {
        setDownloadState(prev => ({
          ...prev,
          isLoading: false,
          step: 'idle',
          errors: ["No projects found to export. Create a project in your workspace first!"],
        }));
        return;
      }

      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        
        setDownloadState(prev => ({
          ...prev,
          projectName: p.title,
          step: 'preparing',
        }));
        await new Promise(r => setTimeout(r, 600));

        setDownloadState(prev => ({
          ...prev,
          step: 'compressing',
        }));
        await new Promise(r => setTimeout(r, 700));

        setDownloadState(prev => ({
          ...prev,
          step: 'downloading',
        }));

        try {
          const dlRes = await api.get(`/export/project/${p.id}`, {
            responseType: 'blob',
          });

          const blob = new Blob([dlRes.data], { type: 'application/zip' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const safeTitle = (p.title || "project")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const fileName = `${safeTitle || p.id}.zip`;

          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (err: any) {
          console.error(`Failed to download ${p.title}:`, err);
          setDownloadState(prev => ({
            ...prev,
            errors: [...prev.errors, `Failed to download: ${p.title}`],
          }));
        }
      }

      setDownloadState(prev => ({
        ...prev,
        step: 'idle',
        success: true,
      }));
      
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, success: false, isLoading: false }));
      }, 5000);

    } catch (err: any) {
      console.error("Export all failed:", err);
      setDownloadState(prev => ({
        ...prev,
        isLoading: false,
        step: 'idle',
        errors: ["Failed to fetch your projects list. Please try again."],
      }));
    }
  };

  const [renameWorkspaceId, setRenameWorkspaceId] = useState<any>(null);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [renameWorkspaceDesc, setRenameWorkspaceDesc] = useState('');
  const [renaming, setRenaming] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await workspaceService.getAll();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await workspaceService.create({ name: newName, description: newDesc });
      setWorkspaces([data, ...(Array.isArray(workspaces) ? workspaces : [])]);
      showToast(`Workspace "${newName}" created successfully!`, 'success', 'Workspace Created', 3000);
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      alert('Error creating workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = (id: string, name: string) => {
    const safeWsList = Array.isArray(workspaces) ? workspaces : [];
    const ws = safeWsList.find(w => w.id === id);
    setRenameWorkspaceId(id);
    setRenameWorkspaceName(name);
    setRenameWorkspaceDesc(ws?.description || '');
  };

  const executeRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameWorkspaceName.trim() || !renameWorkspaceId) return;
    setRenaming(true);
    try {
      await workspaceService.update(renameWorkspaceId, { name: renameWorkspaceName, description: renameWorkspaceDesc });
      const safeWsList = Array.isArray(workspaces) ? workspaces : [];
      setWorkspaces(safeWsList.map(w => w.id === renameWorkspaceId ? { ...w, name: renameWorkspaceName, description: renameWorkspaceDesc } : w));
      showToast(`Workspace renamed to "${renameWorkspaceName}"!`, 'success', 'Workspace Updated', 3000);
      setRenameWorkspaceId(null);
    } catch (err) {
      alert('Update failed');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await workspaceService.delete(deleteConfirmId);
      const safeWsList = Array.isArray(workspaces) ? workspaces : [];
      setWorkspaces(safeWsList.filter(w => w.id !== deleteConfirmId));
      showToast('Workspace successfully deleted.', 'success', 'Workspace Removed', 3000);
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  const workspaceToDelete = safeWorkspaces.find(w => w.id === deleteConfirmId);

  const filteredWorkspaces = safeWorkspaces.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProjects = safeWorkspaces.reduce((sum, w) => sum + (w.projectCount || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50/55 dark:bg-[#0f1115] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-12">
        {/* Glowing Hero Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#121620] px-8 py-12 md:px-14 md:py-16 text-white shadow-2xl border border-slate-800/60">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-0 right-0 -mr-28 -mt-28 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute bottom-0 left-0 -ml-28 -mb-28 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '8s' }} />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="p-3 bg-indigo-650 rounded-xl shadow-lg shadow-indigo-900/30">
                  <Briefcase size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-none">
                    Your Workspaces
                  </h1>
                  <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[9px] mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Personal Document Ecosystem
                  </p>
                </div>
              </div>
              <p className="text-sm md:text-base text-slate-300 mb-6 leading-relaxed font-medium max-w-lg">
                "Organize your research, notes, and documentation into specialized workspaces for maximum focus."
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/15 transition-all active:scale-95 cursor-pointer"
                >
                  <FolderPlus size={14} />
                  <span>Create Workspace</span>
                </button>

                <button
                  onClick={handleDownloadAllProjects}
                  disabled={downloadState.isLoading}
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg ${
                    downloadState.isLoading
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
                      : 'bg-[#eee1ba] hover:bg-white text-black hover:shadow-white/5 border border-transparent animate-pulse'
                  }`}
                >
                  {downloadState.isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-black" />
                  )}
                  <span>Download All Projects</span>
                </button>
              </div>
            </div>

            {/* Simplified & Good Looking Minimalist HUD Panel */}
            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px] backdrop-blur-xl w-full lg:w-[420px] shrink-0 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Stats Column Grid */}
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Workspaces</span>
                  <span className="text-2xl font-black text-white tracking-tight">{safeWorkspaces.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Combined Projects</span>
                  <span className="text-2xl font-black text-white tracking-tight">{totalProjects}</span>
                </div>
              </div>
              
              <div className="w-full h-px bg-white/10 my-4" />
              
              {/* Micro stats indicators */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 relative z-10 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Productivity: <span className="text-white">High</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>Reserved Space: <span className="text-white">98%</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Listing */}
        <div id="workspace-listing" className="flex flex-col gap-10">
          {/* Sibling 1 (Selected Component controls) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-[#15181e]/80 border border-slate-100 dark:border-[#2d323f]/60 p-6 rounded-[32px] transition-colors duration-300">
            <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={24} />
              <input 
                type="text" 
                placeholder="Search workspaces..." 
                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] rounded-3xl focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all text-slate-900 dark:text-white text-lg font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="flex bg-white dark:bg-[#1f242e] p-1.5 rounded-2xl border border-slate-200 dark:border-[#2d323f] shadow-sm gap-1">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black shadow-lg' 
                        : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Grid View
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      viewMode === 'list' 
                        ? 'bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black shadow-lg' 
                        : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    List View
                  </button>
               </div>
            </div>
          </div>

          {/* Sibling 2 (Workspace Listing block, placed back below the selected controls) */}
          <div className="w-full animate-in fade-in duration-300">
            {filteredWorkspaces.length === 0 ? (
              <div className="text-center py-32 bg-white dark:bg-[#15181e] border-4 border-dashed border-slate-50 dark:border-[#2d323f]/60 rounded-[48px] transition-colors duration-300">
                <Folder className="mx-auto text-slate-100 dark:text-[#2d323f] mb-8" size={100} />
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">No Workspaces Found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-12 max-w-md mx-auto font-medium">Create a workspace to start organizing your documentation projects effectively.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-12 py-5 bg-indigo-600 dark:bg-[#eee1ba] text-white dark:text-black font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 dark:hover:bg-white transition-all shadow-md"
                >
                  Start New Workspace
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredWorkspaces.map((ws) => (
                  <WorkspaceCard 
                    key={ws.id} 
                    workspace={ws} 
                    onDelete={handleDelete}
                    onRename={handleRename}
                  />
                ))}
                
                {/* New Workspace Helper Card */}
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="group flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#15181e]/40 border-4 border-dashed border-slate-100 dark:border-[#2d323f] rounded-[40px] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all min-h-[350px]"
                >
                   <div className="p-6 bg-white dark:bg-[#1f242e] rounded-3xl shadow-xl text-slate-300 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-[#eee1ba] group-hover:scale-110 transition-all mb-6">
                     <Plus size={48} />
                   </div>
                   <span className="text-xl font-black text-slate-400 dark:text-slate-400 group-hover:text-indigo-900 dark:group-hover:text-white uppercase tracking-widest transition-colors">Add Workspace</span>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#15181e] rounded-[40px] border border-slate-100 dark:border-[#2d323f] overflow-hidden shadow-sm transition-colors">
                {/* Mobile View: Stacked interactive div cards */}
                <div className="md:hidden divide-y divide-slate-50 dark:divide-[#2d323f]/60">
                  {filteredWorkspaces.map((ws: any) => (
                    <div key={`list-mobile-ws-${ws.id}`} className="p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <span 
                              className="font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-[#eee1ba] cursor-pointer transition-colors block text-base"
                              onClick={() => navigate(`/workspace/${ws.id}`)}
                            >
                              {ws.name}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 bg-slate-100 dark:bg-[#1f242e] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200/50 dark:border-[#2d323f]">
                              <Layout size={10} />
                              {ws.projectCount || 0} {ws.projectCount === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleRename(ws.id, ws.name)}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-[#1f242e] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-[#eee1ba] rounded-lg transition-all"
                            title="Rename"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(ws.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {ws.description && (
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
                          {ws.description}
                        </p>
                      )}

                      <div className="w-full pt-1">
                        <Link to={`/workspace/${ws.id}`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-[#eee1ba] hover:bg-slate-800 dark:hover:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                          Open Workspace <ChevronRight size={14} className="text-white dark:text-black" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet & Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-[#1f242e] text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 border-b border-slate-50 dark:border-[#2d323f]">
                        <th className="px-8 py-5">
                          <div className="font-neutral-800 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Workspace Name</div>
                        </th>
                        <th className="px-8 py-5">
                          <div className="font-neutral-800 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Purpose / Bio</div>
                        </th>
                        <th className="px-8 py-5">
                          <div className="font-neutral-800 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Active Projects</div>
                        </th>
                        <th className="px-8 py-5 text-right">
                          <div className="font-neutral-800 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 text-right">Actions</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-[#2d323f]">
                      {filteredWorkspaces.map((ws: any) => (
                        <tr key={`list-ws-${ws.id}`} className="hover:bg-slate-50/50 dark:hover:bg-[#1f242e] transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:text-white transition-all shadow-sm">
                                <Briefcase size={18} />
                              </div>
                              <div>
                                <span 
                                  className="font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-[#eee1ba] cursor-pointer transition-colors block text-base"
                                  onClick={() => navigate(`/workspace/${ws.id}`)}
                                >
                                  {ws.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 max-w-md">
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm line-clamp-1">
                              {ws.description || 'No description provided.'}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#1f242e] text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200/50 dark:border-[#2d323f]">
                              <Layout size={12} />
                              {ws.projectCount || 0} {ws.projectCount === 1 ? 'Project' : 'Projects'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3 transition-opacity">
                              <Link to={`/workspace/${ws.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-[#eee1ba] hover:bg-slate-800 dark:hover:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                                Open <ChevronRight size={14} className="text-white dark:text-black" />
                              </Link>
                              <button 
                                onClick={() => handleRename(ws.id, ws.name)}
                                className="p-2 hover:bg-indigo-50 dark:hover:bg-[#1f242e] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-[#eee1ba] rounded-lg transition-all"
                                title="Rename"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(ws.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all shadow-sm"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
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
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#15181e] rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-transparent dark:border-[#2d323f]"
            >
              <div className="p-10 border-b border-slate-50 dark:border-[#2d323f] flex justify-between items-center bg-slate-50 dark:bg-[#1f242e]">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">New Workspace</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Group your documentation projects</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-4 hover:bg-white dark:hover:bg-[#15181e] text-slate-700 dark:text-slate-300 rounded-2xl transition-all shadow-sm"
                >
                  <X size={28} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-10">
                <div className="space-y-8 mb-12">
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">Workspace Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="e.g. Computer Science, Personal Goals"
                      className="w-full px-6 py-5 bg-white dark:bg-[#1a1f29] border border-slate-300 dark:border-[#2d323f] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-xl font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">Purpose / Bio</label>
                    <textarea 
                      placeholder="What is the focus of this workspace?"
                      className="w-full px-6 py-5 bg-white dark:bg-[#1a1f29] border border-slate-300 dark:border-[#2d323f] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none min-h-[120px] text-lg font-medium text-black dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  disabled={creating}
                  className="w-full bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black p-6 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-black dark:hover:bg-white transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/40 text-lg active:scale-[0.98]"
                >
                  {creating ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : 'Finish & Create'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setDeleteConfirmId(null)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative bg-white dark:bg-[#15181e] rounded-[36px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-[#2d323f]"
            >
              <div className="p-8 pb-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100/50 dark:border-red-900/30 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Trash2 size={28} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                  Delete Workspace?
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed px-2">
                  Are you sure you want to delete <span className="font-extrabold text-slate-800 dark:text-white">"{workspaceToDelete?.name}"</span>? 
                  The workspace metadata will be removed, but any projects inside it will remain safe.
                </p>
              </div>
              
              <div className="p-8 pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#1f242e] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-[#2d323f] active:scale-[0.98] transition-all"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-500 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Workspace Modal */}
      <AnimatePresence>
        {renameWorkspaceId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setRenameWorkspaceId(null)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#15181e] rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-transparent dark:border-[#2d323f]"
            >
              <div className="p-10 border-b border-slate-50 dark:border-[#2d323f] flex justify-between items-center bg-slate-50 dark:bg-[#1f242e]">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rename Workspace</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Update workspace name and purpose</p>
                </div>
                <button 
                  onClick={() => setRenameWorkspaceId(null)}
                  className="p-4 hover:bg-white dark:hover:bg-[#15181e] text-slate-700 dark:text-slate-300 rounded-2xl transition-all shadow-sm"
                >
                  <X size={28} />
                </button>
              </div>
              <form onSubmit={executeRename} className="p-10">
                <div className="space-y-8 mb-12">
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">Workspace Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="e.g. Computer Science, Personal Goals"
                      className="w-full px-6 py-5 bg-white dark:bg-[#1a1f29] border border-slate-300 dark:border-[#2d323f] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-xl font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={renameWorkspaceName}
                      onChange={(e) => setRenameWorkspaceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">Purpose / Bio</label>
                    <textarea 
                      placeholder="What is the focus of this workspace?"
                      className="w-full px-6 py-5 bg-white dark:bg-[#1a1f29] border border-slate-300 dark:border-[#2d323f] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none min-h-[120px] text-lg font-medium text-black dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={renameWorkspaceDesc}
                      onChange={(e) => setRenameWorkspaceDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setRenameWorkspaceId(null)}
                    className="flex-1 py-5 bg-slate-100 dark:bg-[#1f242e] text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-200 dark:hover:bg-[#2d323f] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={renaming}
                    className="flex-1 bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-white transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/40 active:scale-[0.98]"
                  >
                    {renaming ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Export Status Indicator */}
      <AnimatePresence>
        {downloadState.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#2d323f] p-4 rounded-2xl shadow-2xl flex flex-col space-y-3 text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d323f]/60 pb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#5b4636] dark:text-[#eee1ba] flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>Exporting Projects</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Local Package Generation
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {downloadState.projectName || "Retrieving project repository..."}
                </p>
                <p className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-0.5 animate-pulse">
                  {downloadState.step === 'preparing' && "Preparing ZIP..."}
                  {downloadState.step === 'compressing' && "Compressing Files..."}
                  {downloadState.step === 'downloading' && "Downloading..."}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-indigo-600 h-full rounded-full"
                animate={{
                  width: downloadState.step === 'preparing' ? "33%" :
                         downloadState.step === 'compressing' ? "66%" : "100%"
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
