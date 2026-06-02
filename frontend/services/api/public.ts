import api from "./client";

export const publicService = {
  getDashboardHub: () => api.get("/public/dashboardHub"),
  getDocumentNexus: () => api.get("/public/documentNexus"),
  getProjects: () => api.get("/public/projects"),
  getProjectById: (id: string) => api.get(`/public/project/${id}`),
  getPageById: (id: string) => api.get(`/public/page/${id}`),
  copyProject: (id: string) => api.post(`/public/project/${id}/copy`),
  updateVisibility: (id: string, visibility: "public" | "private", tags: string[]) => 
    api.patch(`/public/project/${id}/visibility`, { visibility, tags }),
  
  toggleBookmark: (pageId: string, projectId: string) => 
    api.post("/public/bookmarks", { pageId, projectId }),
  getBookmarks: () => 
    api.get("/public/bookmarks"),
  
  toggleFavorite: (projectId: string) => 
    api.post("/public/favorites", { projectId }),
  
  toggleFollow: (targetEmail: string) => 
    api.post("/public/follow", { targetEmail }),
  getFollows: () => 
    api.get("/public/follows"),
  
  getAuditLogs: () => 
    api.get("/public/audit-logs"),
  
  moderateProject: (id: string, action: "hide" | "unhide" | "feature" | "unfeature" | "unpublish" | "to-private", reason?: string) => 
    api.patch(`/public/moderate/${id}`, { action, reason }),
  
  adminDeleteContent: (id: string, reason?: string) => 
    api.delete(`/public/admin-delete/${id}`, { data: { reason } })
};
