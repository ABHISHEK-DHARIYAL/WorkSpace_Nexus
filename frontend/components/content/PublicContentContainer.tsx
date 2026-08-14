import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicService } from '../../services/api/public';
import { 
  Users, 
  Layers, 
  Briefcase, 
  FileText, 
  Globe, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  Bookmark, 
  UserPlus, 
  UserMinus,
  Star, 
  Share2, 
  Copy, 
  ShieldAlert, 
  Trash2, 
  Grid, 
  Tag, 
  Plus, 
  X, 
  Eye, 
  ShieldCheck, 
  ClipboardList, 
  AlertCircle,
  HelpCircle,
  Check,
  Megaphone,
  Settings,
  BookOpen,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentNexusView } from './DocumentNexusView';
import { WorkspaceHubView } from './WorkspaceHubView';

export function PublicContentContainer() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation Tabs: 'hub' | 'nexus' | 'audit-logs'
  const [activeTab, setActiveTab] = useState<'hub' | 'nexus' | 'audit-logs'>('hub');
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [totals, setTotals] = useState({ users: 0, workspaces: 0, projects: 0, pages: 0 });
  const [nexusTotals, setNexusTotals] = useState({ users: 0, workspaces: 0, projects: 0, pages: 0 });
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [nexusUserSummaries, setNexusUserSummaries] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Social states
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});

  // Settings Slide-over / Modal for Projects (Visibility & Tags)
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [newProjectTag, setNewProjectTag] = useState('');
  const [modulating, setModulating] = useState(false);
  
  // Admin Action Modal
  const [adminActionProject, setAdminActionProject] = useState<any | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [copiedPageId, setCopiedPageId] = useState<string | null>(null);

  // Fetch critical public platform details
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let hubRes: any;
      let nexusRes: any;
      let bookmarksRes: any = { data: [] };
      let followsRes: any = { data: { following: [] } };

      // Core public explorer data (does not require authentication)
      const [hubResult, nexusResult] = await Promise.all([
        publicService.getDashboardHub(),
        publicService.getDocumentNexus()
      ]);
      hubRes = hubResult;
      nexusRes = nexusResult;

      // User-specific authenticated social details (bookmarks, follows) loaded only if user is logged in
      if (user) {
        try {
          const [bookmarksResult, followsResult] = await Promise.all([
            publicService.getBookmarks(),
            publicService.getFollows()
          ]);
          bookmarksRes = bookmarksResult;
          followsRes = followsResult;
        } catch (socialErr: any) {
          console.warn("Could not synchronize user-specific bookmarks or publisher followings maps seamlessly:", socialErr);
        }
      }

      const hub = hubRes.data || {};
      const nexusData = nexusRes.data || [];
      
      const rawUserSummaries = hub.userSummaries || [];
      const filteredUserSummaries = rawUserSummaries.map((u: any) => {
        const filteredWorkspaces = (u.workspaces || []).map((w: any) => {
          const filteredProjects = (w.projects || []).filter((p: any) => p.visibility === 'public' || isAdmin);
          return {
            ...w,
            projects: filteredProjects
          };
        }).filter((w: any) => w.projects.length > 0);

        return {
          ...u,
          workspaces: filteredWorkspaces,
          workspacesCount: filteredWorkspaces.length,
          projectsCount: filteredWorkspaces.reduce((sum: number, w: any) => sum + w.projects.length, 0),
          pagesCount: filteredWorkspaces.reduce((sum: number, w: any) => {
            return sum + w.projects.reduce((pSum: number, p: any) => pSum + (p.pages?.length || 0), 0);
          }, 0)
        };
      }).filter((u: any) => u.workspaces.length > 0);

      setUserSummaries(filteredUserSummaries);

      const filteredNexusSummaries = nexusData.map((u: any) => {
        const filteredWorkspaces = (u.workspaces || []).map((w: any) => {
          const filteredProjects = (w.projects || []).filter((p: any) => p.visibility === 'public' || isAdmin);
          return {
            ...w,
            projects: filteredProjects
          };
        }).filter((w: any) => w.projects.length > 0);

        return {
          ...u,
          workspaces: filteredWorkspaces,
          workspacesCount: filteredWorkspaces.length,
          projectsCount: filteredWorkspaces.reduce((sum: number, w: any) => sum + w.projects.length, 0),
          pagesCount: filteredWorkspaces.reduce((sum: number, w: any) => {
            return sum + w.projects.reduce((pSum: number, p: any) => pSum + (p.pages?.length || 0), 0);
          }, 0)
        };
      }).filter((u: any) => u.workspaces.length > 0);

      setNexusUserSummaries(filteredNexusSummaries);

      const finalProjectsCount = filteredUserSummaries.reduce((sum: number, u: any) => sum + u.projectsCount, 0);
      const finalWorkspacesCount = filteredUserSummaries.reduce((sum: number, u: any) => sum + u.workspacesCount, 0);
      const finalPagesCount = filteredUserSummaries.reduce((sum: number, u: any) => sum + u.pagesCount, 0);
      const finalUsersCount = filteredUserSummaries.length;

      setTotals({
        users: finalUsersCount,
        workspaces: finalWorkspacesCount,
        projects: finalProjectsCount,
        pages: finalPagesCount
      });

      const finalNexusProjectsCount = filteredNexusSummaries.reduce((sum: number, u: any) => sum + u.projectsCount, 0);
      const finalNexusWorkspacesCount = filteredNexusSummaries.reduce((sum: number, u: any) => sum + u.workspacesCount, 0);
      const finalNexusPagesCount = filteredNexusSummaries.reduce((sum: number, u: any) => sum + u.pagesCount, 0);
      const finalNexusUsersCount = filteredNexusSummaries.length;

      setNexusTotals({
        users: finalNexusUsersCount,
        workspaces: finalNexusWorkspacesCount,
        projects: finalNexusProjectsCount,
        pages: finalNexusPagesCount
      });
      
      setBookmarks(bookmarksRes.data || []);
      setFollowing(followsRes.data?.following || []);

      if (isAdmin) {
        try {
          const auditRes = await publicService.getAuditLogs();
          setAuditLogs(auditRes.data || []);
        } catch (auditErr: any) {
          console.warn("Could not load administrative compliance logs:", auditErr);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to sync content registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.email, isAdmin]);

  // Social interactions
  const handleToggleBookmark = async (pageId: string, projectId: string) => {
    if (!user) {
      alert("Please log in or register to bookmark documents!");
      return;
    }
    try {
      await publicService.toggleBookmark(pageId, projectId);
      const bookmarksRes = await publicService.getBookmarks();
      setBookmarks(bookmarksRes.data || []);
    } catch (err) {
      console.error("Bookmark operation error:", err);
    }
  };

  const handleToggleFavorite = async (projectId: string) => {
    if (!user) {
      alert("Please log in or register to add projects to favorites!");
      return;
    }
    try {
      const res = await publicService.toggleFavorite(projectId);
      const isFav = res.data?.favorited;
      if (isFav) {
        setFavorites(prev => [...prev, projectId]);
      } else {
        setFavorites(prev => prev.filter(p => p !== projectId));
      }
      loadData(); // Re-fetch to update aggregates
    } catch (err) {
      console.error("Favorite operation error:", err);
    }
  };

  const handleCopyProject = async (projectId: string) => {
    if (!user) {
      alert("Please log in or register sandbox authentication to copy content!");
      return;
    }
    try {
      const res = await publicService.copyProject(projectId);
      alert(res.data?.message || "Project content successfully copied to your Document Nexus!");
      loadData();
    } catch (err: any) {
      console.error("Copy project error:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to copy project.");
    }
  };

  const handleToggleFollow = async (email: string) => {
    if (!user) {
      alert("Please log in or register to follow publishers!");
      return;
    }
    try {
      const res = await publicService.toggleFollow(email);
      const isFlw = res.data?.followed;
      if (isFlw) {
        setFollowing(prev => [...prev, email]);
      } else {
        setFollowing(prev => prev.filter(e => e !== email));
      }
    } catch (err) {
      console.error("Author follow operation error:", err);
    }
  };

  const handleCopyLink = (pageId: string, projectId?: string) => {
    let url = `${window.location.origin}/listing/read/${pageId}`;
    if (activeTab === 'nexus' && projectId) {
      url = `${window.location.origin}/nexus/bookmark/read/${projectId}/${pageId}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedPageId(pageId);
    setTimeout(() => setCopiedPageId(null), 2500);
  };

  const handleShare = (project: any) => {
    const shareUrl = `${window.location.origin}/listing/read/${project.id || ''}`;
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.description || 'Check out this public docs on WorkSpace Nexus!',
        url: shareUrl,
      }).catch((err) => {
        if (err && (err.name === 'AbortError' || err.message?.includes('canceled') || err.message?.includes('cancelled') || err.message?.includes('abort'))) {
          console.log('Share canceled by user.');
          return;
        }
        navigator.clipboard.writeText(shareUrl);
        alert('Sharing was interrupted or restricted. The document link has been copied to your clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Project link copied to clipboard!');
    }
  };

  // Manage visibility & tags
  const handleOpenSettings = (project: any) => {
    setSelectedProject({ ...project });
    setNewProjectTag('');
  };

  const handleUpdateProjectSettings = async () => {
    if (!selectedProject) return;
    setModulating(true);
    try {
      await publicService.updateVisibility(
        selectedProject.id, 
        selectedProject.visibility, 
        selectedProject.tags || []
      );
      setSelectedProject(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update visibility payload');
    } finally {
      setModulating(false);
    }
  };

  const handleAddTag = () => {
    if (!newProjectTag.trim() || !selectedProject) return;
    const currentTags = selectedProject.tags || [];
    if (!currentTags.includes(newProjectTag.trim().toLowerCase())) {
      setSelectedProject({
        ...selectedProject,
        tags: [...currentTags, newProjectTag.trim().toLowerCase()]
      });
    }
    setNewProjectTag('');
  };

  const handleRemoveTag = (t: string) => {
    if (!selectedProject) return;
    setSelectedProject({
      ...selectedProject,
      tags: (selectedProject.tags || []).filter((tag: string) => tag !== t)
    });
  };

  // Admin moderation mechanics
  const handleTriggerAdminAction = (project: any) => {
    setAdminActionProject(project);
    setAdminReason('');
  };

  const handleExecuteAdminAction = async (action: any) => {
    if (!adminActionProject) return;
    try {
      await publicService.moderateProject(adminActionProject.id, action, adminReason);
      setAdminActionProject(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failure during administrative moderation');
    }
  };

  const handleAdminPermanentlyDelete = async (project: any) => {
    const doubleCheck = window.confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY PURGE project "${project.title}" from WorkSpace Nexus? All pages, annotations, links, and cascade mappings will exist NO LONGER.`);
    if (!doubleCheck) return;
    
    const reason = prompt("Enter deletion reason for compliance auditing logs:");
    if (!reason?.trim()) {
      alert("Purge canceled. Audit compliance reason required.");
      return;
    }

    try {
      await publicService.adminDeleteContent(project.id, reason);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Purge failed');
    }
  };

  // Compute all tags across public projects
  const uniqueTags = useMemo(() => {
    const list = new Set<string>();
    userSummaries.forEach(u => {
      if (u.workspaces) {
        u.workspaces.forEach((w: any) => {
          if (w.projects) {
            w.projects.forEach((p: any) => {
              if (p.tags) {
                p.tags.forEach((t: string) => list.add(t.toLowerCase()));
              }
            });
          }
        });
      }
    });
    return Array.from(list);
  }, [userSummaries]);

  // Compute filtered Users hierarchical tree
  const processedUserHierarchy = useMemo(() => {
    if (!searchQuery.trim() && !selectedTag) return userSummaries;

    const query = searchQuery.toLowerCase();

    return userSummaries.map(user => {
      const uWorkspacesFiltered = (user.workspaces || []).map((w: any) => {
        const matchingProjects = (w.projects || []).filter((p: any) => {
          const titleMatch = p.title?.toLowerCase().includes(query);
          const descMatch = p.description?.toLowerCase().includes(query);
          const ownerMatch = p.owner?.toLowerCase().includes(query);
          const tagMatch = p.tags?.some((t: string) => t.toLowerCase().includes(query)) || (selectedTag && p.tags?.includes(selectedTag));
          
          if (selectedTag) {
            return p.tags?.includes(selectedTag) && (titleMatch || descMatch || ownerMatch);
          }
          return titleMatch || descMatch || ownerMatch || tagMatch;
        });

        if (matchingProjects.length > 0) {
          return { ...w, projects: matchingProjects };
        }
        return null;
      }).filter(Boolean);

      if (uWorkspacesFiltered.length > 0) {
        return {
          ...user,
          workspaces: uWorkspacesFiltered,
          workspacesCount: uWorkspacesFiltered.length,
          projectsCount: uWorkspacesFiltered.reduce((sum: number, w: any) => sum + (w.projects?.length || 0), 0)
        };
      }
      return null;
    }).filter(Boolean);
  }, [userSummaries, searchQuery, selectedTag]);

  // Compute filtered Nexus hierarchical tree
  const processedNexusHierarchy = useMemo(() => {
    if (!searchQuery.trim() && !selectedTag) return nexusUserSummaries;

    const query = searchQuery.toLowerCase();

    return nexusUserSummaries.map(user => {
      const uWorkspacesFiltered = (user.workspaces || []).map((w: any) => {
        const matchingProjects = (w.projects || []).filter((p: any) => {
          const titleMatch = p.title?.toLowerCase().includes(query);
          const descMatch = p.description?.toLowerCase().includes(query);
          const ownerMatch = p.owner?.toLowerCase().includes(query);
          const tagMatch = p.tags?.some((t: string) => t.toLowerCase().includes(query)) || (selectedTag && p.tags?.includes(selectedTag));
          
          if (selectedTag) {
            return p.tags?.includes(selectedTag) && (titleMatch || descMatch || ownerMatch);
          }
          return titleMatch || descMatch || ownerMatch || tagMatch;
        });

        if (matchingProjects.length > 0) {
          return { ...w, projects: matchingProjects };
        }
        return null;
      }).filter(Boolean);

      if (uWorkspacesFiltered.length > 0) {
        return {
          ...user,
          workspaces: uWorkspacesFiltered,
          workspacesCount: uWorkspacesFiltered.length,
          projectsCount: uWorkspacesFiltered.reduce((sum: number, w: any) => sum + (w.projects?.length || 0), 0),
          pagesCount: uWorkspacesFiltered.reduce((sum: number, w: any) => {
            return sum + w.projects.reduce((pSum: number, p: any) => pSum + (p.pages?.length || 0), 0);
          }, 0)
        };
      }
      return null;
    }).filter(Boolean);
  }, [nexusUserSummaries, searchQuery, selectedTag]);

  return (
    <div id="public-content-container" className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 min-h-screen pt-10">
      
      {/* Title & Hub Nav Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#eee1ba] dark:border-[#2d323f]/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-[#5b4636]/50 dark:text-[#eee1ba]/50 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Community Registry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Public Content Explorer
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Browse workspaces, read community-contributed books, and toggle documents visibility to public.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#f4ecd8] dark:bg-[#1e232e] p-1.5 rounded-2xl border border-[#eee1ba] dark:border-[#2d323f] shadow-inner">
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none ${
              activeTab === 'hub'
                ? 'bg-white dark:bg-[#15181e] text-[#5b4636] dark:text-[#eee1ba] shadow-sm'
                : 'text-[#5b4636]/60 dark:text-[#eee1ba]/60 hover:opacity-80'
            }`}
          >
            Workspace Hub
          </button>
          <button
            onClick={() => setActiveTab('nexus')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none ${
              activeTab === 'nexus'
                ? 'bg-white dark:bg-[#15181e] text-[#5b4636] dark:text-[#eee1ba] shadow-sm'
                : 'text-[#5b4636]/60 dark:text-[#eee1ba]/60 hover:opacity-80'
            }`}
          >
            Document Nexus
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none ${
                activeTab === 'audit-logs'
                  ? 'bg-white dark:bg-[#15181e] text-red-600 dark:text-red-400 shadow-sm border border-red-500/10'
                  : 'text-[#5b4636]/60 dark:text-[#eee1ba]/60 hover:opacity-80'
              }`}
            >
              Auditing Logs
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 border-4 border-[#eee1ba] border-t-[#5b4636] dark:border-[#2d323f] dark:to-[#eee1ba] rounded-full"
          />
          <p className="text-xs font-black uppercase text-[#5b4636]/50 dark:text-[#eee1ba]/50 tracking-widest">
            Syncing registry...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-lg font-black text-red-800 dark:text-red-300">Synchronization Error</h2>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={loadData}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Retry Sync
          </button>
        </div>
      ) : activeTab === 'audit-logs' && isAdmin ? (
        
        /* -------------------------------------------------------------
           COMPLIANCE AUDIT LOGS DISPLAY (ADMIN ONLY)
           ------------------------------------------------------------- */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-[#15181e] border border-[#eee1ba] dark:border-[#2d323f] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#eee1ba] dark:border-[#2d323f] flex items-center space-x-3">
              <ClipboardList className="w-5 h-5 text-red-600 dark:text-[#eee1ba]" />
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                Administrative Audit & Compliance History
              </h3>
            </div>
            
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">No moderation history has been recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#fdf6e3] dark:bg-[#111319] text-[#5b4636]/60 dark:text-[#eee1ba]/60 uppercase tracking-wider text-[10px] font-black border-b border-[#eee1ba] dark:border-[#2d323f]">
                    <tr>
                      <th className="p-4 pl-6">Admin</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Target Project / ID</th>
                      <th className="p-4">Reason / Notes</th>
                      <th className="p-4 pr-6 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2d323f]/50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="p-4 pl-6">
                           <p className="font-bold text-slate-950 dark:text-white leading-none">{log.adminName}</p>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">{log.adminEmail}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            log.action === 'PERMANENT_DELETE' 
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-500/10'
                              : log.action === 'HIDE'
                              ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-500/10'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{log.contentOwner}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white max-w-xs truncate">{log.contentTitle}</p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{log.contentId}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-slate-500 dark:text-slate-400 max-w-sm truncate whitespace-normal" title={log.reason}>
                            {log.reason || 'N/A'}
                          </p>
                        </td>
                        <td className="p-4 pr-6 text-right font-mono text-xs text-slate-400 dark:text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      ) : activeTab === 'nexus' ? (
        <DocumentNexusView
          nexusUserSummaries={processedNexusHierarchy}
          user={user}
          isAdmin={isAdmin}
          following={following}
          favorites={favorites}
          bookmarks={bookmarks}
          copiedPageId={copiedPageId}
          handleToggleFollow={handleToggleFollow}
          handleToggleFavorite={handleToggleFavorite}
          handleOpenSettings={handleOpenSettings}
          handleToggleBookmark={handleToggleBookmark}
          handleCopyLink={handleCopyLink}
          handleShare={handleShare}
          handleTriggerAdminAction={handleTriggerAdminAction}
          handleAdminPermanentlyDelete={handleAdminPermanentlyDelete}
          handleCopyProject={handleCopyProject}
          totals={nexusTotals}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          uniqueTags={uniqueTags}
        />
      ) : (
        <WorkspaceHubView
          processedUserHierarchy={processedUserHierarchy}
          user={user}
          isAdmin={isAdmin}
          following={following}
          favorites={favorites}
          expandedUsers={expandedUsers}
          setExpandedUsers={setExpandedUsers}
          handleToggleFollow={handleToggleFollow}
          handleToggleFavorite={handleToggleFavorite}
          handleOpenSettings={handleOpenSettings}
          handleShare={handleShare}
          handleTriggerAdminAction={handleTriggerAdminAction}
          handleAdminPermanentlyDelete={handleAdminPermanentlyDelete}
          totals={totals}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          uniqueTags={uniqueTags}
          bookmarks={bookmarks}
          handleToggleBookmark={handleToggleBookmark}
          copiedPageId={copiedPageId}
          handleCopyLink={handleCopyLink}
        />
      )}

      {/* Slide-over Form Overlay Modal: PROJECT SETTINGS (VISIBILITY & TAGS) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15181e] border border-[#eee1ba] dark:border-[#2d323f] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-100 dark:border-[#2d323f]/80 flex items-center justify-between bg-[#fdf6e3] dark:bg-[#111319]">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm">Project Settings</h3>
                  <p className="text-[10px] uppercase font-black text-slate-400 mt-1">{selectedProject.title}</p>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Visibility Controls */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5b4636]/75 dark:text-[#eee1ba]/75">Visibility Tier</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedProject({ ...selectedProject, visibility: 'private' })}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all outline-none ${
                        selectedProject.visibility === 'private'
                          ? 'bg-[#5b4636] text-[#fdf6e3] border-[#5b4636] dark:bg-[#eee1ba] dark:text-black dark:border-[#eee1ba]'
                          : 'bg-slate-50 dark:bg-black/10 text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-base">🔒</span>
                      <span>Private</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProject({ ...selectedProject, visibility: 'public' })}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all outline-none ${
                        selectedProject.visibility === 'public'
                          ? 'bg-[#5b4636] text-[#fdf6e3] border-[#5b4636] dark:bg-[#eee1ba] dark:text-black dark:border-[#eee1ba]'
                          : 'bg-slate-50 dark:bg-black/10 text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-base">🌍</span>
                      <span>Public</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium max-w-sm">
                    {selectedProject.visibility === 'public' 
                      ? 'Visible to Owner, Admins, and all logged-in Users. Searchable in real time.'
                      : 'Only visible to the Owner or Admins. Completely isolated from discovery channels.'}
                  </p>
                </div>

                {/* Tags custom input list */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5b4636]/75 dark:text-[#eee1ba]/75">Project Tags</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. documentation, react)..."
                      value={newProjectTag}
                      onChange={(e) => setNewProjectTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                      className="flex-grow bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#eee1ba] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2.5 bg-[#eee1ba]/10 text-black dark:bg-[#eee1ba] dark:text-black rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1.5 min-h-[2.5rem]">
                    {(selectedProject.tags || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No tags added yet.</p>
                    ) : (
                      (selectedProject.tags || []).map((t: string) => (
                        <div key={t} className="px-2 py-1 bg-slate-100 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#2d323f] rounded-lg text-[9px] font-bold text-slate-700 dark:text-[#eee1ba] flex items-center space-x-1 shrink-0">
                          <span>#{t}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveTag(t)}
                            className="text-red-500 hover:bg-slate-200 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-[#1d222d]">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="flex-grow py-3 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProjectSettings}
                    disabled={modulating}
                    className="flex-grow py-3 bg-[#5b4636] dark:bg-[#eee1ba] text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-lg border border-transparent disabled:opacity-50"
                  >
                    {modulating ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Action Moderation Modal */}
      <AnimatePresence>
        {adminActionProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdminActionProject(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15181e] border-2 border-red-500/25 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-100 dark:border-[#2d323f]/80 flex items-center justify-between bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-[#eee1ba]" />
                  <h3 className="font-extrabold text-red-800 dark:text-red-300 uppercase text-xs">MODERATION DASHBOARD</h3>
                </div>
                <button 
                  onClick={() => setAdminActionProject(null)}
                  className="p-2 text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase font-mono text-slate-400">Target Project Listing</span>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase leading-tight text-sm mt-0.5">{adminActionProject.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{adminActionProject.owner}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5b4636]/75 dark:text-[#eee1ba]/75">Auditable Reason for Compliance Logs</label>
                  <textarea
                    placeholder="Describe violations, copyright infringements, or general reasons..."
                    value={adminReason}
                    onChange={(e) => setAdminReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none h-20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Moderation Actions Suite</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {adminActionProject.isHidden ? (
                      <button
                        onClick={() => handleExecuteAdminAction('unhide')}
                        className="py-3 px-2.5 bg-green-50 text-green-700 dark:bg-green-950/25 border border-green-500/10 text-xs font-black uppercase rounded-2xl hover:bg-green-100 transition-colors"
                      >
                        Unhide Project
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExecuteAdminAction('hide')}
                        className="py-3 px-2.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/25 border border-yellow-500/10 text-xs font-black uppercase rounded-2xl hover:bg-yellow-100 transition-colors"
                      >
                        Hide Project
                      </button>
                    )}

                    {adminActionProject.isFeatured ? (
                      <button
                        onClick={() => handleExecuteAdminAction('unfeature')}
                        className="py-3 px-2.5 bg-[#eee1ba]/10 text-black dark:bg-black/25 border border-[#eee1ba]/10 text-xs font-black uppercase rounded-2xl hover:bg-[#eee1ba]/15 transition-colors"
                      >
                        Unfeature Best
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExecuteAdminAction('feature')}
                        className="py-3 px-2.5 bg-amber-50 text-yellow-800 dark:bg-yellow-950/20 border border-amber-500/10 text-xs font-black uppercase rounded-2xl hover:bg-amber-100 transition-colors"
                      >
                        Feature Best
                      </button>
                    )}

                    <button
                      onClick={() => handleExecuteAdminAction('unpublish')}
                      className="py-3 px-2.5 bg-[#fdf6e3] text-[#5b4636] border border-[#eee1ba] text-xs font-black uppercase rounded-2xl hover:bg-[#f4ecd8] transition-colors"
                      title="Unpublish (Set to private instantly)"
                    >
                      Unpublish
                    </button>

                    <button
                      onClick={() => handleExecuteAdminAction('to-private')}
                      className="py-3 px-2.5 bg-slate-100 text-slate-700 dark:bg-[#1a1e27] border border-slate-300 dark:border-slate-800 text-xs font-black uppercase rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                      Force Private
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#1d222d] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAdminActionProject(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1e27] text-xs font-black uppercase rounded-xl"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
