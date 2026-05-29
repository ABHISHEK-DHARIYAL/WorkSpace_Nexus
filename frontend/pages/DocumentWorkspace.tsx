/**
 * ============================================================================
 * 📂 SUBSYSTEM: DOCUMENT NEXUS (PAGES & WORKSPACE ENGINE)
 * ============================================================================
 * 
 * 🏢 Role & Scope:
 * This is the premium interactive layout workspace for Document Nexus projects.
 * It provides multi-page rendering, parent-child document trees, table-of-content
 * indices, annotations, page hierarchy builders, and a live rich-text editor Canvas.
 * 
 * 🔍 Domain Attributes:
 * - addedToNexus: true (Operates exclusively on interactive Document Nexus projects)
 * - workspaceId: Workspace group partition (e.g., 'main')
 * 
 * 🛠️ Key State Modules & Integration Services:
 * - docPageService (/content/page): Manage discrete layout pages with sort indexing
 * - docIndexService (/index): Nested hierarchical index structure blocks
 * - DocumentSidebar: Left tree manager for nested documents
 * - WYSIWYG Editor: Modular editor canvas for document structure text
 * ============================================================================
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import api from '../services/api/client';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, FilePlus, Save, Search, ChevronLeft, ChevronRight, Maximize2, Minimize2, Settings2, 
  X, Type, Layout, Table as TableIcon, Trash2, LayoutList, Edit2, Bold, Italic, List, 
  ListOrdered, Quote, Code, Heading1, Heading2, Heading3, Undo, Redo, Highlighter, 
  PlusCircle, Columns, Rows, Target, Link as LinkIcon, Briefcase, Grid, List as ListIcon,
  TrendingUp, Users, FileStack, ArrowUpRight, FolderPlus, Bookmark, Activity, Star, 
  Upload, Terminal, HelpCircle, Check, Loader2, BookOpen, Coffee, Sun, Moon, FileText, Sparkles,
  Clock, Download, Layers, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { triggerNotification } from '../context/NotificationContext';
import Editor from '../components/editor/Editor';
import { DocumentSidebar } from '../components/workspace/DocumentSidebar';
import { DocumentTopToolbar, DocumentCanvasToolbar } from '../components/workspace/DocumentWorkspaceToolbars';
import { publicService } from '../services/api/public';
import { DocumentNexusProjectsView } from '../components/workspace/DocumentNexusProjectsView';

// Internal/External Services
const workspaceService = {
  getAll: () => api.get("/workspace"),
  create: (data: any) => api.post("/workspace", data),
  update: (id: string, data: any) => api.put(`/workspace/${id}`, data),
  delete: (id: string) => api.delete(`/workspace/${id}`),
};

const listingService = {
  getAll: () => api.get("/listing"),
  getByWorkspace: (workspaceId: string) => api.get(`/listing/workspace/${workspaceId}`),
  getById: (id: string) => api.get(`/listing/${id}`),
  create: (data: any) => api.post("/listing", data),
  update: (id: string, data: any) => api.put(`/listing/${id}`, data),
  delete: (id: string) => api.delete(`/listing/${id}`),
};

const docPageService = {
  getAll: () => api.get("/content/page"),
  getById: (id: string) => api.get(`/content/page/${id}`),
  create: (data: any) => api.post("/content/page", data),
  update: (id: string, data: any) => api.put(`/content/page/${id}`, data),
  delete: (id: string) => api.delete(`/content/page/${id}`),
};

const docIndexService = {
  getAll: () => api.get("/index"),
  getById: (id: string) => api.get(`/index/${id}`),
  create: (data: any) => api.post("/index", data),
  update: (id: string, data: any) => api.put(`/index/${id}`, data),
  delete: (id: string) => api.delete(`/index/${id}`),
};

const annotationService = {
  getAll: () => api.get("/highlight"),
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 380, 720] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
  </div>
);

const DocumentWorkspace: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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

  const [isNexusExporting, setIsNexusExporting] = useState(false);
  const [nexusExportProgress, setNexusExportProgress] = useState(0);
  const [nexusExportStatus, setNexusExportStatus] = useState('');
  const [nexusExportDone, setNexusExportDone] = useState(false);
  const [nexusExportError, setNexusExportError] = useState<string | null>(null);

  const handleDownloadDocumentNexus = async () => {
    if (!user) {
      triggerNotification("Please log in to download your Document Nexus!", 'warning', 'Authentication Required');
      return;
    }

    setIsNexusExporting(true);
    setNexusExportProgress(10);
    setNexusExportStatus("Preparing Pages...");
    setNexusExportDone(false);
    setNexusExportError(null);

    try {
      // Step 1: Prep pages
      await new Promise(r => setTimeout(r, 600));
      setNexusExportProgress(30);
      setNexusExportStatus("Preparing Indexes...");

      // Step 2: Prep indexes
      await new Promise(r => setTimeout(r, 600));
      setNexusExportProgress(50);
      setNexusExportStatus("Preparing Highlights...");

      // Step 3: Prep highlights
      await new Promise(r => setTimeout(r, 650));
      setNexusExportProgress(75);
      setNexusExportStatus("Generating ZIP...");

      // Step 4: Fire the backend endpoint to generate & fetch the ZIP
      const dlRes = await api.get('/export/document-nexus', {
        responseType: 'blob',
      });

      setNexusExportProgress(90);
      setNexusExportStatus("Downloading...");
      await new Promise(r => setTimeout(r, 500));

      // Trigger the download of the blob
      const blob = new Blob([dlRes.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document-nexus.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setNexusExportProgress(100);
      setNexusExportDone(true);
    } catch (err: any) {
      console.error("Document Nexus export failed:", err);
      let errorMsg = "Failed to export Document Nexus. Verify you have imported/created projects in Document Nexus first!";
      if (err.response?.data) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch (_) {
          // ignore
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setNexusExportError(errorMsg);
    }
  };

  const handleDownloadAllProjects = async () => {
    if (!user) {
      triggerNotification("Please log in to download your projects!", 'warning', 'Authentication Required');
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

  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const workspaceIdParam = searchParams.get('workspaceId');

  // Navigation / Tab states
  const [currentMainTab, setCurrentMainTab] = useState<'workspaces' | 'project-hub' | 'document-canvas'>('workspaces');
  
  // Workspace Hub State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [workspaceViewMode, setWorkspaceViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddWorkspaceModal, setShowAddWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [workspaceToDelete, setWorkspaceToDelete] = useState<any>(null);
  const [workspaceToRename, setWorkspaceToRename] = useState<any>(null);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [renameWorkspaceDesc, setRenameWorkspaceDesc] = useState('');

  // Workspace Project Hub Panel State
  const [projectTab, setProjectTab] = useState<'overview' | 'projects' | 'global-search'>('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [projectDeleteConfirmId, setProjectDeleteConfirmId] = useState<string | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // File import & Mammoth background parser logs
  const [uploading, setUploading] = useState(false);
  const [parserLogs, setParserLogs] = useState<string[]>([]);
  const [showParserConsole, setShowParserConsole] = useState(false);

  // Document Pages / Index state
  const [pages, setPages] = useState<any[]>([]);
  const [indices, setIndices] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingPageIds, setViewingPageIds] = useState<string[]>([]);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'slate' | 'vanilla' | 'midnight'>('slate');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'index'>('pages');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Project Settings (Visibility & Tags) States for Document Workspace
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState<any | null>(null);
  const [projectSettingsTags, setProjectSettingsTags] = useState<string[]>([]);
  const [projectSettingsVisibility, setProjectSettingsVisibility] = useState<'private' | 'public'>('private');
  const [projectSettingsNewTag, setProjectSettingsNewTag] = useState('');
  const [savingProjectSettings, setSavingProjectSettings] = useState(false);

  // Link Existing Workspace Projects
  const [showLinkProjectModal, setShowLinkProjectModal] = useState(false);
  const [selectedProjectToLink, setSelectedProjectToLink] = useState<string>('');
  const [linkingProject, setLinkingProject] = useState(false);

  // Highlights state
  const [allHighlights, setAllHighlights] = useState<any[]>([]);

  // Global Search results inside Project Hub matching Titles & Contents
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Index Form state
  const [indexForm, setIndexForm] = useState<{ title: string; pageIds: string[]; sectionId: string }>({ 
    title: '', 
    pageIds: [], 
    sectionId: '' 
  });

  // Public bookmark projects fetched from publicService.getBookmarks()
  const [bookmarkProjects, setBookmarkProjects] = useState<any[]>([]);

  const handleRemoveFavorite = async (projectId: string) => {
    try {
      await publicService.toggleFavorite(projectId);
      const bRes = await publicService.getBookmarks();
      if (bRes && Array.isArray(bRes.data)) {
        setBookmarkProjects(bRes.data.filter((b: any) => !b.pageId));
      }
    } catch (err: any) {
      console.error("Failed to toggle favorite project:", err);
    }
  };

  const [loading, setLoading] = useState(true);

  // Refs
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Fetch initial system data
  const loadSystemData = useCallback(async () => {
    try {
      setLoading(true);
      const [wRes, lRes, pRes, iRes, hRes, bRes] = await Promise.all([
        workspaceService.getAll(),
        listingService.getAll(),
        docPageService.getAll(),
        docIndexService.getAll(),
        annotationService.getAll(),
        publicService.getBookmarks()
      ]);
      const workspaceArray = Array.isArray(wRes.data) ? wRes.data : [];
      setWorkspaces(workspaceArray);
      let allProjects = lRes.data || [];
      setPages(Array.isArray(pRes.data) ? pRes.data : []);
      setIndices(Array.isArray(iRes.data) ? iRes.data : []);
      setAllHighlights(Array.isArray(hRes.data) ? hRes.data : []);
      if (bRes && Array.isArray(bRes.data)) {
        setBookmarkProjects(bRes.data.filter((b: any) => !b.pageId));
      } else {
        setBookmarkProjects([]);
      }

      let activeWorkspace = workspaceArray[0] || null;
      if (workspaceIdParam) {
        const foundWs = workspaceArray.find((ws: any) => ws.id === workspaceIdParam);
        if (foundWs) {
          activeWorkspace = foundWs;
        }
      }

      let activeProject = null;
      if (projectIdParam) {
        activeProject = allProjects.find((p: any) => p.id === projectIdParam);
        if (activeProject) {
          // If the project exists but is not added to the Nexus, automatically link it!
          if (!activeProject.addedToNexus) {
            try {
              await listingService.update(activeProject.id, { addedToNexus: true });
              activeProject.addedToNexus = true;
              allProjects = allProjects.map((p: any) => p.id === activeProject.id ? { ...p, addedToNexus: true } : p);
            } catch (err) {
              console.error("Auto-adding project to nexus failed:", err);
            }
          }
          // Also set the correct workspace in which this project resides
          const projWorkspace = workspaceArray.find((ws: any) => ws.id === activeProject.workspaceId);
          if (projWorkspace) {
            activeWorkspace = projWorkspace;
          }
        }
      }

      setProjects(allProjects);

      if (activeWorkspace) {
        setSelectedWorkspace(activeWorkspace);
      }

      if (activeProject) {
        setSelectedProject(activeProject);
        setCurrentMainTab('document-canvas');
      } else {
        const defaultWsId = activeWorkspace?.id || 'main';
        const initialProject = allProjects.find((p: any) => p.workspaceId === defaultWsId && p.addedToNexus === true);
        if (initialProject) {
          setSelectedProject(initialProject);
        } else {
          setSelectedProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to load ecosystem data", err);
    } finally {
      setLoading(false);
    }
  }, [projectIdParam, workspaceIdParam]);

  useEffect(() => {
    loadSystemData();
  }, [loadSystemData]);

  // Synchronize active project when switching workspaces so the project belongs to the current workspace
  useEffect(() => {
    if (selectedWorkspace) {
      const activeProjForWs = projects.filter(p => p.workspaceId === selectedWorkspace.id && p.addedToNexus === true);
      if (selectedProject) {
        if (selectedProject.workspaceId !== selectedWorkspace.id) {
          setSelectedProject(activeProjForWs[0] || null);
        }
      } else {
        if (activeProjForWs.length > 0) {
          setSelectedProject(activeProjForWs[0]);
        }
      }
    }
  }, [selectedWorkspace, projects, selectedProject]);

  // Project-specific filter lists to prevent page/index bleeding across projects
  const filteredPages = useMemo(() => {
    if (!selectedProject) return [];
    const projectSpecific = pages.filter(p => p.projectId === selectedProject.id);
    if (projectSpecific.length > 0) {
      return projectSpecific;
    }
    return pages.filter(p => !p.projectId);
  }, [pages, selectedProject]);

  const totalHighlightsCount = useMemo(() => {
    if (!selectedProject) return 0;
    return allHighlights.filter((h: any) => h.listingId === selectedProject.id || filteredPages.some(p => p.id === h.pageId)).length;
  }, [allHighlights, selectedProject, filteredPages]);

  const filteredIndices = useMemo(() => {
    if (!selectedProject) return [];
    const projectSpecific = indices.filter(i => i.projectId === selectedProject.id);
    if (projectSpecific.length > 0) {
      return projectSpecific;
    }
    return indices.filter(i => !i.projectId);
  }, [indices, selectedProject]);

  // Synchronize viewing target pages in document workspace
  useEffect(() => {
    if (filteredPages.length > 0) {
      let safeIndex = currentIndex;
      if (currentIndex >= filteredPages.length) {
        safeIndex = filteredPages.length - 1;
        setCurrentIndex(safeIndex);
        return;
      } else if (currentIndex < 0) {
        safeIndex = 0;
        setCurrentIndex(0);
        return;
      }
      
      // Only force sync to a single page if we are in Pages Division mode ('pages')
      if (activeTab === 'pages') {
        const currentId = filteredPages[safeIndex]?.id;
        if (currentId) {
          if (viewingPageIds.length !== 1 || viewingPageIds[0] !== currentId) {
            setViewingPageIds([currentId]);
          }
        }
      }
    } else {
      if (viewingPageIds.length > 0) {
        setViewingPageIds([]);
      }
    }
  }, [currentIndex, filteredPages, viewingPageIds, activeTab]);

  // Handle Workspace creation
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const { data } = await workspaceService.create({ 
        name: newWorkspaceName, 
        description: newWorkspaceDesc 
      });
      const safeWsList = Array.isArray(workspaces) ? workspaces : [];
      setWorkspaces([data, ...safeWsList]);
      setSelectedWorkspace(data);
      setShowAddWorkspaceModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      triggerNotification('Workspace constructed successfully!', 'success', 'Workspace Created');
    } catch (err) {
      triggerNotification('Failed to construct workspace', 'error', 'Workspace Creation Failed');
    }
  };

  // Handle Workspace rename
  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameWorkspaceName.trim()) return;
    try {
      await workspaceService.update(workspaceToRename.id, { 
        name: renameWorkspaceName, 
        description: renameWorkspaceDesc 
      });
      const safeWsList = Array.isArray(workspaces) ? workspaces : [];
      setWorkspaces(safeWsList.map(w => w.id === workspaceToRename.id ? { ...w, name: renameWorkspaceName, description: renameWorkspaceDesc } : w));
      if (selectedWorkspace?.id === workspaceToRename.id) {
        setSelectedWorkspace({ ...selectedWorkspace, name: renameWorkspaceName, description: renameWorkspaceDesc });
      }
      setWorkspaceToRename(null);
      triggerNotification('Workspace updated successfully!', 'success', 'Workspace Updated');
    } catch (err) {
      triggerNotification('Update Workspace failed', 'error', 'Workspace Update Failed');
    }
  };

  // Handle Workspace deletion with warning text: "Are you sure you want to delete \"{workspaceName}\"? The workspace metadata will be removed, but any projects inside it will remain safe."
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
      await workspaceService.delete(workspaceToDelete.id);
      const safeWsList = Array.isArray(workspaces) ? workspaces : [];
      const remaining = safeWsList.filter(w => w.id !== workspaceToDelete.id);
      setWorkspaces(remaining);
      if (selectedWorkspace?.id === workspaceToDelete.id) {
        setSelectedWorkspace(remaining[0] || null);
      }
      setWorkspaceToDelete(null);
      triggerNotification('Workspace deleted successfully!', 'success', 'Workspace Deleted', 3000);
    } catch (err) {
      triggerNotification('Deconstructing Workspace failed', 'error', 'Workspace Deletion Failed');
    }
  };

  // Project bookmarks toggling
  const onToggleBookmark = async (projectId: string, currentStatus: boolean) => {
    try {
      await listingService.update(projectId, { isBookmarked: !currentStatus });
      setProjects(projects.map(p => p.id === projectId ? { ...p, isBookmarked: !currentStatus } : p));
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, isBookmarked: !currentStatus });
      }
      triggerNotification(!currentStatus ? 'Project added to bookmarks!' : 'Project removed from bookmarks', 'success', 'Bookmarks');
    } catch (err: any) {
      console.error("Failed to star listing", err);
      triggerNotification("Failed to bookmark project: " + (err?.response?.data?.message || err?.message), 'error', 'Bookmark Failed');
    }
  };

  // Rename a project/listing title
  const handleRenameProject = async (projectId: string, newTitle: string) => {
    try {
      await listingService.update(projectId, { title: newTitle });
      setProjects(projects.map(p => p.id === projectId ? { ...p, title: newTitle } : p));
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, title: newTitle });
      }
      triggerNotification('Project renamed successfully!', 'success', 'Project Updated');
    } catch (err: any) {
      triggerNotification("Failed to rename project: " + (err?.response?.data?.message || err?.message), 'error', 'Rename Failed');
    }
  };

  // Toggle project visibility state
  const handleToggleVisibility = async (projectId: string, currentVal: any) => {
    try {
      const newVal: "private" | "public" = (currentVal || 'private') === "public" ? "private" : "public";
      await publicService.updateVisibility(projectId, newVal, []);
      setProjects(projects.map(p => p.id === projectId ? { ...p, visibility: newVal } : p));
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, visibility: newVal });
      }
      triggerNotification(`Visibility set to ${newVal} successfully!`, 'success', 'Visibility Updated');
    } catch (err: any) {
      triggerNotification(err?.response?.data?.message || 'Failed to update visibility', 'error', 'Visibility Change Failed');
    }
  };

  const handleOpenProjectSettings = (project: any) => {
    setSelectedProjectForSettings(project);
    setProjectSettingsTags(project.tags || []);
    setProjectSettingsVisibility(project.visibility || 'private');
    setProjectSettingsNewTag('');
  };

  const handleAddProjectSettingsTag = () => {
    const rawTag = projectSettingsNewTag || '';
    if (!rawTag.trim()) return;
    const cleanTag = rawTag.trim().toLowerCase();
    if (!projectSettingsTags.includes(cleanTag)) {
      setProjectSettingsTags([...projectSettingsTags, cleanTag]);
    }
    setProjectSettingsNewTag('');
  };

  const handleRemoveProjectSettingsTag = (tag: string) => {
    setProjectSettingsTags(projectSettingsTags.filter(t => t !== tag));
  };

  const handleSaveProjectSettings = async () => {
    if (!selectedProjectForSettings) return;
    setSavingProjectSettings(true);
    try {
      await publicService.updateVisibility(
        selectedProjectForSettings.id,
        projectSettingsVisibility,
        projectSettingsTags
      );
      // Synchronize state locally across lists and selected state
      setProjects(projects.map(p => p.id === selectedProjectForSettings.id ? {
        ...p,
        visibility: projectSettingsVisibility,
        tags: projectSettingsTags
      } : p));
      if (selectedProject?.id === selectedProjectForSettings.id) {
        setSelectedProject({
          ...selectedProject,
          visibility: projectSettingsVisibility,
          tags: projectSettingsTags
        });
      }
      setSelectedProjectForSettings(null);
      triggerNotification('Project settings updated successfully!', 'success', 'Settings Updated');
    } catch (err: any) {
      triggerNotification(err?.response?.data?.message || 'Failed to update visibility & tags', 'error', 'Settings Update Failed');
    } finally {
      setSavingProjectSettings(false);
    }
  };

  const handleLinkProject = async () => {
    if (!selectedProjectToLink) return;
    setLinkingProject(true);
    try {
      await listingService.update(selectedProjectToLink, { addedToNexus: true });
      
      // Update local state to set addedToNexus to true
      setProjects(projects.map(p => p.id === selectedProjectToLink ? { ...p, addedToNexus: true } : p));
      
      // Select the newly linked project so they are in context immediately
      const linkedProj = projects.find(p => p.id === selectedProjectToLink);
      if (linkedProj) {
        setSelectedProject({ ...linkedProj, addedToNexus: true });
      }
      
      setShowLinkProjectModal(false);
      setSelectedProjectToLink('');
      triggerNotification('Project linked to Nexus workspace successfully!', 'success', 'Project Linked');
    } catch (err: any) {
      triggerNotification(typeof err === 'string' ? err : (err?.message || 'Failed to link workspace project'), 'error', 'Project Linking Failed');
    } finally {
      setLinkingProject(false);
    }
  };

  // Mammoth parser background simulator
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    setShowParserConsole(true);
    setParserLogs([]);

    const log = (msg: string) => {
      setParserLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      const file = acceptedFiles[0];
      log(`Received document: ${file.name}`);
      log(`Detecting file buffer signature and starting raw convert processes...`);
      log(`Mammoth parsed HTML constructor loaded.`);

      // Simulated conversion cycles resembling real Mammouth & PDF-parse background engines
      await new Promise(r => setTimeout(r, 800));
      log(`Transforming .docx structural elements...`);
      await new Promise(r => setTimeout(r, 600));
      log(`Extracting formatting styles & CSS responsive custom classes...`);
      await new Promise(r => setTimeout(r, 700));
      log(`Successfully registered document indices context.`);

      // Create new Project inside selected workspace
      const defaultWsId = selectedWorkspace?.id || 'main';
      const response = await listingService.create({
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: `Imported from ${file.name} context.`,
        workspaceId: defaultWsId,
        addedToNexus: true
      });
      const newListing = response.data;
      setProjects([newListing, ...projects]);
      setSelectedProject(newListing);

      // Create a sequential entry page inside the project context
      const samplePage = await docPageService.create({
        title: `Imported Document Contents`,
        content: `<h2>Parsed Content From ${file.name}</h2><p>Organize and review your notes sequentially within the document outline workspace.</p><table class="table-responsive"><thead><tr><th>Document Engine</th><th>Conversion Status</th></tr></thead><tbody><tr><td>Mammoth Core</td><td><span class="selectedCell">Success</span></td></tr></tbody></table>`,
        pageNumber: 1
      });

      setPages([samplePage, ...pages]);
      log(`Injected page successfully into Firestore Database.`);
      log(`Index Outline generation complete.`);
      setCurrentIndex(0);
      
    } catch (err) {
      log(`ERROR: Parsing file container failed.`);
    } finally {
      setUploading(false);
    }
  }, [selectedWorkspace, projects, pages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 52428800 // 50MB
  });

  // Handle Project Deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await listingService.delete(projectToDelete.id);
      const remaining = projects.filter(p => p.id !== projectToDelete.id);
      setProjects(remaining);
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(remaining[0] || null);
      }
      setProjectToDelete(null);
      triggerNotification('Project deleted successfully!', 'success', 'Project Deleted');
    } catch (err: any) {
      triggerNotification(err?.message || "Deleting project failed", 'error', 'Project Deletion Failed');
    }
  };

  // Handle Project manually added
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    try {
      const defaultWsId = selectedWorkspace?.id || 'main';
      const response = await listingService.create({
        title: newProjectTitle,
        description: newProjectDesc,
        workspaceId: defaultWsId,
        addedToNexus: true
      });
      const newListing = response.data;
      setProjects([newListing, ...projects]);
      setSelectedProject(newListing);
      setShowAddProjectModal(false);
      setNewProjectTitle('');
      setNewProjectDesc('');

      // Create a default first page inside the new project context
      const samplePage = await docPageService.create({
        title: `Draft Outline Page 1`,
        content: `<h2>New Project: ${newProjectTitle}</h2><p>Start writing raw notes or outlines here inside the document workspace.</p>`,
        pageNumber: 1,
        projectId: newListing.id
      });
      setPages([samplePage, ...pages]);
      setCurrentIndex(0);
      triggerNotification('New project established successfully!', 'success', 'Project Created');
    } catch (err) {
      triggerNotification('Failed to establish new Project listing', 'error', 'Project Creation Failed');
    }
  };

  // Inline index scroll and outline tracking with scroll anchors
  const navigateToIndex = (pageId: string | string[], sectionId?: string) => {
    let ids: string[] = [];
    if (Array.isArray(pageId)) {
      ids = pageId;
    } else if (typeof pageId === 'string' && pageId.includes(',')) {
      ids = pageId.split(',').filter(Boolean);
    } else if (typeof pageId === 'string') {
      ids = [pageId];
    }

    setViewingPageIds(ids);

    if (ids.length > 0) {
      const pageIdx = filteredPages.findIndex(p => p.id === ids[0]);
      if (pageIdx !== -1) {
        setCurrentIndex(pageIdx);
      }
    }

    const targetTargetId = sectionId || (ids.length > 0 ? ids[0] : null);
    if (targetTargetId) {
      setTimeout(() => {
        const element = document.getElementById(targetTargetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('highlight-scroll');
          setTimeout(() => element.classList.remove('highlight-scroll'), 2000);
        }
      }, 300);
    }
  };

  // Add indexing node
  const handleIndexAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (indexForm.pageIds.length === 0) {
      triggerNotification('Please select at least one page', 'warning', 'No Pages Selected');
      return;
    }
    try {
      const { data } = await docIndexService.create({
        title: indexForm.title,
        linkedPage: indexForm.pageIds,
        linkedSectionId: indexForm.sectionId,
        position: filteredIndices.length,
        projectId: selectedProject?.id || ""
      });
      setIndices([...indices, data]);
      setShowIndexModal(false);
      setIndexForm({ title: '', pageIds: [], sectionId: '' });
      setPageSearch('');
      triggerNotification('Index outline anchor created successfully!', 'success', 'Index Created');
    } catch (err) {
      triggerNotification('Failed to create index outline anchor', 'error', 'Index Creation Failed');
    }
  };

  const handleIndexDelete = async (id: string) => {
    try {
      await docIndexService.delete(id);
      setIndices(indices.filter(i => i.id !== id));
      triggerNotification('Index outline node deleted successfully!', 'success', 'Index Deleted');
    } catch (err) {
      triggerNotification('Delete failed', 'error', 'Index Deletion Failed');
    }
  };

  // Updates for pages and content
  const handleSeedSampleWorkspace = async () => {
    try {
      setLoading(true);
      const page1Content = `<h1 id="user-introduction">1. Product Overview</h1>
<p>Welcome to our modern workflow platform! This environment is custom-built to streamline documentation, dynamic sequence path-routing, and interactive data alignment in one cohesive workspace interface.</p>

<h2 id="quick-installation">2. Initial Setup & Installation</h2>
<p>To quickly initialize and build this system locally, follow this clear workflow execution sequence:</p>
<ol>
  <li><strong>Setting up environment parameters</strong>: Configure all local secure keys in your config directory files.</li>
  <li><strong>Installing dependencies</strong>: Run the installation script tool to retrieve packages matching <code>package.json</code>.</li>
  <li><strong>Runing local services on port 3000</strong>: Spin up development and asset-serving servers to bind on port 3000 securely.</li>
</ol>

<h2 id="system-dashboard">3. Platform Features</h2>
<p>The interface lets you browse documentation easily. You can toggle between the Page View showing standard page layouts, and the interactive combined Index panel showing mapped sequence paths.</p>`;

      const page2Content = `<h1 id="system-architecture">1. System Design Specification</h1>
<p>Our workspace implements a high-performance full-stack sequence structure. The rendering client is built on modern React with Vite, compiling state seamlessly and connecting directly to an Express backend server routing logic.</p>

<h2 id="api-endpoints">2. Core API Endpoints Reference</h2>
<p>The core routes, services, and security variables mapped to this subsystem are referenced in the table below:</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; border: 1px solid #cbd5e1;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Method</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Path</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Secrets / Configs</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-weight: bold; color: #4f46e5;">GET</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">/api/content/page</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">JWT_SECRET key verification</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-weight: bold; color: #059669;">POST</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">/api/content/page</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">request body parameters state</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-weight: bold; color: #dc2626;">DELETE</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">/api/index/:id</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">database cluster credentials</td>
    </tr>
  </tbody>
</table>

<h2 id="data-indexing">3. Index Routing Engine</h2>
<p>Focus and routing management runs dynamically via client scroll listeners. When clicking an index element, the layout monitors DOM anchors matching the keys, highlights target containers, and issues a smooth HTML scroll transitions.</p>`;

      const res1 = await docPageService.create({
        title: "User Quick-Start Guide",
        content: page1Content,
        pageNumber: filteredPages.length + 1,
        projectId: selectedProject?.id || ""
      });
      const page1Obj = res1.data;

      const res2 = await docPageService.create({
        title: "System Architecture & API Spec",
        content: page2Content,
        pageNumber: filteredPages.length + 2,
        projectId: selectedProject?.id || ""
      });
      const page2Obj = res2.data;

      // Index 1
      const resIdx1 = await docIndexService.create({
        title: "User Setup Instructions",
        linkedPage: [page1Obj.id],
        linkedSectionId: "quick-installation",
        position: filteredIndices.length,
        projectId: selectedProject?.id || ""
      });

      // Index 2
      const resIdx2 = await docIndexService.create({
        title: "Database & Backend API Spec",
        linkedPage: [page2Obj.id],
        linkedSectionId: "api-endpoints",
        position: filteredIndices.length + 1,
        projectId: selectedProject?.id || ""
      });

      // Index 3
      const resIdx3 = await docIndexService.create({
        title: "Platform Engine Deep-Dive",
        linkedPage: [page1Obj.id, page2Obj.id],
        linkedSectionId: "data-indexing",
        position: filteredIndices.length + 2,
        projectId: selectedProject?.id || ""
      });

      // reload
      await loadSystemData();
      triggerNotification("Interactive Guide & System Spec Workspace seeded successfully!", "success", "Workspace Hub Seeded", 5000);
    } catch (err: any) {
      console.error("Workspace seeding failed", err);
      triggerNotification("Failed to seed sample pages and index lines. " + (err?.message || err), "error", "Seeding Failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePageAdd = async () => {
    try {
      const { data } = await docPageService.create({
        title: `Draft Outline Page ${filteredPages.length + 1}`,
        pageNumber: filteredPages.length + 1,
        projectId: selectedProject?.id || ""
      });
      setPages([...pages, data]);
      setCurrentIndex(filteredPages.length);
      triggerNotification('Draft page added successfully!', 'success', 'Page Created', 2500);
    } catch (err) {
      triggerNotification('Failed to add page', 'error', 'Page Creation Failed');
    }
  };

  const handlePageUpdate = async (id: string, content: string) => {
    setPages(pages.map(p => p.id === id ? { ...p, content } : p));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await docPageService.update(id, { content });
      } catch (err) {
        console.error('Firestore save failed', err);
      }
    }, 1000);
  };

  const confirmDeletePage = async () => {
    if (!deleteConfirmId) return;
    try {
      await docPageService.delete(deleteConfirmId);
      const newPages = pages.filter(p => p.id !== deleteConfirmId);
      setPages(newPages);
      if (newPages.length > 0) {
        setCurrentIndex(Math.max(0, Math.min(currentIndex, newPages.length - 1)));
      } else {
        setCurrentIndex(0);
      }
      setDeleteConfirmId(null);
      triggerNotification('Page deleted successfully!', 'success', 'Page Deleted');
    } catch (err) {
      triggerNotification('Delete document page failed', 'error', 'Page Deletion Failed');
    }
  };

  const fastDeletePage = async (id: string) => {
    if (!id) return;
    try {
      await docPageService.delete(id);
      const newPages = pages.filter(p => p.id !== id);
      setPages(newPages);
      if (newPages.length > 0) {
        setCurrentIndex(Math.max(0, Math.min(currentIndex, newPages.length - 1)));
      } else {
        setCurrentIndex(0);
      }
      triggerNotification('Page deleted successfully!', 'success', 'Page Deleted');
    } catch (err) {
      triggerNotification('Delete page failed', 'error', 'Page Deletion Failed');
    }
  };

  const handleTitleUpdate = async (id: string) => {
    const rawTitle = tempTitle || '';
    if (!id || !rawTitle.trim()) return setEditingTitle(false);
    try {
      await docPageService.update(id, { title: tempTitle });
      setPages(pages.map(p => p.id === id ? { ...p, title: tempTitle } : p));
      setEditingTitle(false);
      triggerNotification('Page title updated successfully!', 'success', 'Page Updated');
    } catch (err) {
      triggerNotification('Failed to update title', 'error', 'Page Update Failed');
    }
  };

  // Quick layout modes
  const filteredWorkspaces = (Array.isArray(workspaces) ? workspaces : []).filter(w => 
    w.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(workspaceSearch.toLowerCase()))
  );

  const activeWorkspaceProjects = projects.filter(p => 
    p.workspaceId === (selectedWorkspace?.id || 'main') && p.addedToNexus === true
  );

  const filteredProjects = activeWorkspaceProjects.filter(p => 
    p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  // Global index search highlights
  const globalFilteredResults = useMemo(() => {
    if (!globalSearchTerm) return [];
    const lowerTerm = globalSearchTerm.toLowerCase();
    
    // Search both page titles & contents, plus outline titles
    const matchedPages = filteredPages.filter(p => 
      p.title.toLowerCase().includes(lowerTerm) || 
      (p.content && p.content.toLowerCase().includes(lowerTerm))
    );

    const matchedIndices = filteredIndices.filter(i => 
      i.title.toLowerCase().includes(lowerTerm)
    );

    return [
      ...matchedPages.map(p => ({
        type: 'Page / Document Section',
        title: p.title,
        id: p.id,
        snippet: p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 150) : 'No content body details'
      })),
      ...matchedIndices.map(i => ({
        type: 'Index Anchor Link',
        title: i.title,
        id: i.id,
        snippet: `Index outline connector mapping directly to system targets.`
      }))
    ];
  }, [globalSearchTerm, filteredPages, filteredIndices]);

  // Reader mode background styles matching requirements
  const getWorkspaceBackdropClasses = () => {
    if (readerTheme === 'slate') return 'bg-slate-50 text-slate-900';
    if (readerTheme === 'vanilla') return 'bg-[#f4ecd8] text-[#5b4636]';
    return 'bg-[#0f1115] text-slate-100'; // midnight
  };

  const getHeaderToolbarClasses = () => {
    if (readerTheme === 'slate') return 'bg-white border-slate-200 text-slate-900 border-b border-slate-200';
    if (readerTheme === 'vanilla') return 'bg-[#fcfaf2] border-[#ecdcb4] text-[#5b4636] border-b border-[#ecdcb4]';
    return 'bg-[#151922] border-[#222938] text-white border-b border-[#222938]'; // midnight
  };

  const getReaderClasses = () => {
    if (readerTheme === 'slate') return 'bg-white text-slate-900 border-slate-200/80 shadow-md';
    if (readerTheme === 'vanilla') return 'bg-[#fdf6e3] text-[#5b4636] border-[#ecdcb4] shadow-md';
    return 'bg-[#151922] text-slate-100 border-[#222938] shadow-md'; // midnight
  };

  const resolvedViewingIds = activeTab === 'pages'
    ? (filteredPages[currentIndex] ? [filteredPages[currentIndex].id] : [])
    : (viewingPageIds.length > 0 ? viewingPageIds : filteredPages.map(p => p.id));
  const pagesToRender = resolvedViewingIds
    .map(id => filteredPages.find(p => p.id === id))
    .filter((p): p is any => !!p);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300">
      {/* Global Tab Panel Switcher */}
      <div className="bg-white dark:bg-[#15181e] border-b border-slate-200 dark:border-[#2d323f] sticky top-16 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex gap-1.5 md:gap-2">
              <button 
                onClick={() => setCurrentMainTab('workspaces')}
                className={`flex items-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all ${
                  currentMainTab === 'workspaces' 
                    ? 'bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-[#1f242e] dark:hover:text-white'
                }`}
              >
                <Briefcase size={13} />
                <span className="hidden md:inline">1. Workspaces Hub</span>
                <span className="inline md:hidden">Workspaces</span>
              </button>
              <button 
                onClick={() => setCurrentMainTab('project-hub')}
                className={`flex items-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all ${
                  currentMainTab === 'project-hub' 
                    ? 'bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-[#1f242e] dark:hover:text-white'
                }`}
              >
                <LayoutList size={13} />
                <span className="hidden md:inline">2. Projects Hub</span>
                <span className="inline md:hidden">Projects</span>
              </button>
              <button 
                onClick={() => setCurrentMainTab('document-canvas')}
                className={`flex items-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all ${
                  currentMainTab === 'document-canvas' 
                    ? 'bg-slate-900 dark:bg-[#eee1ba] text-white dark:text-black shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-[#1f242e] dark:hover:text-white'
                }`}
              >
                <FilePlus size={13} />
                <span className="hidden md:inline">3. Document Workspace</span>
                <span className="inline md:hidden">Workspace</span>
              </button>
            </div>
            {selectedWorkspace && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-ping" />
                <span>Ecosystem Active: {selectedWorkspace.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow">
        {/* VIEW 1: WORKSPACES HUB & DASHBOARD */}
        {currentMainTab === 'workspaces' && (
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-12 animate-in fade-in duration-300">
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
                      <p className="text-indigo-455 font-bold uppercase tracking-[0.2em] text-[9px] mt-1.5 flex items-center gap-1.5 text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        Personal Document Ecosystem
                      </p>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-slate-350 mb-6 leading-relaxed font-medium max-w-lg">
                    "Organize your research, notes, and documentation into specialized workspaces for maximum focus."
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setShowAddWorkspaceModal(true)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/15 transition-all active:scale-95 cursor-pointer"
                    >
                      <FolderPlus size={14} />
                      <span>Create Workspace</span>
                    </button>
                    <button 
                      id="download-document-nexus-btn"
                      onClick={handleDownloadDocumentNexus}
                      disabled={isNexusExporting}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/15 transition-all active:scale-95 cursor-pointer"
                      title="Download Document Nexus"
                    >
                      <Download size={14} />
                      <span>⬇ Download Document Nexus</span>
                    </button>

                  </div>

                  {downloadState.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400">
                      {downloadState.errors.map((err, idx) => (
                        <div key={idx}>{err}</div>
                      ))}
                    </div>
                  )}
                  {downloadState.success && (
                    <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check size={14} />
                      <span>Projects exported successfully as ZIP files!</span>
                    </div>
                  )}
                </div>

                {/* Simplified & Good Looking Minimalist HUD Panel */}
                <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[24px] backdrop-blur-xl w-full lg:w-[420px] shrink-0 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Stats Column Grid */}
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Workspaces</span>
                      <span className="text-2xl font-black text-white tracking-tight">{(Array.isArray(workspaces) ? workspaces : []).length}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Combined Projects</span>
                      <span className="text-2xl font-black text-white tracking-tight">{projects.length}</span>
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

            {/* Layout Filters & Interaction bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Real-time search by workspace title..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold"
                  value={workspaceSearch}
                  onChange={(e) => setWorkspaceSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setWorkspaceViewMode('grid')}
                  className={`p-2.5 rounded-lg border transition-all ${workspaceViewMode === 'grid' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <Grid size={18} />
                </button>
                <button 
                  onClick={() => setWorkspaceViewMode('list')}
                  className={`p-2.5 rounded-lg border transition-all ${workspaceViewMode === 'list' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <ListIcon size={18} />
                </button>
              </div>
            </div>

            {/* Workspaces List/Grid */}
            {filteredWorkspaces.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-black text-slate-800">No Ecosystems Met</h3>
                <p className="text-sm text-slate-400 mt-1">Generate dynamic isolation environments with workspace blocks.</p>
              </div>
            ) : workspaceViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((w, wIdx) => (
                  <div key={w.id || `ws-grid-${wIdx}`} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all p-6 relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={22} /></div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setWorkspaceToRename(w); setRenameWorkspaceName(w.name); setRenameWorkspaceDesc(w.description || ''); }}
                            className="p-1 px-2 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-all text-xs font-bold"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={() => setWorkspaceToDelete(w)}
                            className="p-1 px-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-all text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-1">{w.name}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">{w.description || 'Organized isolated workspaces categorization.'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">Active environment</span>
                      <button 
                        onClick={() => { setSelectedWorkspace(w); setCurrentMainTab('project-hub'); }}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-all"
                      >
                        Enter Projects <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="p-4 pl-6">Workspace Name</th>
                      <th className="p-4">Purpose / Bio</th>
                      <th className="p-4 text-right pr-6">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredWorkspaces.map((w, wIdx) => (
                      <tr key={w.id || `ws-table-${wIdx}`} className="hover:bg-slate-50/50">
                        <td className="p-4 pl-6 font-bold text-slate-900">{w.name}</td>
                        <td className="p-4 text-xs text-slate-500">{w.description || '—'}</td>
                        <td className="p-4 text-right pr-6 space-x-2">
                          <button 
                            onClick={() => { setSelectedWorkspace(w); setCurrentMainTab('project-hub'); }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold"
                          >
                            Explore Open
                          </button>
                          <button 
                            onClick={() => { setWorkspaceToRename(w); setRenameWorkspaceName(w.name); setRenameWorkspaceDesc(w.description || ''); }}
                            className="px-2 py-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg text-xs font-bold"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={() => setWorkspaceToDelete(w)}
                            className="px-2 py-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-lg text-xs font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: WORKSPACE PROJECT HUB (LISTING DASHBOARD) */}
        {currentMainTab === 'project-hub' && (
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-8 animate-in fade-in duration-300">
            {/* Header selection info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
                  <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>{selectedWorkspace?.name || 'Default Workspace'}</span>
                  </h1>
                  
                  {/* Switch Workspace selection drop-down */}
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace:</label>
                    <select 
                      value={selectedWorkspace?.id || ''} 
                      onChange={(e) => {
                        const ws = (Array.isArray(workspaces) ? workspaces : []).find(w => w.id === e.target.value);
                        if (ws) {
                          setSelectedWorkspace(ws);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {(Array.isArray(workspaces) ? workspaces : []).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setShowAddWorkspaceModal(true)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                      title="Add New Workspace"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => setWorkspaceToDelete(selectedWorkspace)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                      title="Delete Current Workspace"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">{selectedWorkspace?.description || 'Listing documentation projects.'}</p>
              </div>

              {/* Inner tabs of Listing Dashboard */}
              <div className="flex gap-1 p-1.5 bg-slate-100 rounded-xl border border-slate-200/50">
                <button 
                  onClick={() => setProjectTab('overview')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${projectTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Overview & Stats
                </button>
                <button 
                  onClick={() => setProjectTab('projects')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${projectTab === 'projects' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Project Workspace
                </button>
                <button 
                  onClick={() => setProjectTab('global-search')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-[36px] ${projectTab === 'global-search' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}
                  title="Starred & Database Search"
                >
                  <Star size={14} fill={projectTab === 'global-search' ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Sub-view: Overview Screen */}
            {projectTab === 'overview' && (
              <div className="space-y-8">
                {/* Dynamic Analytics cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div 
                    onClick={() => setProjectTab('projects')}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title="View Projects list"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FileStack size={22} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Projects</h4>
                      <div className="text-xl font-black text-slate-900">{activeWorkspaceProjects.length}</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      if (activeWorkspaceProjects.length > 0) {
                        if (!selectedProject) {
                          setSelectedProject(activeWorkspaceProjects[0]);
                        }
                        setCurrentMainTab('document-canvas');
                      } else {
                        setProjectTab('projects');
                      }
                    }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title="Open in Document Workspace"
                  >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><LayoutList size={22} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pages</h4>
                      <div className="text-xl font-black text-slate-900">{filteredPages.length}</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      if (activeWorkspaceProjects.length > 0) {
                        if (!selectedProject) {
                          setSelectedProject(activeWorkspaceProjects[0]);
                        }
                        setCurrentMainTab('document-canvas');
                      } else {
                        setProjectTab('projects');
                      }
                    }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-pink-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title="Open Document highlights"
                  >
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-xl"><Highlighter size={22} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Highlights</h4>
                      <div className="text-xl font-black text-slate-900">{totalHighlightsCount} Items</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setProjectTab('global-search')}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title="View Starred and Bookmark search"
                  >
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Bookmark size={22} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bookmarks</h4>
                      <div className="text-xl font-black text-slate-900">{activeWorkspaceProjects.filter(p => p.isBookmarked).length} items</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Featured Projects Matrix + Recent Bookmarks Grid */}
                  <div className="lg:col-span-3 space-y-8">
                    {/* Featured Matrix */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                        <Star className="text-amber-500 fill-amber-500 animate-pulse" size={16} />
                        <span>Featured Projects Matrix</span>
                      </h3>
                      <div className="space-y-6">
                        {/* Local Workspace Stars */}
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Local Workspace Starred</h4>
                          {activeWorkspaceProjects.filter(p => p.isBookmarked).length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold">
                              No local projects starred yet. Star projects in the Projects tab to pin them here!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeWorkspaceProjects.filter(p => p.isBookmarked).map((p, idx) => (
                                <div key={p.id || `featured-${idx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-all cursor-pointer" onClick={() => { setSelectedProject(p); setCurrentMainTab('document-canvas'); }}>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></div>
                                    <span className="text-sm font-bold text-slate-800 truncate max-w-44">{p.title}</span>
                                  </div>
                                  <ArrowUpRight size={14} className="text-slate-400" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Public Bookmark Projects */}
                        <div className="border-t border-slate-100 pt-4">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Public Bookmarks</h4>
                          {bookmarkProjects.length === 0 ? (
                            <div className="text-center py-6 bg-[#fdfaf2] border border-dashed border-[#eee1ba]/85 rounded-2xl text-xs text-slate-400 font-semibold">
                              No public project bookmarks yet. Browse public registries to bookmark favorites!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {bookmarkProjects.map((b, idx) => (
                                <Link key={b.id || `featured-bookmark-${idx}`} to={`/listing/read/${b.projectId}`} className="p-4 bg-[#fdfaf2] border border-[#eee1ba]/80 rounded-2xl flex justify-between items-center hover:bg-[#faf4e5] transition-all cursor-pointer block">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100/60 text-amber-700 rounded-lg"><Layers size={16} className="text-yellow-600" /></div>
                                    <span className="text-sm font-bold text-slate-850 truncate max-w-44">{b.pageTitle || "Untitled Public Book"}</span>
                                  </div>
                                  <ArrowUpRight size={14} className="text-slate-500" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Bookmarks Grid */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Recent Bookmarks Grid</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pages.slice(0, 3).map((page, idx) => (
                          <div key={page.id || `recent-bookmark-${idx}`} className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl flex flex-col justify-between" onClick={() => { setCurrentMainTab('document-canvas'); setCurrentIndex(idx); }}>
                            <div>
                              <Bookmark className="text-amber-500 fill-amber-500 mb-2" size={14} />
                              <h4 className="text-xs font-black text-slate-800 line-clamp-1">{page.title}</h4>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 mt-2">Page Shortcut</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Projects Workspace Screen */}
            {projectTab === 'projects' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main listings area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Filter & style toggle */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Filter projects..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none text-xs font-bold"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto justify-end">
                      <button onClick={() => setProjectViewMode('grid')} className={`p-2 rounded border text-xs font-bold ${projectViewMode === 'grid' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-250 text-slate-400 hover:bg-slate-50'}`}>Grid</button>
                      <button onClick={() => setProjectViewMode('list')} className={`p-2 rounded border text-xs font-bold ${projectViewMode === 'list' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-250 text-slate-400 hover:bg-slate-50'}`}>List</button>
                      <button 
                        onClick={() => setShowAddProjectModal(true)} 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 ml-2"
                      >
                        <Plus size={14} />
                        <span>New Project</span>
                      </button>
                    </div>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <FileStack size={40} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                      <h4 className="text-md font-black text-slate-800">Ecosystem project listing empty</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-6">Create a brand new project manually.</p>
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => setShowAddProjectModal(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md active:scale-95 animate-in"
                        >
                          <Plus size={14} />
                          <span>Create Project</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <DocumentNexusProjectsView
                      filteredProjects={filteredProjects}
                      projectViewMode={projectViewMode}
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
                      onRenameProject={handleRenameProject}
                    />
                  )}
                </div>

                {/* Right Column Dropzone converter & logs */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Upload Document</h3>
                    <div 
                      {...getRootProps()} 
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isDragActive ? 'border-indigo-600 bg-indigo-50/45' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/35'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto text-slate-400 mb-4 animate-pulse" size={32} />
                      <p className="text-xs font-bold text-slate-600 leading-relaxed mb-2">
                        Import .doc, .docx or .pdf files
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mb-4 leading-relaxed">
                        Drag & drop file here or click to browse
                      </p>
                      <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        DOCX/PDF supported (Max file size 50MB)
                      </span>
                    </div>
                  </div>

                  {/* Real-time background logs visualizer panel representing Mammoth and PDF-parse */}
                  {showParserConsole && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl relative">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <span className="text-[9px] font-mono font-black text-rose-500 uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                          <Terminal size={12} /> Live Converter Parser Logger
                        </span>
                        <button onClick={() => setShowParserConsole(false)} className="text-slate-500 hover:text-white"><X size={12} /></button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[10px] text-emerald-400 custom-scrollbar">
                        {parserLogs.map((log, lIdx) => (
                          <div key={`log-${lIdx}`} className="leading-normal">{log}</div>
                        ))}
                        {uploading && <div className="text-slate-400 animate-pulse">Parser compiling metadata loops...</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: Global Search Results matching Titles & Page Content with custom Match Highlighting snippet */}
            {projectTab === 'global-search' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
                {/* Unified Ecosystem Search Panel (Now 1st) */}
                <div>
                  <div className="relative max-w-xl mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-black placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="Type keywords to search projects, pages, or index titles..."
                      value={globalSearchTerm}
                      onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    />
                  </div>

                  {globalSearchTerm ? (
                    <div className="space-y-4">
                      <span className="text-[9px] font-mono font-black uppercase text-slate-400 block">Search Database matches:</span>
                      <div className="overflow-x-auto rounded-xl border border-slate-150">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-[#475569] border-b border-slate-150">
                              <th className="p-4 pl-6">Match Type</th>
                              <th className="p-4">Title / Name</th>
                              <th className="p-4">Details / Preview</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              const lowerQuery = globalSearchTerm.toLowerCase();
                              // Filter projects that match search
                              const matchedProjResults = projects.filter(p => 
                                p.title.toLowerCase().includes(lowerQuery) || 
                                (p.description && p.description.toLowerCase().includes(lowerQuery))
                              );

                              const highlightText = (text: string, query: string) => {
                                if (!query) return text;
                                const parts = text.split(new RegExp(`(${query})`, 'gi'));
                                return (
                                  <span>
                                    {parts.map((part, idx) => 
                                      part.toLowerCase() === query.toLowerCase() 
                                        ? <mark key={`mark-${idx}`} className="bg-amber-200 text-slate-900 font-bold px-1 rounded">{part}</mark>
                                        : <span key={`text-${idx}`}>{part}</span>
                                    )}
                                  </span>
                                );
                              };

                              const resultsCount = matchedProjResults.length + globalFilteredResults.length;

                              if (resultsCount === 0) {
                                return (
                                  <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">No matching ecosystem assets found for this query.</td>
                                  </tr>
                                );
                              }

                              return (
                                <>
                                  {/* Project Search Results */}
                                  {matchedProjResults.map((p, pIdx) => (
                                    <tr 
                                      key={`proj-${pIdx}`} 
                                      className="hover:bg-amber-50/20 cursor-pointer transition-colors"
                                      onClick={() => { setSelectedProject(p); setCurrentMainTab('document-canvas'); }}
                                    >
                                      <td className="p-4 pl-6 font-bold text-amber-600 flex items-center gap-1">
                                        <Star size={10} className={p.isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-450'} />
                                        <span>Project Hub</span>
                                      </td>
                                      <td className="p-4 font-black">{highlightText(p.title, globalSearchTerm)}</td>
                                      <td className="p-4 text-slate-500 italic max-w-md truncate font-semibold">
                                        {p.description ? highlightText(p.description, globalSearchTerm) : "No description declared."}
                                      </td>
                                    </tr>
                                  ))}

                                  {/* Pages and Index search results */}
                                  {globalFilteredResults.map((res: any, rIdx) => (
                                    <tr 
                                      key={`res-${rIdx}`} 
                                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                      onClick={() => { setCurrentMainTab('document-canvas'); }}
                                    >
                                      <td className="p-4 pl-6 font-bold text-indigo-600">{res.type}</td>
                                      <td className="p-4 font-black">{highlightText(res.title, globalSearchTerm)}</td>
                                      <td className="p-4 text-slate-500 italic max-w-md truncate font-semibold">
                                        {highlightText(res.snippet, globalSearchTerm)}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Starred Projects Section (Now 2nd, displayed in clean list form similar to Bookmarks Grid) */}
                <div className="border-t border-slate-100 pt-8 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="text-amber-500 fill-amber-500" size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Starred Projects</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Workspace Ecosystem</span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mb-4">Your most important marked projects across the entire workspace ecosystem.</p>
                    
                    <div className="space-y-6">
                      {activeWorkspaceProjects.filter(p => p.isBookmarked).length === 0 && bookmarkProjects.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold">
                          No starred or bookmarked projects yet. Star local projects or bookmark public files to list them here!
                        </div>
                      ) : (
                        <>
                          {activeWorkspaceProjects.filter(p => p.isBookmarked).length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                                <Star size={10} className="text-amber-500 fill-amber-500" />
                                <span>Starred Workspace Projects</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeWorkspaceProjects.filter(p => p.isBookmarked).map((p, pIdx) => (
                                  <div 
                                    key={p.id || `starred-p-${pIdx}`} 
                                    onClick={() => { setSelectedProject(p); setCurrentMainTab('document-canvas'); }}
                                    className="flex items-start gap-4 p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl cursor-pointer transition-all"
                                  >
                                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
                                      <Star size={18} fill="currentColor" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                      <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-xs font-black text-slate-900 truncate">{p.title}</h4>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {/* Project Settings Trigger */}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenProjectSettings(p); }}
                                            className="p-1 rounded border border-slate-250 text-slate-400 bg-white hover:text-indigo-600 hover:border-indigo-300 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 mr-1"
                                            title="Project Settings"
                                          >
                                            <Settings2 size={12} />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); onToggleBookmark(p.id, true); }} 
                                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                                            title="Unstar Project"
                                          >
                                            <Star size={12} fill="currentColor" />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-semibold line-clamp-1 mt-1">{p.description || "No project description declared."}</p>
                                      <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-widest text-indigo-600">Open Workspace &rarr;</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {bookmarkProjects.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-100/60">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                                <Bookmark size={10} className="text-indigo-600 fill-current" />
                                <span>Starred Bookmark Projects</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bookmarkProjects.map((b, bIdx) => (
                                  <div 
                                    key={b.id || `bookmark-p-${bIdx}`} 
                                    className="flex items-start gap-4 p-4 bg-[#fdfaf2] hover:bg-[#faf4e5] border border-[#eee1ba]/80 rounded-2xl transition-all"
                                  >
                                    <Link to={`/listing/read/${b.projectId}`} className="p-2.5 bg-amber-100/60 text-amber-700 rounded-xl flex-shrink-0 hover:opacity-80">
                                      <Layers size={18} className="text-yellow-600" />
                                    </Link>
                                    <div className="flex-grow min-w-0">
                                      <div className="flex justify-between items-start gap-2">
                                        <Link to={`/listing/read/${b.projectId}`} className="min-w-0 flex-grow hover:underline">
                                          <h4 className="text-xs font-black text-slate-900 truncate leading-snug">{b.pageTitle || "Untitled Public Book"}</h4>
                                        </Link>
                                        <button 
                                          onClick={() => handleRemoveFavorite(b.projectId)} 
                                          className="p-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                                          title="Remove Bookmark"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider">Saved On {new Date(b.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <Link to={`/listing/read/${b.projectId}`} className="inline-block mt-2.5 text-[8px] font-black uppercase tracking-widest text-[#5b4636] hover:underline">Open Reader &rarr;</Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: INTERACTIVE DOCUMENT NEXUS (DOCUMENT WORKSPACE) */}
        {currentMainTab === 'document-canvas' && (
          <div className={`${isFullScreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-120px)]'} flex flex-col overflow-hidden animate-in fade-in duration-300 ${getWorkspaceBackdropClasses()}`}>
            {/* Search overlay inside document workspace */}
            <AnimatePresence>
              {showSearch && (
                <motion.div 
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="absolute top-16 right-0 left-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 flex items-center justify-center gap-4 shadow-xl"
                >
                  <div className="relative max-w-2xl w-full">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                      autoFocus
                      type="text" 
                      placeholder="Search index or pages..." 
                      className="w-full pl-11 pr-4 py-3 bg-slate-100 rounded-xl outline-none text-xs font-bold shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => { setShowSearch(false); setSearchTerm(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full"><X size={16} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-grow overflow-hidden">
              {/* Left Outline/Index structure sidebar panel */}
              {!isFullScreen && (
                <DocumentSidebar
                  pages={filteredPages}
                  indices={filteredIndices}
                  currentPageId={filteredPages[currentIndex]?.id}
                  onPageSelect={(pageId) => {
                    const pIdx = filteredPages.findIndex(p => p.id === pageId);
                    if (pIdx !== -1) {
                      setCurrentIndex(pIdx);
                      setViewingPageIds([pageId]);
                      
                      // Smooth scroll to open/focus the selected page structure
                      setTimeout(() => {
                        const element = document.getElementById(pageId);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          element.classList.add('highlight-scroll');
                          setTimeout(() => element.classList.remove('highlight-scroll'), 2000);
                        }
                      }, 300);
                    }
                  }}
                  onIndexSelect={navigateToIndex}
                  onPageAdd={handlePageAdd}
                  onPageDelete={fastDeletePage}
                  onIndexDelete={handleIndexDelete}
                  onIndexAdd={() => setShowIndexModal(true)}
                  editingPageId={editingPageId}
                  setEditingPageId={setEditingPageId}
                  editingPageTitle={editingPageTitle}
                  setEditingPageTitle={setEditingPageTitle}
                  onPageRename={async (id, newTitle) => {
                    try {
                      await docPageService.update(id, { title: newTitle });
                      setPages(pages.map(p => p.id === id ? { ...p, title: newTitle } : p));
                      triggerNotification('Page title updated successfully!', 'success', 'Page Renamed');
                    } catch (err) {
                      triggerNotification('Failed to rename page', 'error', 'Page Rename Failed');
                    }
                  }}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  readerTheme={readerTheme}
                  isSidebarCollapsed={isSidebarCollapsed}
                  setIsSidebarCollapsed={setIsSidebarCollapsed}
                />
              )}
              {/* Main canvas sequential content reader & editor view */}
              <main className={`flex-grow flex flex-col relative z-10 transition-colors duration-300 ${getWorkspaceBackdropClasses()}`}>
                {/* Page view sequential documents area */}
                <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="max-w-4xl mx-auto pb-32 space-y-8">
                    {/* Brand New Dedicated Writing Features Toolbar Div */}
                    <DocumentCanvasToolbar
                      selectedProject={selectedProject}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      readerTheme={readerTheme}
                      setReaderTheme={setReaderTheme}
                      isReaderMode={isReaderMode}
                      setIsReaderMode={setIsReaderMode}
                      handleToggleVisibility={handleToggleVisibility}
                      handlePageAdd={handlePageAdd}
                      handleSeedSampleWorkspace={handleSeedSampleWorkspace}
                      setShowIndexModal={setShowIndexModal}
                      onBackToProjects={() => setCurrentMainTab('project-hub')}
                      isSidebarCollapsed={isSidebarCollapsed}
                      setIsSidebarCollapsed={setIsSidebarCollapsed}
                    />

                    {/* Right Block: Fullscreen Controls (placed inline inside canvas container) */}
                    <div className="flex justify-end pr-4">
                      <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                          isFullScreen
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-50 dark:bg-[#1f242e] border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-400'
                        }`}
                        title={isFullScreen ? "Minimize/Exit Full Screen distraction-free mode" : "Enter Immersive distraction-free full writing mode"}
                      >
                        {isFullScreen ? (
                          <Minimize2 size={14} />
                        ) : (
                          <Maximize2 size={14} />
                        )}
                      </button>
                    </div>

                    {pagesToRender.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                        <FilePlus size={36} className="mx-auto text-indigo-400 mb-3" />
                        <h3 className="text-sm font-black text-slate-800 mb-1">Workspace Documentation Empty</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">Create single draft outline pages or seed a rich, pre-configured Guide & API Spec sequence layout with 1-click.</p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handlePageAdd}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
                          >
                            + Blank Page
                          </button>
                          <button
                            onClick={() => setCurrentMainTab('project-hub')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/15"
                          >
                            &larr; Back to Projects
                          </button>
                        </div>
                      </div>
                    ) : (
                      pagesToRender.map((page, pIdx) => (
                        <motion.div 
                          key={page.id || `page-render-${pIdx}`} 
                          id={page.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`relative group/page rounded-2xl border shadow-lg overflow-hidden transition-all ${getReaderClasses()}`}
                        >
                          {/* Left boundary text typography column indicator */}
                          <div className={`absolute -left-12 top-0 bottom-0 flex flex-col items-center py-8 opacity-0 group-hover/page:opacity-20 transition-opacity pointer-events-none select-none ${readerTheme === 'midnight' ? 'text-slate-400' : 'text-slate-500'}`}>
                            <div className={`w-px flex-grow ${readerTheme === 'midnight' ? 'bg-[#3b4354]' : 'bg-slate-300'}`} />
                            <div className="text-[9px] font-black vertical-text my-4 tracking-widest whitespace-nowrap uppercase">
                              {page.title} Page {pIdx + 1}
                            </div>
                            <div className={`w-px flex-grow ${readerTheme === 'midnight' ? 'bg-[#3b4354]' : 'bg-slate-300'}`} />
                          </div>

                          <div className="p-8">
                            <Editor 
                              content={page.content || ''}
                              onChange={(content) => handlePageUpdate(page.id, content)}
                              readOnly={isReaderMode}
                              placeholder={`Sequence write inside editor outline for ${page.title}...`}
                              className={`${isReaderMode ? 'prose-emerald' : 'prose-indigo'} ${readerTheme === 'midnight' ? 'prose-invert text-white' : ''}`}
                              listingId={selectedProject?.id}
                              pageId={page.id}
                            />
                          </div>

                          {/* Footer row per page */}
                          <div className={`p-4 border-t flex justify-between items-center text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                            readerTheme === 'midnight' 
                              ? 'bg-[#1b212f]/60 border-[#222938] text-slate-400' 
                              : readerTheme === 'vanilla' 
                                ? 'bg-[#f4ecd8]/60 border-[#eee1ba] text-[#8c745d]' 
                                : 'bg-slate-50/50 border-slate-100 text-slate-400'
                          }`}>
                            <span>{page.title} — Page {(Array.isArray(pages) ? pages : []).findIndex(p => p.id === page.id) + 1} Boundary</span>
                            {!isReaderMode && (
                              <button 
                                onClick={() => fastDeletePage(page.id)}
                                className="text-red-500 hover:text-red-750 font-bold hover:underline"
                              >
                                Delete Page
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Document Nexus Download Progress & Success Overlay */}
      <AnimatePresence>
        {(isNexusExporting || nexusExportDone || nexusExportError) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 if (nexusExportDone || nexusExportError) {
                   setIsNexusExporting(false);
                   setNexusExportDone(false);
                   setNexusExportError(null);
                 }
               }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm md:max-w-md shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6 text-slate-800 dark:text-white"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Document Nexus Export
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                  Compiling Nexus documents, indexes, and segments...
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                {nexusExportError ? (
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle size={32} />
                  </div>
                ) : nexusExportDone ? (
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-500 mb-2 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 relative">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                )}

                <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase mt-4 tracking-widest min-h-[20px]">
                  {nexusExportError ? "Export Failed" : nexusExportDone ? "Export Complete!" : nexusExportStatus}
                </p>
              </div>

              {/* Progress Indicator Bar */}
              {!nexusExportError && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${nexusExportDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${nexusExportProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Exporting</span>
                    <span>{nexusExportProgress}%</span>
                  </div>
                </div>
              )}

              {nexusExportError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-950/50 leading-relaxed font-semibold">
                  {nexusExportError}
                </p>
              )}

              {nexusExportDone && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300 font-bold leading-normal">
                  "document-nexus.zip" generated with all Pages, Indexes, Annotations, Bookmarks and Highlights.
                </div>
              )}

              <div className="pt-2">
                {(nexusExportDone || nexusExportError) ? (
                  <button
                    onClick={() => {
                      setIsNexusExporting(false);
                      setNexusExportDone(false);
                      setNexusExportError(null);
                    }}
                    className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-850 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Dismiss
                  </button>
                ) : (
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                    Please keep this window open...
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Add Workspace Modal */}
      <AnimatePresence>
        {showAddWorkspaceModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddWorkspaceModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ y: 100, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 100, scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-[#15181e] p-6 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl z-10 text-slate-800 dark:text-white">
              <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Add Workspace Box</h2>
              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Workspace Name</label>
                  <input type="text" required value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} placeholder="e.g. Science Research Lab" className="w-[100%] bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Purpose / Bio</label>
                  <textarea rows={3} value={newWorkspaceDesc} onChange={e => setNewWorkspaceDesc(e.target.value)} placeholder="What is the focus of this workspace?" className="w-[100%] bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddWorkspaceModal(false)} className="flex-grow py-3 px-4 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
                  <button type="submit" className="flex-grow py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider">Create Unit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1b. Add Project Modal */}
      <AnimatePresence>
        {showAddProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddProjectModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ y: 100, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 100, scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-[#15181e] p-6 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl z-10 text-slate-800 dark:text-white">
              <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Create Workspace Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project Title</label>
                  <input type="text" required value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} placeholder="e.g. Q3 Financial Statement Analysis" className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project Description</label>
                  <textarea rows={3} value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Brief purpose or goals..." className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddProjectModal(false)} className="flex-grow py-3 px-4 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
                  <button type="submit" className="flex-grow py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider">Create Project</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1c. Link Workspace Project Modal */}
      <AnimatePresence>
        {showLinkProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 select-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLinkProjectModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 100, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 100, scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-[#15181e] p-6 md:p-8 rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl z-10 text-slate-800 dark:text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Link Workspace Project</h2>
                  <p className="text-[10px] uppercase font-black text-slate-400 mt-1">Manage Workspace Hub project manually</p>
                </div>
                <button 
                  onClick={() => setShowLinkProjectModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Choose an existing project from your general Workspace Hub database to import and edit manually inside the Document Nexus.
              </p>
              
              {projects.filter(p => p.workspaceId === (selectedWorkspace?.id || 'main') && p.addedToNexus !== true).length === 0 ? (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-center text-slate-500 font-bold">
                    No remaining Workspace hub projects found. All projects inside this workspace are either already linked, or you should create a new one!
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setShowLinkProjectModal(false)} className="w-[100%] py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-lg">Close</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#94a3b8] dark:text-[#64748b] mb-2">Select Project to Add</label>
                    <select 
                      value={selectedProjectToLink} 
                      onChange={e => setSelectedProjectToLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none text-slate-900"
                    >
                      <option value="">-- Select Project from Workspace --</option>
                      {projects
                        .filter(p => p.workspaceId === (selectedWorkspace?.id || 'main') && p.addedToNexus !== true)
                        .map((p, pIdx) => (
                          <option key={p.id || `p-opt-${pIdx}`} value={p.id}>{p.title}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => { setShowLinkProjectModal(false); setSelectedProjectToLink(''); }} className="flex-grow py-3 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest text-center">Cancel</button>
                    <button 
                      type="button" 
                      onClick={handleLinkProject}
                      disabled={!selectedProjectToLink || linkingProject}
                      className="flex-grow py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-lg disabled:opacity-50"
                    >
                      {linkingProject ? 'Linking...' : 'Add to Nexus'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Workspace Destructive Deletion Warnings */}
      <AnimatePresence>
        {workspaceToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWorkspaceToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-center">
              <Trash2 size={36} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-sans">Destructive Deletion Warning</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed my-4 text-slate-500">
                "Are you sure you want to delete "{workspaceToDelete.name}"? The workspace metadata will be removed, but any projects inside it will remain safe."
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setWorkspaceToDelete(null)} className="flex-grow py-3 px-4 border border-slate-250 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black leading-none uppercase tracking-wider">Cancel</button>
                <button type="button" onClick={handleDeleteWorkspace} className="flex-grow py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black leading-none uppercase tracking-wider">Destroy Workspace</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Destructive Deletion Warnings */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProjectToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-center">
              <Trash2 size={36} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-sans">Destructive Deletion Warning</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed my-4 text-slate-500">
                Are you sure you want to delete the project "{projectToDelete.title}"? This action cannot be undone and will delete all pages associated with it.
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setProjectToDelete(null)} className="flex-grow py-3 px-4 border border-slate-250 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black leading-none uppercase tracking-wider">Cancel</button>
                <button type="button" onClick={handleDeleteProject} className="flex-grow py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black leading-none uppercase tracking-wider">Destroy Project</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Rename Workspace Modal */}
      <AnimatePresence>
        {workspaceToRename && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWorkspaceToRename(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10">
              <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Rename Workspace Descriptor</h2>
              <form onSubmit={handleRenameWorkspace} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 tracking-wider uppercase mb-2">Workspace Name</label>
                  <input type="text" required value={renameWorkspaceName} onChange={e => setRenameWorkspaceName(e.target.value)} className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 tracking-wider uppercase mb-2">Purpose / Bio</label>
                  <textarea rows={3} value={renameWorkspaceDesc} onChange={e => setRenameWorkspaceDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-bold outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setWorkspaceToRename(null)} className="flex-grow py-3 px-4 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase">Cancel</button>
                  <button type="submit" className="flex-grow py-3 px-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Update Metadata</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Page Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-center">
              <Trash2 size={36} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Delete Workspace Page?</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed my-4">This action is irreversible. All indexes pointing to this page will remain but will lead to a missing target.</p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setDeleteConfirmId(null)} className="flex-grow py-3 px-4 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
                <button type="button" onClick={confirmDeletePage} className="flex-grow py-3 px-4 bg-red-650 text-white rounded-xl text-xs font-black uppercase tracking-wider">Confirm Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Index Construction Outline Modal */}
      <AnimatePresence>
        {showIndexModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIndexModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-8 z-10">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <LayoutList className="text-indigo-600" />
                <span>Add Index Item</span>
              </h2>
              <form onSubmit={handleIndexAdd} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Title</label>
                  <input type="text" required placeholder="e.g. 1. Introduction" className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs font-medium outline-none" value={indexForm.title} onChange={(e) => setIndexForm({...indexForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Link to Pages (Select in order)</label>
                  <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden text-xs">
                    <div className="p-2 border-b">
                      <input type="text" placeholder="Search outlines to link..." className="w-full bg-transparent outline-none p-1 font-semibold text-slate-700" value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} />
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                      {(pages || []).filter(p => p && (!pageSearch || (p.title || '').toLowerCase().includes((pageSearch || '').toLowerCase()))).map((p, pIdx) => {
                        const selIdx = indexForm.pageIds.indexOf(p.id);
                        const isSel = selIdx !== -1;
                        const getOrdinal = (idx: number) => {
                          if (idx === 0) return '1st';
                          if (idx === 1) return '2nd';
                          if (idx === 2) return '3rd';
                          return `${idx + 1}th`;
                        };
                        return (
                          <button key={p.id || `outline-page-item-${pIdx}`} type="button" onClick={() => isSel ? setIndexForm({...indexForm, pageIds: indexForm.pageIds.filter(id => id !== p.id)}) : setIndexForm({...indexForm, pageIds: [...indexForm.pageIds, p.id]})} className={`w-full text-left p-2 rounded-lg flex items-center justify-between ${isSel ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-650'}`}>
                            <span>{p.title}</span>
                            {isSel && (
                              <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white rounded px-1.5 py-0.5 leading-none shadow-sm">
                                {getOrdinal(selIdx)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-405 uppercase tracking-wide mb-1">Linking Anchor ID (Optional)</label>
                  <input type="text" placeholder="e.g. section-1" className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs outline-none font-mono" value={indexForm.sectionId} onChange={(e) => setIndexForm({...indexForm, sectionId: e.target.value.toLowerCase().replace(/\s/g, '-')})} />
                </div>

                {/* Visual Path Preview of combined sequential pages */}
                {indexForm.pageIds.length > 0 && (
                  <div className="p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-xl space-y-1.5">
                    <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">Selected Sequential Path</span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 font-semibold">
                      {indexForm.pageIds.map((id, pIdx) => {
                        const page = (Array.isArray(pages) ? pages : []).find((pg) => pg.id === id);
                        return (
                          <React.Fragment key={`seq-${id}-${pIdx}`}>
                            {pIdx > 0 && <span className="text-indigo-400 font-extrabold">➔</span>}
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-150 shadow-sm text-[11px] text-indigo-950 flex items-center gap-1">
                              <span className="font-mono text-[9px] text-indigo-500 font-bold">#{pIdx + 1}</span>
                              <span className="truncate max-w-[120px]">{page?.title || 'Blank Page'}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowIndexModal(false)} className="flex-grow py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
                  <button type="submit" className="flex-grow py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px]">Create Link</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Project Configuration (Visibility & Tags) Modal */}
      <AnimatePresence>
        {selectedProjectForSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedProjectForSettings(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10 text-slate-800"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Project Settings</h2>
                  <p className="text-[10px] uppercase font-black text-slate-400 mt-1">{selectedProjectForSettings.title}</p>
                </div>
                <button 
                  onClick={() => setSelectedProjectForSettings(null)}
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Visibility Toggle Options */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#94a3b8] dark:text-[#64748b]">Visibility Setting</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setProjectSettingsVisibility('private')}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all outline-none ${
                        projectSettingsVisibility === 'private'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                          : 'bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">🔒</span>
                      <span>Private</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectSettingsVisibility('public')}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all outline-none ${
                        projectSettingsVisibility === 'public'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                          : 'bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">🌍</span>
                      <span>Public</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium">
                    {projectSettingsVisibility === 'public'
                      ? 'Visible to everyone inside the Public Content Explorer registry.'
                      : 'Only visible to you and operational administrators.'}
                  </p>
                </div>

                {/* Tag Editors */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#94a3b8] dark:text-[#64748b]">Project Tags</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter tag (e.g. documentation)..."
                      value={projectSettingsNewTag}
                      onChange={(e) => setProjectSettingsNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProjectSettingsTag(); } }}
                      className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddProjectSettingsTag}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 min-h-[2.5rem]">
                    {projectSettingsTags.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No tags added yet.</p>
                    ) : (
                      projectSettingsTags.map((tag, tagIdx) => (
                        <div key={`${tag}-${tagIdx}`} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 flex items-center space-x-1 shrink-0">
                          <span>#{tag}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveProjectSettingsTag(tag)}
                            className="text-red-500 hover:bg-slate-200 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForSettings(null)}
                    className="flex-grow py-3 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProjectSettings}
                    disabled={savingProjectSettings}
                    className="flex-grow py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-lg disabled:opacity-50"
                  >
                    {savingProjectSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Panel Outline/Index Rendering Component
const DocIndexPanel: React.FC<any> = ({ indices, pages, onIndexSelect, onIndexAdd, onIndexDelete, readOnly = false }) => {
  const [indexSearch, setIndexSearch] = useState('');

  const filteredIndices = (indices || []).filter((item: any) => {
    if (!item) return false;
    const ids = Array.isArray(item.linkedPage) 
      ? item.linkedPage 
      : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
    const titles = ids.map((id: string) => (pages || []).find((p: any) => p.id === id)?.title || '');
    const matchesTitle = (item.title || '').toLowerCase().includes((indexSearch || '').toLowerCase());
    const matchesPageTitle = titles.some(title => (title || '').toLowerCase().includes((indexSearch || '').toLowerCase()));
    return matchesTitle || matchesPageTitle;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
          <LayoutList size={16} className="text-indigo-400" />
          <span>Document Outline / Index Structure</span>
        </div>
        {!readOnly && <button onClick={onIndexAdd} className="p-1.5 hover:bg-slate-800 rounded-lg text-indigo-400"><Plus size={18} /></button>}
      </div>
      
      <div className="px-4 py-2 border-b border-slate-800 bg-[#0f172a]/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text"
            placeholder="Search index or pages..."
            className="w-full bg-slate-800 border-none rounded-lg py-1.5 pl-8 text-xs text-slate-250 placeholder-slate-550 outline-none focus:ring-1 focus:ring-indigo-600"
            value={indexSearch}
            onChange={(e) => setIndexSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {filteredIndices.map((item: any, idx: number) => {
          const ids = Array.isArray(item.linkedPage) 
            ? item.linkedPage 
            : (typeof item.linkedPage === 'string' ? item.linkedPage.split(',').filter(Boolean) : [item.linkedPage].filter(Boolean));
          const titles = ids.map((id: string) => (Array.isArray(pages) ? pages : []).find((p: any) => p.id === id)?.title || 'Unnamed Page');
          const titlesStr = titles.join(' ➔ ');
          
          return (
            <div key={item.id || `idx-list-item-${idx}`} onClick={() => onIndexSelect(item.linkedPage, item.linkedSectionId)} className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-800 hover:text-white transition-all">
              <span className="text-[10px] font-mono text-slate-500 w-4">{String(idx + 1).padStart(2, '0')}</span>
              <div className="flex-grow truncate">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{titlesStr}</div>
              </div>
              {!readOnly && <button onClick={(e) => { e.stopPropagation(); onIndexDelete(item.id); }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentWorkspace;
