/**
 * ============================================================================
 * 📂 SUBSYSTEM: WORKSPACE HUB (LISTINGS ENGINE)
 * ============================================================================
 * 
 * 🏢 Role & Scope:
 * This is the primary dashboard for Workspace Hub project listings, meta tracking,
 * analytics, bookmarks, and global activity. It manages standard projects/listings.
 * 
 * 🔍 Domain Attributes:
 * - addedToNexus: false (Filters only standard Workspace Hub listings)
 * - workspaceId: Binds the project collection to a tenant workspace
 * 
 * 🛠️ Key State Modules & Interactive Features:
 * - Stats Highlights Overview (projects, pages, annotations, bookmarks)
 * - Multi-View layout toggle (Grid, List, Timeline)
 * - Unified filters & keyword searches
 * - Add/Upload drag-and-drop project creation
 * - Project settings modal (Visibility rules, customized tagging)
 * ============================================================================
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api/client';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Layout, Search, Grid, List as ListIcon, X, FileUp, 
  Book, Clock, Edit3, Trash2, ChevronRight, ChevronDown, ChevronLeft, FileText, 
  Check, Upload, CheckCircle2, AlertCircle, Loader2, Save, BookOpen,
  TrendingUp, Users, Clock3, FileStack, ArrowUpRight, ArrowLeft,
  LayoutDashboard, Files, Highlighter, Settings, BarChart2,
  Bookmark, Activity, Star, Filter, Calendar, List, Globe, FolderDown
} from 'lucide-react';
import { publicService } from '../services/api/public';
import { WorkspaceHubProjectsView } from '../components/workspace/WorkspaceHubProjectsView';
import { useAuth } from '../context/AuthContext';
import { useNotifications, triggerNotification } from '../context/NotificationContext';

const listingService = {
  getAll: () => api.get("/listing"),
  getByWorkspace: (workspaceId: string) => api.get(`/listing/workspace/${workspaceId}`),
  getById: (id: string) => api.get(`/listing/${id}`),
  create: (data: any) => api.post("/listing", data),
  update: (id: string, data: any) => api.put(`/listing/${id}`, data),
  delete: (id: string) => api.delete(`/listing/${id}`),
  searchInWorkspace: (workspaceId: string, q: string) => api.get(`/listing/search/${workspaceId}?q=${q}`),
};

const pageService = {
  getAll: () => api.get("/page"),
  getByWorkspace: (workspaceId: string) => api.get(`/page/workspace/${workspaceId}`),
};

const workspaceService = {
  getById: (id: string) => api.get(`/workspace/${id}`),
};

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
      />
    </div>
  );
};

type WorkspaceView = 'overview' | 'projects' | 'project-bookmarks' | 'page-bookmarks' | 'highlights' | 'activity' | 'settings' | 'pages';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge, collapsed }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#1a1f29]'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className={`text-sm font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
          {label}
        </span>
      )}
    </div>
    {!collapsed && badge && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

// Multi-page layout utility types & views are cleanly handled by WorkspaceHubProjectsView

interface DocUploadProps {
  onSuccess?: (listing: any) => void;
  onCancel?: () => void;
}

const DocUpload: React.FC<DocUploadProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success'>('idle');

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus('uploading');
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setProgress(percentCompleted);
          if (percentCompleted === 100) {
            setStatus('processing');
          }
        },
      });

      setStatus('success');
      triggerNotification(`Document "${file.name}" uploaded and parsed successfully!`, 'success', 'File Upload Completed');
      if (onSuccess) {
        onSuccess(response.data.listing);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
      setStatus('idle');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
          <p className="text-sm text-slate-500">Import .doc, .docx or .pdf files</p>
        </div>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'uploading' || status === 'processing' ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!file ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <Upload className="text-indigo-600" size={32} />
                </div>
                <p className="text-lg font-semibold text-slate-800 mb-1">
                  Drag & drop file here
                </p>
                <p className="text-sm text-slate-500">
                  or click to browse from your computer
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1"><FileText size={14} /> DOCX/PDF supported</span>
                  <span>Max file size 50MB</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                    <FileText className="text-indigo-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  {!isUploading && (
                    <button 
                      onClick={removeFile}
                      className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {status === 'processing' ? 'Processing Document...' : 'Uploading...'}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                    {status === 'processing' && (
                      <div className="mt-3 flex items-center gap-2 text-indigo-600">
                        <Loader2 className="animate-spin" size={14} />
                        <span className="text-xs font-medium italic">This may take a moment for large documents</span>
                      </div>
                    )}
                  </div>
                )}

                {!isUploading && (
                  <button 
                    onClick={handleUpload}
                    className="w-full mt-6 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-slate-100 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    Start Importing
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="success-zone"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="text-green-600" size={48} />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-2">Successfully Imported!</h4>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Your document has been converted and is ready for reading in the dashboard.
            </p>
            <button 
              onClick={() => onSuccess && onSuccess(null)}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; onClick?: () => void }> = ({ icon, label, value, color, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-xl hover:shadow-slate-200/20 transition-all active:scale-[0.98] group h-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className={`p-3.5 rounded-xl ${color} transition-transform group-hover:scale-110 shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{value}</p>
    </div>
    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
       <ArrowUpRight size={16} className="text-slate-400/20" />
    </div>
  </motion.div>
);

const ListingDashboard: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [listings, setListings] = useState<any[]>([]);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Workspace Hub Download & Progress Overlay states
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  const handleDownloadWorkspaceHub = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportDone(false);
    try {
      setExportStatus('Preparing Pages...');
      setExportProgress(15);
      await new Promise(r => setTimeout(r, 600));

      setExportStatus('Preparing Indexes...');
      setExportProgress(35);
      await new Promise(r => setTimeout(r, 600));

      setExportStatus('Preparing Highlights...');
      setExportProgress(55);
      await new Promise(r => setTimeout(r, 600));

      setExportStatus('Generating ZIP...');
      setExportProgress(75);
      await new Promise(r => setTimeout(r, 600));

      // Fetch the actual bulk Workspace Hub ZIP blob from the backend
      const response = await api.get('/export/workspace-hub', {
        responseType: 'blob'
      });

      setExportStatus('Downloading...');
      setExportProgress(100);
      await new Promise(r => setTimeout(r, 400));

      // Trigger user local download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'workspace-hub.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportDone(true);
      showToast('Your Workspace Hub ZIP export package is ready and downloading!', 'success', 'Bulk Export Finished', 4000);
    } catch (err: any) {
      console.error("Workspace Hub bulk ZIP download failed:", err);
      let friendlyMessage = "Failed to export your Workspace Hub ZIP archive.";
      if (err.response && err.response.data) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed && parsed.message) {
            friendlyMessage = parsed.message;
          }
        } catch (_) {}
      }
      setExportError(friendlyMessage || err.message);
    }
  };
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSearchTerm, setPageSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<WorkspaceView>('overview');
  const [projectsViewMode, setProjectsViewMode] = useState<'grid' | 'list'>('grid');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isStatusCollapsed, setIsStatusCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // New Listing State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Project Settings (Visibility & Tags) States
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState<any | null>(null);
  const [projectSettingsTags, setProjectSettingsTags] = useState<string[]>([]);
  const [projectSettingsVisibility, setProjectSettingsVisibility] = useState<'private' | 'public'>('private');
  const [projectSettingsNewTag, setProjectSettingsNewTag] = useState('');
  const [savingProjectSettings, setSavingProjectSettings] = useState(false);

  const handleOpenProjectSettings = (listing: any) => {
    setSelectedProjectForSettings(listing);
    setProjectSettingsTags(listing.tags || []);
    setProjectSettingsVisibility(listing.visibility || 'private');
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
      // Synchronize in local memory list state
      setListings(listings.map(l => l.id === selectedProjectForSettings.id ? {
        ...l,
        visibility: projectSettingsVisibility,
        tags: projectSettingsTags
      } : l));
      setSelectedProjectForSettings(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update catalog entry visibility');
    } finally {
      setSavingProjectSettings(false);
    }
  };

  const fetchData = async () => {
    setError(null);
    try {
      if (workspaceId) {
        const [listingsRes, workspaceRes, pagesRes] = await Promise.all([
          listingService.getByWorkspace(workspaceId),
          workspaceService.getById(workspaceId),
          pageService.getByWorkspace(workspaceId)
        ]);
        setListings(listingsRes.data?.data || listingsRes.data || []);
        setWorkspace(workspaceRes.data);
        setAllPages(pagesRes.data?.data || pagesRes.data || []); 
      } else {
        const [listingsRes, pagesRes] = await Promise.all([
          listingService.getAll(),
          pageService.getAll().catch(() => ({ data: [] }))
        ]);
        setListings(listingsRes.data?.data || listingsRes.data || []);
        setAllPages(pagesRes.data?.data || pagesRes.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data', err);
      setError(err.response?.data?.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const workspaceListings = useMemo(() => {
    return listings.filter(l => l.addedToNexus !== true);
  }, [listings]);

  const bookmarkedListings = useMemo(() => {
    return workspaceListings.filter(l => l.isBookmarked).map(l => ({
      id: l.id,
      type: 'Project',
      title: l.title,
      projectTitle: l.title,
      updatedAt: l.updatedAt,
      link: `/listing/read/${l.id}`
    }));
  }, [workspaceListings]);

  const bookmarkedPages = useMemo(() => {
    return allPages.filter(p => p.isBookmarked).map(p => {
      const project = workspaceListings.find(l => l.id === p.listingId);
      return {
        id: p.id,
        type: 'Page',
        title: p.title || `Page ${p.pageNumber}`,
        projectTitle: project?.title || 'Unknown',
        updatedAt: p.updatedAt,
        link: `/listing/read/${p.listingId}?page=${p.pageNumber}`,
        pageNumber: p.pageNumber
      };
    });
  }, [allPages, workspaceListings]);

  const allProjectPages = useMemo(() => {
    return allPages.map(p => {
      const project = workspaceListings.find(l => l.id === p.listingId);
      return {
        id: p.id,
        type: 'Page',
        title: p.title || `Page ${p.pageNumber}`,
        projectTitle: project?.title || 'Unknown',
        updatedAt: p.updatedAt,
        isBookmarked: p.isBookmarked,
        link: `/listing/read/${p.listingId}?page=${p.pageNumber}`,
        pageNumber: p.pageNumber
      };
    });
  }, [allPages, workspaceListings]);

  const bookmarkedItems = useMemo(() => {
    return [...bookmarkedListings, ...bookmarkedPages].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [bookmarkedListings, bookmarkedPages]);

  const stats = useMemo(() => {
    const totalProjects = workspaceListings.length;
    const totalPages = workspaceListings.reduce((acc, l) => acc + (l.pages?.length || 0), 0);
    const totalHighlights = workspaceListings.reduce((acc, l) => acc + (l.highlights?.length || 0), 0);
    const totalBookmarks = bookmarkedItems.length;
    const totalProjectBookmarks = bookmarkedListings.length;
    const totalPageBookmarks = bookmarkedPages.length;
    const recentActivity = workspaceListings.filter(l => {
      const diff = Date.now() - new Date(l.updatedAt).getTime();
      return diff < 86400000 * 7; // Last week
    }).length;

    return { 
      totalProjects, 
      totalPages, 
      totalHighlights, 
      recentActivity, 
      totalBookmarks, 
      totalProjectBookmarks, 
      totalPageBookmarks 
    };
  }, [workspaceListings, bookmarkedItems, bookmarkedListings, bookmarkedPages]);

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const listing = listings.find(l => l.id === deleteConfirmId);
      if (listing && listing.visibility === "public" && user?.role !== "admin") {
        alert("Access Denied: Public projects can only be deleted by administrators.");
        setDeleteConfirmId(null);
        return;
      }
      await listingService.delete(deleteConfirmId);
      setListings(listings.filter(l => l.id !== deleteConfirmId));
      showToast('Project has been permanently deleted from this workspace.', 'success', 'Project Deleted', 3000);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Failed to delete listing', err);
      alert(err?.response?.data?.message || 'Failed to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newTitle || '';
    if (!titleVal.trim()) return;
    
    setCreating(true);
    try {
      const { data } = await listingService.create({ 
        title: newTitle, 
        description: newDesc,
        workspaceId: workspaceId || 'main',
        addedToNexus: false
      });
      setListings([data, ...listings]);
      showToast(`Project "${newTitle}" created successfully!`, 'success', 'Project Created', 3000);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setCurrentView('projects');
    } catch (err) {
      alert('Failed to create listing');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id: string) => {
    const rawTitle = tempTitle || '';
    if (!rawTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await listingService.update(id, { title: tempTitle });
      setListings(listings.map(l => l.id === id ? { ...l, title: tempTitle } : l));
      showToast('Project renamed successfully!', 'success', 'Project Name Saved', 2500);
      setEditingId(null);
    } catch (err) {
      alert('Failed to rename');
    }
  };

  const handleToggleListingBookmark = async (id: string, currentStatus: boolean) => {
    try {
      await listingService.update(id, { isBookmarked: !currentStatus });
      setListings(listings.map(l => l.id === id ? { ...l, isBookmarked: !currentStatus } : l));
      showToast(
        !currentStatus ? 'Project added to your favorite bookmarks list!' : 'Project removed from your bookmarks.',
        'success',
        !currentStatus ? 'Bookmarked' : 'Unbookmarked',
        2500
      );
    } catch (err) {
      console.error('Failed to toggle listing bookmark', err);
    }
  };

  const handleTogglePageBookmark = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/page/${id}`, { isBookmarked: !currentStatus });
      setAllPages(allPages.map(p => p.id === id ? { ...p, isBookmarked: !currentStatus } : p));
      showToast(
        !currentStatus ? 'Page added to your favorite bookmarks list!' : 'Page removed from your bookmarks.',
        'success',
        !currentStatus ? 'Bookmarked' : 'Unbookmarked',
        2500
      );
    } catch (err) {
      console.error('Failed to toggle page bookmark', err);
    }
  };

  const filteredListings = workspaceListings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [universalSearchTerm, setUniversalSearchTerm] = useState('');
  const [universalSearchResults, setUniversalSearchResults] = useState<{ listings: any[], pages: any[] }>({ listings: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);

  const handleUniversalSearch = async (val: string) => {
     setUniversalSearchTerm(val);
     if (val.length < 2) {
       setUniversalSearchResults({ listings: [], pages: [] });
       return;
     }

     setIsSearching(true);
     try {
       const res = await listingService.searchInWorkspace(workspaceId || 'main', val);
       setUniversalSearchResults(res.data || { listings: [], pages: [] });
     } catch (err) {
       console.error('Universal search failed', err);
     } finally {
       setIsSearching(false);
     }
  };

  const renderSearchResults = () => (
    <div className="space-y-8">
       <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Search Results</h3>
          <button onClick={() => setUniversalSearchTerm('')} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
       </div>

       {isSearching && (
         <div className="py-20 flex justify-center flex-col items-center gap-4">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
            />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Searching across database...</p>
         </div>
       )}

       {!isSearching && universalSearchResults.listings.length === 0 && universalSearchResults.pages.length === 0 && (
         <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <Search className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium italic">No results found for "{universalSearchTerm}"</p>
         </div>
       )}

       {!isSearching && (
         <div className="space-y-12">
            {universalSearchResults.listings.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Projects ({universalSearchResults.listings.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {universalSearchResults.listings.map(l => (
                     <Link key={l.id} to={`/listing/read/${l.id}`} className="block bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Book size={20} />
                           </div>
                           <h5 className="font-bold text-slate-900 truncate">{l.title}</h5>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{l.description}</p>
                     </Link>
                   ))}
                </div>
              </div>
            )}

            {universalSearchResults.pages.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pages ({universalSearchResults.pages.length})</h4>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                               <th className="px-8 py-4">Snippet</th>
                               <th className="px-8 py-4">Project</th>
                               <th className="px-8 py-4 text-right">Action</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {universalSearchResults.pages.map(p => {
                               const project = listings.find(l => l.id === p.listingId);
                               const pageIdx = project?.pages?.indexOf(p.id) || 0;
                               return (
                                 <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-6">
                                       <div className="flex flex-col gap-1 max-w-xl">
                                          <p className="font-bold text-slate-900 text-sm">{p.title || `Page ${pageIdx + 1}`}</p>
                                          <p className="text-xs text-slate-500 line-clamp-2 italic" dangerouslySetInnerHTML={{ __html: p.content.replace(new RegExp(universalSearchTerm, 'gi'), (match: string) => `<mark class="bg-yellow-200 font-bold">${match}</mark>`).substring(0, 200) + '...' }} />
                                       </div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{project?.title || 'Unknown Project'}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <Link to={`/listing/read/${p.listingId}?page=${pageIdx + 1}`} className="text-indigo-600 hover:underline text-xs font-black uppercase tracking-widest">Open Page</Link>
                                    </td>
                                 </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}
         </div>
       )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FileStack className="text-indigo-600" size={24} />} 
          label="Total Projects" 
          value={stats.totalProjects.toString()} 
          color="bg-indigo-50"
          onClick={() => setCurrentView('projects')}
        />
        <StatCard 
          icon={<Files className="text-emerald-600" size={24} />} 
          label="Total Pages" 
          value={stats.totalPages.toString()} 
          color="bg-emerald-50"
          onClick={() => setCurrentView('pages')}
        />
        <StatCard 
          icon={<Highlighter className="text-amber-600" size={24} />} 
          label="Total Highlights" 
          value={stats.totalHighlights.toString()} 
          color="bg-amber-50"
          onClick={() => setCurrentView('project-bookmarks')}
        />
        <StatCard 
          icon={<Bookmark className="text-rose-600" size={24} />} 
          label="Bookmarks" 
          value={stats.totalBookmarks.toString()} 
          color="bg-rose-50"
          onClick={() => setCurrentView('page-bookmarks')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Star size={20} className="text-amber-400 fill-amber-400" />
                Featured Projects
              </h3>
              <button 
                onClick={() => setCurrentView('projects')}
                className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(workspaceListings.filter(l => l.isBookmarked).length > 0 
                ? [...workspaceListings.filter(l => l.isBookmarked), ...workspaceListings.filter(l => !l.isBookmarked)] 
                : workspaceListings
              ).slice(0, 4).map(listing => (
                <Link 
                  key={listing.id}
                  to={`/listing/read/${listing.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                >
                  <div className={`p-3 rounded-xl transition-colors ${listing.isBookmarked ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    {listing.isBookmarked ? <Star size={20} fill="currentColor" /> : <Book size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{listing.title}</p>
                    <p className="text-xs text-slate-400">{listing.pages?.length || 0} Pages</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-200 group-hover:text-slate-400" />
                </Link>
              ))}
              {workspaceListings.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 font-medium italic">
                  No projects created yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Bookmark size={20} className="text-indigo-600 fill-indigo-100" />
                  Recent Bookmarks
                </h3>
                <button 
                  onClick={() => setCurrentView('page-bookmarks')}
                  className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                >
                  View All
                </button>
             </div>
              <div className="space-y-4">
                {bookmarkedPages.slice(0, 3).map(page => (
                  <Link 
                    key={page.id} 
                    to={page.link}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {page.pageNumber || 'P'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{page.title}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{page.projectTitle}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-400" />
                  </Link>
                ))}
                {bookmarkedPages.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Bookmark size={24} className="mx-auto mb-2 opacity-20" />
                    <p>No bookmarked pages yet.</p>
                  </div>
                )}
              </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
              <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={18} />
                Activity Timeline
              </h3>
              <div className="space-y-6">
                {[...workspaceListings].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5).map((l, i) => (
                  <div key={l.id} className="flex gap-4 relative">
                    {i < 4 && <div className="absolute left-[9px] top-6 bottom-0 w-px bg-slate-800" />}
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 bg-slate-900 shrink-0 z-10" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{l.title} updated</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {new Date(l.updatedAt).toLocaleDateString()} at {new Date(l.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {workspaceListings.length === 0 && (
                   <p className="text-slate-500 text-sm italic">No recent activity detected.</p>
                )}
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl">
              <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-4">Pro Tip</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
                Importing a PDF automatically generates a linked index for your project. Use it for fast navigation.
              </p>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                >
                Try It Now
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <WorkspaceHubProjectsView
      filteredListings={filteredListings}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      projectsViewMode={projectsViewMode}
      setProjectsViewMode={setProjectsViewMode}
      setShowCreateModal={setShowCreateModal}
      setDeleteConfirmId={setDeleteConfirmId}
      setEditingId={setEditingId}
      tempTitle={tempTitle}
      setTempTitle={setTempTitle}
      handleToggleListingBookmark={handleToggleListingBookmark}
      editingId={editingId}
      handleRename={handleRename}
      handleOpenProjectSettings={handleOpenProjectSettings}
      navigate={navigate}
    />
  );

  const renderProjectBookmarks = () => (
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
       <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Saved Projects</h3>
            <p className="text-slate-500 text-sm font-medium">Reference your bookmarked projects for quick access.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                <th className="px-8 py-4">Project Title</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Last Modified</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookmarkedListings.filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((item: any) => (
                <tr key={`project-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleListingBookmark(item.id, true)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-110 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        title="Remove Bookmark"
                      >
                        <Bookmark size={14} fill="currentColor" />
                      </button>
                      <span className="font-bold text-slate-700">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-md border border-green-100 flex items-center gap-1.5 w-fit">
                       <CheckCircle2 size={10} />
                       Indexed
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs text-slate-400 font-medium">{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Link to={item.link} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all opacity-0 group-hover:opacity-100">
                      <BookOpen size={14} />
                      Open Project
                    </Link>
                  </td>
                </tr>
              ))}
              {bookmarkedListings.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-32 text-center">
                      <Bookmark className="mx-auto text-slate-100 mb-4" size={64} />
                      <p className="text-slate-400 font-medium italic">No projects saved. Use the bookmark icon on project cards to save them.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
       </div>
    </div>
  );

  const renderAllPages = () => (
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText className="text-indigo-600" size={24} />
              All Project Pages
            </h3>
            <p className="text-slate-500 text-sm font-medium">Browse and manage every single page across all projects in this workspace.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search pages..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
              value={pageSearchTerm}
              onChange={(e) => setPageSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                <th className="px-8 py-4">Page Title</th>
                <th className="px-8 py-4">Source Project</th>
                <th className="px-8 py-4">Last Modified</th>
                <th className="px-8 py-4">Bookmark Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allProjectPages.filter(item => 
                item.title.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
                item.projectTitle.toLowerCase().includes(pageSearchTerm.toLowerCase())
              ).map((item: any) => (
                <tr key={`all-page-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="font-bold text-slate-700">{item.title}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-medium text-slate-500">{item.projectTitle}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs text-slate-400 font-medium">{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-4">
                    <button 
                      onClick={() => handleTogglePageBookmark(item.id, !!item.isBookmarked)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-110 p-0 ${
                        item.isBookmarked 
                          ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                      title={item.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    >
                      <Bookmark size={14} fill={item.isBookmarked ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Link to={item.link} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all opacity-0 group-hover:opacity-100">
                      <BookOpen size={14} />
                      Open Reader
                    </Link>
                  </td>
                </tr>
              ))}
              {allProjectPages.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-8 py-32 text-center">
                      <FileText className="mx-auto text-slate-100 mb-4" size={64} />
                      <p className="text-slate-400 font-medium italic">No pages found in any project yet.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );

  const renderPageBookmarks = () => (
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
       <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Page Bookmarks</h3>
            <p className="text-slate-500 text-sm font-medium">Browse specific chapters or sections you've bookmarked.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search pages..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                <th className="px-8 py-4">Page Title</th>
                <th className="px-8 py-4">Source Project</th>
                <th className="px-8 py-4">Last Modified</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookmarkedPages.filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((item: any) => (
                <tr key={`page-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTogglePageBookmark(item.id, true)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-110 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="Remove Bookmark"
                      >
                        <Bookmark size={14} fill="currentColor" />
                      </button>
                      <span className="font-bold text-slate-700">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-medium text-slate-500">{item.projectTitle}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs text-slate-400 font-medium">{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Link to={item.link} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all opacity-0 group-hover:opacity-100">
                      <BookOpen size={14} />
                      Open Reader
                    </Link>
                  </td>
                </tr>
              ))}
              {bookmarkedPages.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-32 text-center">
                      <Bookmark className="mx-auto text-slate-100 mb-4" size={64} />
                      <p className="text-slate-400 font-medium italic">No pages bookmarked. Use the bookmark icon while reading to save pages.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
       </div>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="workspace-hub-main-wrapper min-h-screen bg-slate-50/50 dark:bg-[#0f1115] text-slate-800 dark:text-slate-200 flex transition-colors duration-300">
      {/* Mobile Sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-910/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={`workspace-hub-sidebar bg-white dark:bg-[#15181e] border-r border-slate-100 dark:border-[#2d323f] flex-shrink-0 flex-col transition-all duration-300 ${
        isMobileSidebarOpen 
          ? 'fixed inset-y-0 left-0 z-50 flex w-80 shadow-2xl h-screen' 
          : 'hidden lg:flex sticky top-0 h-screen ' + (isSidebarCollapsed ? 'w-20' : 'w-80')
      }`}>
        <div className={`workspace-hub-top-pane transition-all duration-300 ${isSidebarCollapsed && !isMobileSidebarOpen ? 'p-4 pb-2' : 'p-8 pb-4'}`}>
          <div className="flex items-center justify-between mb-10">
            <Link to="/dashboard" className={`flex items-center gap-3 group ${isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center' : ''}`}>
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/20">D</div>
               {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                 <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">Doc Hub</span>
               )}
            </Link>
            {isMobileSidebarOpen && (
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                title="Close Sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div 
            className={`flex items-center justify-between mb-4 select-none ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            {!isSidebarCollapsed ? (
              <>
                <p 
                  onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                  className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer transition-colors"
                  title={isNavCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
                >
                  {isNavCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                  Workspace Hub Features
                </p>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-[#1a1f29] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer flex items-center justify-center"
                title="Expand Sidebar"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {!isNavCollapsed && (
            <div className={`space-y-2 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Overview" 
                active={currentView === 'overview'} 
                onClick={() => setCurrentView('overview')}
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Files size={20} />} 
                label="Projects" 
                active={currentView === 'projects'} 
                onClick={() => setCurrentView('projects')}
                badge={workspaceListings.length}
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Bookmark size={20} />} 
                label="Project Saved" 
                active={currentView === 'project-bookmarks'} 
                onClick={() => setCurrentView('project-bookmarks')}
                badge={stats.totalProjectBookmarks}
                collapsed={isSidebarCollapsed}
              />
               <SidebarItem 
                icon={<Star size={20} />} 
                label="Page Bookmarks" 
                active={currentView === 'page-bookmarks'} 
                onClick={() => setCurrentView('page-bookmarks')}
                badge={stats.totalPageBookmarks}
                collapsed={isSidebarCollapsed}
              />
               <SidebarItem 
                icon={<FileText size={20} />} 
                label="Pages" 
                active={currentView === 'pages'} 
                onClick={() => setCurrentView('pages')}
                badge={stats.totalPages}
                collapsed={isSidebarCollapsed}
              />
            </div>
          )}
        </div>

        <div className={`workspace-hub-bottom-pane mt-auto border-t border-slate-50 dark:border-[#2d323f] transition-all duration-300 ${isSidebarCollapsed ? 'p-4 pt-2' : 'p-8 pt-4 space-y-2'}`}>
           <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={currentView === 'settings'} 
              onClick={() => setCurrentView('settings')}
              collapsed={isSidebarCollapsed}
            />
            {!isSidebarCollapsed && (
              <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl">
                 <div 
                    onClick={() => setIsStatusCollapsed(!isStatusCollapsed)}
                    className="flex items-center justify-between cursor-pointer select-none group/status"
                    title={isStatusCollapsed ? "Expand Status Details" : "Collapse Status Details"}
                 >
                   <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-350 uppercase tracking-widest flex items-center gap-1.5 group-hover/status:text-indigo-600 dark:group-hover/status:text-indigo-200 transition-colors">
                      {isStatusCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                      Workspace Status
                   </p>
                 </div>
                 
                 {!isStatusCollapsed && (
                   <div className="mt-4 space-y-4">
                     <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Synchronized</span>
                     </div>
                     <div className="h-1.5 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-3/4 rounded-full" />
                     </div>
                     <p className="text-[9px] text-indigo-400 dark:text-indigo-300 mt-2 font-bold uppercase tracking-widest">Storage: 75% Used</p>
                   </div>
                 )}
              </div>
            )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white/80 dark:bg-[#15181e]/80 backdrop-blur-md border-b border-slate-100 dark:border-[#2d323f] sticky top-0 z-30 px-6 py-4 flex items-center justify-between transition-colors duration-300">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 border border-slate-200 dark:border-slate-850 bg-white/50 dark:bg-[#15181e]/50 shadow-xs cursor-pointer transition-all"
                title="Expand Workspace Sidebar"
              >
                <List size={18} />
                <span className="text-[10px] font-black uppercase tracking-wider inline">Expand sidebar</span>
              </button>
              <Link to="/dashboard" className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-[#1f242e] rounded-xl text-slate-550" title="Return to Core Dashboard">
                 <ArrowLeft size={20} />
              </Link>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                   {workspace?.name || 'Main Workspace'}
                   <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">
                   <span>Home</span>
                   <ChevronRight size={10} />
                   <span className="text-indigo-600 dark:text-indigo-400">{currentView}</span>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                id="download-workspace-hub-btn"
                onClick={handleDownloadWorkspaceHub}
                disabled={isExporting}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md inline-flex items-center gap-2 cursor-pointer transition-all shrink-0 hover:shadow-lg dark:shadow-none"
                title="Download Workspace Hub"
              >
                <FolderDown size={14} />
                <span>⬇ Download Workspace Hub</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] rounded-xl px-3 py-1.5">
                 <Search size={16} className="text-slate-400 dark:text-slate-500" />
                 <input 
                  type="text" 
                  placeholder="Universal Search..."
                  className="bg-transparent text-xs font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 w-32 focus:w-64 transition-all"
                  value={universalSearchTerm}
                  onChange={(e) => handleUniversalSearch(e.target.value)}
                 />
                 {universalSearchTerm && (
                    <button onClick={() => setUniversalSearchTerm('')} className="p-1 hover:bg-slate-200 dark:hover:bg-[#15181e] rounded-md">
                       <X size={12} className="text-slate-500" />
                    </button>
                 )}
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={20} />
              </button>
           </div>
        </header>

        <div className="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
          {/* Animated View Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={universalSearchTerm ? 'search' : currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {universalSearchTerm ? renderSearchResults() : (
                <>
                  {currentView === 'overview' && renderOverview()}
                  {currentView === 'projects' && renderProjects()}
                  {currentView === 'project-bookmarks' && renderProjectBookmarks()}
                  {currentView === 'page-bookmarks' && renderPageBookmarks()}
                  {currentView === 'pages' && renderAllPages()}
                  {currentView === 'settings' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-12 min-h-[400px]">
                      <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                        <Settings className="text-indigo-600" />
                        Workspace Configuration
                      </h3>
                       <div className="space-y-8 max-w-2xl">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Workspace Name</label>
                            <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" defaultValue={workspace?.name} />
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Description</label>
                            <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 h-24" defaultValue={workspace?.description} />
                          </div>
                          <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">
                            Save Preferences
                          </button>
                       </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Project?</h3>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete this project? This will remove all associated pages and content for this entry.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Deleting...
                    </>
                  ) : 'Delete Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workspace Hub Download Progress & Success Overlay */}
      <AnimatePresence>
        {(isExporting || exportDone || exportError) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 if (exportDone || exportError) {
                   setIsExporting(false);
                   setExportDone(false);
                   setExportError(null);
                 }
               }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Workspace Hub Export
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compiling documents, indexes, and annotations cleanly...
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                {exportError ? (
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle size={32} />
                  </div>
                ) : exportDone ? (
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-500 mb-2 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 relative">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                )}

                <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase mt-4 tracking-widest min-h-[20px]">
                  {exportError ? "Export Failed" : exportDone ? "Export Complete!" : exportStatus}
                </p>
              </div>

              {/* Progress Indicator Bar */}
              {!exportError && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${exportDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Exporting</span>
                    <span>{exportProgress}%</span>
                  </div>
                </div>
              )}

              {exportError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-950/50 leading-relaxed font-semibold">
                  {exportError}
                </p>
              )}

              {exportDone && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300 font-bold leading-normal">
                  "workspace-hub.zip" generated cleanly with indices, HTML pages, bookmarks, and remarks.
                </div>
              )}

              <div className="pt-2">
                {(exportDone || exportError) ? (
                  <button
                    onClick={() => {
                      setIsExporting(false);
                      setExportDone(false);
                      setExportError(null);
                    }}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-850 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Dismiss
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                    Please keep this window open...
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Project</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-8">
                <div className="space-y-6 mb-10">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Project Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="e.g. Modern Physics Notes"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-lg"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">A Brief Description</label>
                    <textarea 
                      placeholder="What are we working on here?"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none min-h-[120px] font-medium resize-none"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  disabled={creating}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/40 text-xs active:scale-[0.98]"
                >
                  {creating ? 'Creating...' : 'Initialize Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowUploadModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-xl">
              <DocUpload 
                onSuccess={(newListing) => {
                  fetchData();
                  setShowUploadModal(false);
                }}
                onCancel={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Configuration (Visibility & Tags) Modal */}
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
              className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Project Settings</h2>
                  <p className="text-[10px] uppercase font-black text-slate-400 mt-1">{selectedProjectForSettings.title}</p>
                </div>
                <button 
                  onClick={() => setSelectedProjectForSettings(null)}
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Visibility Toggle Options */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Visibility Setting</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setProjectSettingsVisibility('private')}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all outline-none ${
                        projectSettingsVisibility === 'private'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
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
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">🌍</span>
                      <span>Public</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
                    {projectSettingsVisibility === 'public'
                      ? 'Visible to everyone inside the Public Content Explorer registry.'
                      : 'Only visible to you and operational administrators.'}
                  </p>
                </div>

                {/* Tag Editors */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Project Tags</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter tag (e.g. documentation)..."
                      value={projectSettingsNewTag}
                      onChange={(e) => setProjectSettingsNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddProjectSettingsTag(); }}
                      className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                      projectSettingsTags.map((tag) => (
                        <div key={tag} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 flex items-center space-x-1 shrink-0">
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

export default ListingDashboard;
