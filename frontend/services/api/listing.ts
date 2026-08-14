import api from './client';

/**
 * Listing resource API calls. Consolidated from three near-identical inline
 * copies (ListingDashboard.tsx, ListingEditor.tsx, ListingReader.tsx) into
 * one shared module.
 */
export const listingService = {
  getAll: () => api.get('/listing'),
  getByWorkspace: (workspaceId: string) => api.get(`/listing/workspace/${workspaceId}`),
  getById: (id: string) => api.get(`/listing/${id}`),
  create: (data: any) => api.post('/listing', data),
  update: (id: string, data: any) => api.put(`/listing/${id}`, data),
  delete: (id: string) => api.delete(`/listing/${id}`),
  searchInWorkspace: (workspaceId: string, q: string) => api.get(`/listing/search/${workspaceId}?q=${q}`),
};
