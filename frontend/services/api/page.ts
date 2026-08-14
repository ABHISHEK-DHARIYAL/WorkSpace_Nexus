import api from './client';

/**
 * Page resource API calls. Consolidated from three near-identical inline
 * copies (ListingDashboard.tsx, ListingEditor.tsx, ListingReader.tsx) into
 * one shared module.
 */
export const pageService = {
  getAll: () => api.get('/page'),
  getByWorkspace: (workspaceId: string) => api.get(`/page/workspace/${workspaceId}`),
  getByListing: (listingId: string) => api.get(`/page/${listingId}`),
  create: (data: any) => api.post('/page', data),
  update: (id: string, data: any) => api.put(`/page/${id}`, data),
  delete: (id: string) => api.delete(`/page/${id}`),
};
