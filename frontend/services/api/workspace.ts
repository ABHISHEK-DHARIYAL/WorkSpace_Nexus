import api from './client';

/**
 * Workspace resource API calls. Consolidated from three near-identical inline
 * copies (WorkspaceDashboard.tsx, ListingDashboard.tsx) into one shared
 * module — each page previously had to be edited in lockstep whenever an
 * endpoint changed (a DRY/SRP violation). This is the single source of truth
 * for the `/workspace` resource now.
 */
export const workspaceService = {
  getAll: () => api.get('/workspace'),
  getById: (id: string) => api.get(`/workspace/${id}`),
  create: (data: any) => api.post('/workspace', data),
  update: (id: string, data: any) => api.put(`/workspace/${id}`, data),
  delete: (id: string) => api.delete(`/workspace/${id}`),
};
