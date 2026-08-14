import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Share2,
  ShieldAlert,
  Trash2,
  Settings,
  BookOpen,
  Users,
  Briefcase,
  Search,
  X,
  HelpCircle,
  UserMinus,
  UserPlus,
  Copy,
  Edit,
  Bookmark,
  Check,
  Download,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../../services/api/client";

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

interface WorkspaceHubViewProps {
  processedUserHierarchy: any[];
  user: any;
  isAdmin: boolean;
  following: string[];
  favorites: string[];
  expandedUsers: Record<string, boolean>;
  setExpandedUsers: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  handleToggleFollow: (email: string) => void;
  handleToggleFavorite: (pId: string) => void;
  handleOpenSettings: (p: any) => void;
  handleShare: (p: any) => void;
  handleTriggerAdminAction: (p: any) => void;
  handleAdminPermanentlyDelete: (p: any) => void;
  totals: {
    users: number;
    workspaces: number;
    projects: number;
    pages: number;
  };
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  uniqueTags: string[];
  bookmarks: any[];
  handleToggleBookmark: (pageId: string, projectId: string) => void;
  copiedPageId: string | null;
  handleCopyLink: (pageId: string) => void;
}

export function WorkspaceHubView({
  processedUserHierarchy,
  user,
  isAdmin,
  following,
  favorites,
  expandedUsers,
  setExpandedUsers,
  handleToggleFollow,
  handleToggleFavorite,
  handleOpenSettings,
  handleShare,
  handleTriggerAdminAction,
  handleAdminPermanentlyDelete,
  totals,
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  uniqueTags,
  bookmarks,
  handleToggleBookmark,
  copiedPageId,
  handleCopyLink,
}: WorkspaceHubViewProps) {
  const [copyingProjectId, setCopyingProjectId] = useState<string | null>(null);
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

  const [hubDownloadState, setHubDownloadState] = useState<{
    isLoading: boolean;
    step: 'preparing-pages' | 'preparing-indexes' | 'preparing-highlights' | 'generating-zip' | 'downloading' | 'idle';
    errors: string[];
    success: boolean;
  }>({
    isLoading: false,
    step: 'idle',
    errors: [],
    success: false,
  });

  const handleDownloadWorkspaceHub = async () => {
    if (!user) {
      alert("Please log in to download Workspace Hub!");
      return;
    }

    setHubDownloadState({
      isLoading: true,
      step: 'preparing-pages',
      errors: [],
      success: false,
    });

    try {
      // 1. Preparing Pages...
      await new Promise(r => setTimeout(r, 900));
      
      // 2. Preparing Indexes...
      setHubDownloadState(prev => ({ ...prev, step: 'preparing-indexes' }));
      await new Promise(r => setTimeout(r, 900));

      // 3. Preparing Highlights...
      setHubDownloadState(prev => ({ ...prev, step: 'preparing-highlights' }));
      await new Promise(r => setTimeout(r, 900));

      // 4. Generating ZIP...
      setHubDownloadState(prev => ({ ...prev, step: 'generating-zip' }));
      await new Promise(r => setTimeout(r, 900));

      // 5. Downloading...
      setHubDownloadState(prev => ({ ...prev, step: 'downloading' }));

      // Fetch the binary zip from our newly implemented GET /export/workspace-hub route
      const dlRes = await api.get('/export/workspace-hub', {
        responseType: 'blob',
      });

      const blob = new Blob([dlRes.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'workspace-hub.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setHubDownloadState(prev => ({
        ...prev,
        step: 'idle',
        success: true,
      }));

      setTimeout(() => {
        setHubDownloadState(prev => ({ ...prev, success: false, isLoading: false }));
      }, 5000);

    } catch (err: any) {
      console.error("Workspace Hub download failed:", err);
      setHubDownloadState(prev => ({
        ...prev,
        isLoading: false,
        step: 'idle',
        errors: ["Failed to export Workspace Hub. Please check your data and try again."],
      }));
    }
  };

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

  const handleCopyProject = async (project: any) => {
    if (!user) {
      alert("Please log in or register to copy this project!");
      return;
    }

    setCopyingProjectId(project.id);
    try {
      // 1. Fetch user's workspaces
      const wsRes = await api.get("/workspace");
      const workspaces = Array.isArray(wsRes.data) ? wsRes.data : [];

      // 2. Find or create a workspace named "copy"
      let targetWs = workspaces.find(
        (w: any) => w.name?.toLowerCase() === "copy",
      );
      let targetWsId = "";

      if (targetWs) {
        targetWsId = targetWs.id;
      } else {
        const newWsRes = await api.post("/workspace", {
          name: "copy",
          description: "Default folder for copied projects",
        });
        targetWsId = newWsRes.data?.id;
      }

      if (!targetWsId) {
        throw new Error(
          "Unable to locate or auto-create 'copy' folder workspace.",
        );
      }

      // 3. Fetch original project pages
      const pagesRes = await api.get(`/page/${project.id}`);
      const originalPages = Array.isArray(pagesRes.data) ? pagesRes.data : [];

      // 4. Create the cloned project (listing)
      const newProjPayload = {
        title: project.title,
        description: project.description || "",
        workspaceId: targetWsId,
        tags: project.tags || [],
        visibility: "private", // Cloned project is private by default
      };
      const newProjRes = await api.post("/listing", newProjPayload);
      const clonedProjectId = newProjRes.data?.id;

      if (!clonedProjectId) {
        throw new Error("Unable to create duplicate project configuration.");
      }

      // 5. Create cloned pages
      for (const page of originalPages) {
        await api.post("/page", {
          listingId: clonedProjectId,
          title: page.title,
          content: page.content || "",
          pageNumber: page.pageNumber || 0,
        });
      }

      alert(
        `Project "${project.title}" successfully copied to your 'copy' folder!`,
      );
    } catch (err: any) {
      console.error("Duplicate project failure:", err);
      alert(
        `Could not duplicate project: ${err?.response?.data?.message || err?.message || "Unknown error occurred"}`,
      );
    } finally {
      setCopyingProjectId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* KPI Analytics Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          icon={
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-[#eee1ba]" />
          }
          value={String(totals.users)}
          label="Active Authors"
          color="bg-[#eee1ba]/10 dark:bg-black/20"
        />
        <StatCard
          icon={
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-[#eee1ba]" />
          }
          value={String(totals.workspaces)}
          label="Public Workspaces"
          color="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <StatCard
          icon={
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-[#eee1ba]" />
          }
          value={String(totals.projects)}
          label="Public Projects"
          color="bg-yellow-50 dark:bg-yellow-950/20"
        />
        <StatCard
          icon={
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#5b4636] dark:text-[#eee1ba]" />
          }
          value={String(totals.pages)}
          label="Published Pages"
          color="bg-amber-50 dark:bg-amber-950/20"
        />
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

          <button
            onClick={handleDownloadWorkspaceHub}
            disabled={hubDownloadState.isLoading}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shrink-0 ${
              hubDownloadState.isLoading
                ? 'bg-slate-100 text-slate-400 dark:bg-[#1a1e27] dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-[#2d323f]/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md active:scale-95 shadow-sm border border-transparent'
            }`}
          >
            {hubDownloadState.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>⬇ Download Workspace Hub</span>
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Popular chips
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    selectedTag === tag
                      ? "bg-[#eee1ba] border-[#eee1ba] text-[#5b4636] dark:text-[#0a0a0d]"
                      : "bg-slate-50 dark:bg-[#1c202a]/40 border-slate-200 dark:border-[#2d323f] text-slate-600 dark:text-[#eee1ba]/70 hover:bg-slate-100 hover:text-black dark:hover:bg-[#1e232e]"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creators / Library list */}
      <div className="space-y-6">
        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
          Active Publishers & Libraries
        </h3>

        {processedUserHierarchy.length === 0 ? (
          <div className="p-16 bg-white dark:bg-[#15181e] border rounded-3xl text-center text-slate-400 dark:text-slate-500 shadow-sm max-w-lg mx-auto">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              No Public Results Matching Filter
            </h4>
            <p className="text-xs font-semibold leading-relaxed mt-1">
              Try resetting your tag chip or adjusting spelling keywords to
              explore broader libraries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {processedUserHierarchy.map((u) => {
              const isUserExpanded = !!expandedUsers[u.email];
              const selfOwn = u.email === user?.email;
              const works = u.workspaces || [];
              const isFlwed = following.includes(u.email);

              return (
                <div
                  key={u.email}
                  className="bg-white dark:bg-[#15181e] border border-slate-100 dark:border-[#2d323f] rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                >
                  {/* Accordion User Summary Header */}
                  <div
                    onClick={() =>
                      setExpandedUsers((prev) => ({
                        ...prev,
                        [u.email]: !isUserExpanded,
                      }))
                    }
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer select-none border-b border-transparent dark:border-[#2d323f]/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                  >
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
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                          {u.email}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mt-1 italic">
                          {u.bio || "WorkSpace Nexus explorer & doc publisher"}
                        </p>
                      </div>
                    </div>

                    {/* Middle counters and buttons */}
                    <div className="flex items-center space-x-6 md:space-x-10 shrink-0">
                      <div className="hidden sm:flex items-center space-x-6 text-center text-xs">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {u.workspacesCount}
                          </p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">
                            Workspaces
                          </p>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {u.projectsCount}
                          </p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">
                            Projects
                          </p>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {u.pagesCount}
                          </p>
                          <p className="text-[8px] uppercase tracking-widest text-[#5b4636]/60 dark:text-slate-500 font-extrabold mt-0.5">
                            Documents
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >


                        <button
                          onClick={() =>
                            setExpandedUsers((prev) => ({
                              ...prev,
                              [u.email]: !isUserExpanded,
                            }))
                          }
                          className="px-3 py-2.5 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-200 dark:bg-[#1c202a] dark:border-[#2d323f] text-[#5b4636] dark:text-[#eee1ba] transition-all flex items-center space-x-1.5 shadow-sm font-black text-xs uppercase tracking-wider"
                          title={
                            isUserExpanded
                              ? "Collapse content layout"
                              : "Expand content layout"
                          }
                        >
                          {isUserExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide content</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Show content</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  <AnimatePresence>
                    {isUserExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 dark:bg-slate-950/20 px-6 py-6 border-t border-slate-100 dark:border-[#2d323f]/40 space-y-6"
                      >
                        {works.map((ws: any) => (
                          <div key={ws.id} className="space-y-4">
                            <div className="flex items-center space-x-2 text-[#5b4636] dark:text-[#eee1ba]/80 font-black text-xs uppercase tracking-wider p-1">
                              <Layers className="w-4 h-4 text-[#5b4636]/60 dark:text-[#eee1ba]" />
                              <span>{ws.name}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                              {ws.projects?.map((p: any) => {
                                const projFavorited = favorites.includes(p.id);
                                const allowedToEdit =
                                  p.owner === user?.email ||
                                  (user?.email && user.email.includes('rajveer') && p.owner?.includes('rajveer')) ||
                                  isAdmin;

                                return (
                                  <div
                                    key={p.id}
                                    className="bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between gap-1">
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-[#5b4636]/50 dark:text-[#eee1ba]/50 font-mono">
                                            Project Item
                                          </span>
                                          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                                            {p.title}
                                          </h4>
                                        </div>

                                        <div className="flex gap-1">
                                          <button
                                            onClick={() =>
                                              handleToggleFavorite(p.id)
                                            }
                                            className="p-2 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-100 dark:bg-[#1c202a] dark:border-[#2d323f] transition-all text-yellow-500"
                                            title="Toggle Favorite"
                                          >
                                            <Star
                                              className={`w-4 h-4 ${projFavorited ? "fill-yellow-500 text-yellow-500" : "text-slate-400 dark:text-slate-500"}`}
                                            />
                                          </button>

                                          <button
                                            onClick={() => handleCopyProject(p)}
                                            disabled={copyingProjectId === p.id}
                                            className="p-2 bg-slate-50 hover:bg-[#eee1ba]/30 rounded-xl border border-slate-100 dark:bg-[#1c202a] dark:border-[#2d323f] text-[#5b4636] dark:text-[#eee1ba] transition-all disabled:opacity-50"
                                            title="Copy Project"
                                          >
                                            <Copy
                                              className={`w-4 h-4 ${copyingProjectId === p.id ? "animate-spin" : ""}`}
                                            />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed font-sans min-h-[2.5rem]">
                                        {p.description ||
                                          "WorkSpace Nexus custom public book list element."}
                                      </p>

                                      {/* Tags chips list */}
                                      {p.tags && p.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {p.tags.map((tag: string) => (
                                            <span
                                              key={tag}
                                              className="px-2 py-1 bg-slate-100 dark:bg-[#1c202a] rounded-lg text-[9px] font-bold text-slate-600 dark:text-[#eee1ba]/70"
                                            >
                                              #{tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Core Pages list inside the project card */}
                                      {p.pages && p.pages.length > 0 ? (
                                        <ul className="pt-2 pl-4 border-l border-slate-200 dark:border-[#2d323f] space-y-2.5">
                                          {p.pages.map((pg: any) => (
                                            <li key={pg.id} className="flex items-center justify-between group/page">
                                              <Link to={`/listing/read/${pg.id}`} className="flex items-center space-x-2 text-xs font-bold text-black dark:text-[#eee1ba] hover:underline">
                                                <FileText className="w-3.5 h-3.5 text-[#5b4636]/60 dark:text-[#eee1ba]" />
                                                <span>{pg.title}</span>
                                              </Link>
                                              
                                              <div className="flex items-center space-x-3 opacity-0 group-hover/page:opacity-100 transition-opacity">
                                                <button 
                                                  onClick={() => handleToggleBookmark(pg.id, p.id)}
                                                  className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                                                  title="Toggle Bookmark"
                                                >
                                                  <Bookmark className={`w-3.5 h-3.5 ${bookmarks.some((b: any) => b.pageId === pg.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
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

                                        {/* Direct Reading Mode & Editor entry point */}
                                        <div className="pt-3 border-t border-slate-100/50 dark:border-[#2d323f]/50 flex flex-wrap gap-2">
                                          <Link
                                            to={`/listing/read/${p.id}`}
                                            className="flex-grow py-2 px-3 bg-slate-900 hover:bg-black dark:bg-[#252a36] dark:hover:bg-[#2d323f] text-[9.5px] font-black uppercase tracking-[0.12em] text-[#fdf6e3] dark:text-[#eee1ba] rounded-xl flex items-center justify-center gap-1.5 border border-slate-950 dark:border-[#2d323f] transition-all outline-none animate-fadeIn"
                                          >
                                            <BookOpen
                                              size={11.5}
                                              className="text-white/80 dark:text-[#eee1ba]/80"
                                            />
                                            <span>Reading Mode</span>
                                            <ChevronRight
                                              size={10.5}
                                              className="text-white/60 dark:text-[#eee1ba]/60"
                                            />
                                          </Link>

                                          <button
                                            onClick={() => handleCopyProject(p)}
                                            disabled={copyingProjectId === p.id}
                                            className="py-2 px-3 bg-white dark:bg-[#1a1e27] hover:bg-slate-50 dark:hover:bg-[#202530] text-[9.5px] font-black uppercase tracking-[0.12em] text-black dark:text-[#eee1ba] rounded-xl flex items-center justify-center gap-1 border border-slate-200 dark:border-[#2d323f] transition-all outline-none disabled:opacity-55"
                                            title="Copy Project"
                                          >
                                            <Copy
                                              size={11.5}
                                              className={
                                                copyingProjectId === p.id
                                                  ? "animate-spin text-black dark:text-[#eee1ba]"
                                                  : "text-black dark:text-[#eee1ba]"
                                              }
                                            />
                                            <span>
                                              {copyingProjectId === p.id
                                                ? "Copying..."
                                                : "Copy Project"}
                                            </span>
                                          </button>
                                        </div>
                                    </div>

                                    {/* Moderation Controls overlay if isAdmin */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-[#2d323f] flex items-center justify-between gap-4">
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                                        {p.pagesCount || 0} docs published
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
                                              onClick={() =>
                                                handleTriggerAdminAction(p)
                                              }
                                              className="p-1.5 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500"
                                              title="Open Administrative Status Overlay"
                                            >
                                              <ShieldAlert className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleAdminPermanentlyDelete(p)
                                              }
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
                      </motion.div>
                    )}
                  </AnimatePresence>
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

      {/* Floating Hub Export Status Indicator */}
      <AnimatePresence>
        {hubDownloadState.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#2d323f] p-4 rounded-2xl shadow-2xl flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d323f]/60 pb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#5b4636] dark:text-[#eee1ba] flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Preparing Workspace Hub</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Clean Export Mode
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {hubDownloadState.step === 'preparing-pages' && "Extracting raw pages..."}
                  {hubDownloadState.step === 'preparing-indexes' && "Compiling documentation indexes..."}
                  {hubDownloadState.step === 'preparing-highlights' && "Formatting annotations & bookmarks..."}
                  {hubDownloadState.step === 'generating-zip' && "Packing files with JSZip..."}
                  {hubDownloadState.step === 'downloading' && "Serving download package..."}
                </p>
                <p className="text-[10px] font-extrabold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-0.5 animate-pulse">
                  {hubDownloadState.step === 'preparing-pages' && "Preparing Pages..."}
                  {hubDownloadState.step === 'preparing-indexes' && "Preparing Indexes..."}
                  {hubDownloadState.step === 'preparing-highlights' && "Preparing Highlights..."}
                  {hubDownloadState.step === 'generating-zip' && "Generating ZIP..."}
                  {hubDownloadState.step === 'downloading' && "Downloading..."}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-emerald-600 h-full rounded-full"
                animate={{
                  width: hubDownloadState.step === 'preparing-pages' ? "20%" :
                         hubDownloadState.step === 'preparing-indexes' ? "40%" :
                         hubDownloadState.step === 'preparing-highlights' ? "60%" :
                         hubDownloadState.step === 'generating-zip' ? "80%" : "100%"
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {hubDownloadState.success && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl shadow-xl flex items-center space-x-3"
          >
            <div className="p-2 bg-emerald-500 text-white rounded-full">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#5b4636] dark:text-[#eee1ba]">Success!</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Workspace Hub downloaded successfully as workspace-hub.zip</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification */}
      <AnimatePresence>
        {hubDownloadState.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-2xl shadow-xl flex items-center space-x-3"
          >
            <div className="p-2 bg-red-500 text-white rounded-full">
              <X className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-200">Error</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{hubDownloadState.errors[0]}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
