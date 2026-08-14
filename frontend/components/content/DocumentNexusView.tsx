import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  FileText, 
  ChevronRight, 
  Bookmark, 
  Star, 
  Share2, 
  Copy, 
  ShieldAlert, 
  Trash2, 
  Check,
  Megaphone,
  Settings,
  BookOpen,
  Clock,
  Users,
  Briefcase,
  Search,
  X,
  HelpCircle,
  UserMinus,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api/client';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-[#15181e] p-2.5 xs:p-3 sm:p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-[#2d323f] flex items-center space-x-1.5 xs:space-x-2 md:space-x-4 shadow-sm min-w-0"
  >
    <div className={`p-1.5 xs:p-2 md:p-3 rounded-xl ${color} flex-shrink-0 flex items-center justify-center`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p 
        className="font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tight"
        style={{ fontSize: "clamp(0.7rem, 1.5vw, 1.15rem)" }}
      >
        {value}
      </p>
      <p 
        className="uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 leading-tight text-ellipsis overflow-hidden whitespace-nowrap"
        style={{ fontSize: "clamp(6.5px, 0.9vw, 8.5px)" }}
      >
        {label}
      </p>
    </div>
  </motion.div>
);

interface DocumentNexusViewProps {
  nexusUserSummaries: any[];
  user: any;
  isAdmin: boolean;
  following: string[];
  favorites: string[];
  bookmarks: any[];
  copiedPageId: string | null;
  handleToggleFollow: (email: string) => void;
  handleToggleFavorite: (pId: string) => void;
  handleOpenSettings: (p: any) => void;
  handleToggleBookmark: (pgId: string, pId: string) => void;
  handleCopyLink: (pgId: string, projectId?: string) => void;
  handleShare: (p: any) => void;
  handleTriggerAdminAction: (p: any) => void;
  handleAdminPermanentlyDelete: (p: any) => void;
  handleCopyProject: (pId: string) => void;
  // Align with Workspace Hub features
  totals: { users: number; workspaces: number; projects: number; pages: number };
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  uniqueTags: string[];
}

export function DocumentNexusView({
  nexusUserSummaries,
  user,
  isAdmin,
  following,
  favorites,
  bookmarks,
  copiedPageId,
  handleToggleFollow,
  handleToggleFavorite,
  handleOpenSettings,
  handleToggleBookmark,
  handleCopyLink,
  handleShare,
  handleTriggerAdminAction,
  handleAdminPermanentlyDelete,
  handleCopyProject,
  totals,
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  uniqueTags
}: DocumentNexusViewProps) {
  const [collapsedUsers, setCollapsedUsers] = React.useState<Record<string, boolean>>({});
  const [downloadState, setDownloadState] = React.useState<{
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
      // 1. Fetch user projects list
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

      // 2. Loop through each project and export as ZIP
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        
        // Show preparing state
        setDownloadState(prev => ({
          ...prev,
          projectName: p.title,
          step: 'preparing',
        }));
        await new Promise(r => setTimeout(r, 600));

        // Show compressing state
        setDownloadState(prev => ({
          ...prev,
          step: 'compressing',
        }));
        await new Promise(r => setTimeout(r, 700));

        // Show downloading state
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

  const toggleUserCollapse = (email: string) => {
    setCollapsedUsers(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* KPI Analytics Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-[#eee1ba]" />} value={String(totals.users)} label="Active Authors" color="bg-[#eee1ba]/10 dark:bg-black/20" />
        <StatCard icon={<Layers className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-[#eee1ba]" />} value={String(totals.workspaces)} label="Public Workspaces" color="bg-emerald-50 dark:bg-emerald-950/20" />
        <StatCard icon={<Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-[#eee1ba]" />} value={String(totals.projects)} label="Public Projects" color="bg-yellow-50 dark:bg-yellow-950/20" />
        <StatCard icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#5b4636] dark:text-[#eee1ba]" />} value={String(totals.pages)} label="Published Pages" color="bg-amber-50 dark:bg-amber-950/20" />
      </div>

      {/* Search, Filter Tag Block */}
      <div className="bg-white dark:bg-[#15181e] p-6 rounded-3xl border border-slate-100 dark:border-[#2d323f] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Query titles, tags, owners or key phrases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1c202a] border border-slate-200 dark:border-[#2d323f]/80 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#eee1ba] transition-all font-sans"
            />
          </div>

          <button
            onClick={handleDownloadAllProjects}
            disabled={downloadState.isLoading}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shrink-0 ${
              downloadState.isLoading
                ? 'bg-slate-100 text-slate-400 dark:bg-[#1a1e27] dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-[#2d323f]/50'
                : 'bg-black text-white hover:bg-[#eee1ba] hover:text-black hover:shadow-md active:scale-95 shadow-sm border border-transparent'
            }`}
          >
            {downloadState.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>⬇ Download All Projects</span>
          </button>
          
          {selectedTag && (
            <button 
              onClick={() => setSelectedTag(null)}
              className="px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-500/10 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shrink-0"
            >
              <X className="w-4 h-4" />
              <span>Clear Filter: {selectedTag}</span>
            </button>
          )}
        </div>

        {/* Popular Tags display */}
        {uniqueTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Popular chips</p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    selectedTag === tag
                      ? 'bg-[#eee1ba] border-[#eee1ba] text-[#5b4636] dark:text-[#0a0a0d]'
                      : 'bg-slate-50 dark:bg-[#1c202a]/40 border-slate-200 dark:border-[#2d323f] text-slate-600 dark:text-[#eee1ba]/70 hover:bg-slate-100 hover:text-black dark:hover:bg-[#1e232e]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creators / Library List Section */}
      <div className="space-y-6">
        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Active Publishers & Libraries</h3>

        {nexusUserSummaries.length === 0 ? (
          <div className="p-16 bg-white dark:bg-[#15181e] border rounded-3xl text-center text-slate-400 dark:text-slate-500 shadow-sm max-w-lg mx-auto">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h4 className="font-bold text-slate-900 dark:text-white">No Public Results Matching Filter</h4>
            <p className="text-xs font-semibold leading-relaxed mt-1">Try resetting your tag chip or adjusting spelling keywords to explore broader libraries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {nexusUserSummaries.map((u) => {
              const worksCount = u.workspaces?.length || 0;
              if (worksCount === 0) return null;

              const selfOwn = u.email === user?.email;
              const isFlwed = following.includes(u.email);

              return (
                <div key={u.email} className="bg-white dark:bg-[#15181e] border border-slate-100 dark:border-[#2d323f] rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                  {/* User Summary Header to Match Workspace Hub */}
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 select-none border-b border-transparent dark:border-[#2d323f]/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-[#f4ecd8] dark:bg-[#1d222d] border border-[#eee1ba] dark:border-[#2d323f] text-black dark:text-[#eee1ba]/95 font-black text-sm flex items-center justify-center shadow-inner tracking-tighter">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-black text-slate-900 dark:text-white text-base leading-none uppercase tracking-tight">
                            {u.username}
                          </p>
                          {selfOwn && (
                            <span className="px-2 py-0.5 bg-[#eee1ba]/10 dark:bg-black/40 text-black dark:text-[#eee1ba]/95 text-[8px] font-black rounded-full uppercase border border-[#eee1ba]/10">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{u.email}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mt-1 italic">{u.bio || "WorkSpace Nexus explorer & doc publisher"}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 md:space-x-10 shrink-0">
                      <div className="hidden sm:flex items-center space-x-6 text-center text-xs">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{u.workspacesCount}</p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">Workspaces</p>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{u.projectsCount}</p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">Projects</p>
                        </div>
                        <div>
                          <p className="font-black text-[#5b4636] dark:text-[#eee1ba]">{u.pagesCount}</p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">Documents</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">


                        <button
                          onClick={() => toggleUserCollapse(u.email)}
                          className="px-3 py-2.5 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-200 dark:bg-[#1c202a] dark:border-[#2d323f] text-[#5b4636] dark:text-[#eee1ba] transition-all flex items-center space-x-1.5 shadow-sm font-black text-xs uppercase tracking-wider"
                          title={collapsedUsers[u.email] ? "Expand content layout" : "Collapse content layout"}
                        >
                          {collapsedUsers[u.email] ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Show content</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide content</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-level paths hierarchy display in shaded card section */}
                  {!collapsedUsers[u.email] && (
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-6 py-6 border-t border-slate-100 dark:border-[#2d323f]/40 space-y-6">
                      {u.workspaces?.map((w: any) => (
                      <div key={w.id} className="space-y-4">
                        <div className="flex items-center space-x-2 text-[#5b4636] dark:text-[#eee1ba]/80 font-black text-xs uppercase tracking-wider p-1">
                          <Layers className="w-4 h-4 text-[#5b4636]/60 dark:text-[#eee1ba]" />
                          <span>{w.name}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                          {w.projects?.map((p: any) => {
                            const allowedToEdit = p.owner === user?.email || isAdmin;
                            const totalPages = p.pages?.length || 0;
                            const formattedDate = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Just now';

                            return (
                              <div key={p.id} className="bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-[#5b4636]/50 dark:text-[#eee1ba]/50 font-mono">Project Item</span>
                                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight animate-fade-in">
                                        {p.title}
                                      </h4>
                                    </div>
                                    
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleToggleFavorite(p.id)}
                                        className="p-2 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-100 dark:bg-[#1c202a] dark:border-[#2d323f] transition-all text-yellow-500"
                                        title="Toggle Favorite"
                                      >
                                        <Star className={`w-4 h-4 ${favorites.includes(p.id) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 dark:text-slate-500'}`} />
                                      </button>
                                      
                                      {allowedToEdit && (
                                        <button
                                          onClick={() => handleOpenSettings(p)}
                                          className="p-2 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-100 dark:bg-[#1c202a] dark:border-[#2d323f] text-[#5b4636] dark:text-[#eee1ba] transition-all"
                                          title="Open Project Visibility & Tags"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed font-sans min-h-[1.5rem]">
                                    {p.description || "WorkSpace Nexus custom public book list element."}
                                  </p>

                                  {/* Custom Details Block */}
                                  <div className="flex flex-wrap items-center gap-3 py-1 text-slate-500 dark:text-slate-400 border-t border-slate-100/50 dark:border-[#2d323f]/50 pt-3">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                      p.visibility === 'public'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-930/10'
                                        : 'bg-slate-100 dark:bg-[#1c202a] text-slate-600 dark:text-[#eee1ba]/70 border-slate-200 dark:border-slate-800'
                                    }`}>
                                      <span>{p.visibility === 'public' ? '🌍 Public' : '🔒 Private'}</span>
                                    </span>

                                    <div className="flex items-center gap-1 text-[10px] font-bold">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
                                    </div>

                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                      <Clock size={11} className="opacity-50" />
                                      <span>{formattedDate}</span>
                                    </div>
                                  </div>

                                  {/* Core Pages list inside the project card */}
                                  {p.pages && p.pages.length > 0 ? (
                                    <ul className="pt-2 pl-4 border-l border-slate-200 dark:border-[#2d323f] space-y-2.5">
                                      {p.pages.map((pg: any) => (
                                        <li key={pg.id} className="flex items-center justify-between group">
                                          <Link to={`/listing/read/${pg.id}`} className="flex items-center space-x-2 text-xs font-bold text-black dark:text-[#eee1ba] hover:underline">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{pg.title}</span>
                                          </Link>
                                          
                                          <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => handleToggleBookmark(pg.id, p.id)}
                                              className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                                              title="Toggle Bookmark"
                                            >
                                              <Bookmark className={`w-3.5 h-3.5 ${bookmarks.some(b => b.pageId === pg.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                            </button>
                                            <button 
                                              onClick={() => handleCopyLink(pg.id)}
                                              className="p-1 text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                                              title="Copy Link ID"
                                            >
                                              {copiedPageId === pg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pl-4">No published pages found in this project.</p>
                                  )}

                                  {/* Action Buttons Panel */}
                                  <div className="pt-3 border-t border-slate-100/50 dark:border-[#2d323f]/50 flex gap-2">
                                    <Link 
                                      to={`/nexus/read/${p.id}`}
                                      className="flex-grow py-2 px-3 bg-slate-900 hover:bg-black dark:bg-[#252a36] dark:hover:bg-[#2d323f] text-[9.5px] font-black uppercase tracking-[0.12em] text-[#fdf6e3] dark:text-[#eee1ba] rounded-xl flex items-center justify-center gap-1.5 border border-slate-950 dark:border-[#2d323f] transition-all outline-none"
                                    >
                                      <BookOpen size={11.5} className="text-white/80 dark:text-[#eee1ba]/80" />
                                      <span>Reading Mode</span>
                                      <ChevronRight size={10.5} className="text-white/60 dark:text-[#eee1ba]/60" />
                                    </Link>

                                    <button
                                      onClick={() => handleCopyProject(p.id)}
                                      className="py-2 px-3 bg-[#eee1ba] hover:bg-black text-[9.5px] font-black uppercase tracking-[0.12em] text-white rounded-xl flex items-center justify-center gap-1.5 border border-black transition-all outline-none select-none cursor-pointer"
                                      title="Copy project content to your local workspace"
                                    >
                                      <Copy size={11.5} className="text-[#eee1ba]/25" />
                                      <span>Copy Content</span>
                                    </button>

                                    {allowedToEdit && (
                                      <Link 
                                        to={`/listing/edit/${p.id}`}
                                        className="py-2 px-3 bg-white dark:bg-[#1a1e27] hover:bg-slate-50 dark:hover:bg-[#202530] text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center gap-1 border border-slate-200 dark:border-[#2d323f] transition-all outline-none"
                                      >
                                        <span>Open Editor</span>
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                {/* Bottom Moderation Panel */}
                                <div className="pt-4 border-t border-slate-100 dark:border-[#2d323f] flex items-center justify-between gap-4">
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                                    {p.pages?.length || 0} docs published
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      onClick={() => handleShare(p)}
                                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                      title="Share list context"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>

                                    {/* Admin Moderation Button suite */}
                                    {isAdmin && (
                                      <>
                                        <button
                                          onClick={() => handleTriggerAdminAction(p)}
                                          className="p-1.5 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500"
                                          title="Open Administrative Status Overlay"
                                        >
                                          <ShieldAlert className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleAdminPermanentlyDelete(p)}
                                          className="p-1.5 text-red-500 hover:text-red-700"
                                          title="Permanently Purge & cascade delete references"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Export Status Indicator */}
      <AnimatePresence>
        {downloadState.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#2d323f] p-4 rounded-2xl shadow-2xl flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d323f]/60 pb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#5b4636] dark:text-[#eee1ba] flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eee1ba] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#eee1ba]"></span>
                </span>
                <span>Exporting Projects</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Local Package Generation
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#eee1ba]/10 dark:bg-black/30 rounded-xl">
                <Loader2 className="w-5 h-5 text-black dark:text-[#eee1ba] animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {downloadState.projectName || "Retrieving project repository..."}
                </p>
                <p className="text-[10px] font-extrabold text-[#eee1ba] dark:text-[#eee1ba] uppercase tracking-wider mt-0.5 animate-pulse">
                  {downloadState.step === 'preparing' && "Preparing ZIP..."}
                  {downloadState.step === 'compressing' && "Compressing Files..."}
                  {downloadState.step === 'downloading' && "Downloading..."}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-black h-full rounded-full"
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
    </motion.div>
  );
}
