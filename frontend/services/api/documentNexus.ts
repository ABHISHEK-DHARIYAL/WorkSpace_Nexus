import api from './client';

/**
 * Document Nexus resource API calls (the "/document-nexus/*" namespace).
 * Extracted out of DocumentWorkspace.tsx so this large page file no longer
 * owns network-call definitions alongside its UI logic (SRP).
 */
export const documentNexusWorkspaceService = {
  getAll: () => api.get('/document-nexus/workspace'),
  create: (data: any) => api.post('/document-nexus/workspace', data),
  update: (id: string, data: any) => api.put(`/document-nexus/workspace/${id}`, data),
  delete: (id: string) => api.delete(`/document-nexus/workspace/${id}`),
};

export const documentNexusListingService = {
  getAll: () => api.get('/document-nexus/document'),
  getByWorkspace: (workspaceId: string) => api.get(`/document-nexus/document/workspace/${workspaceId}`),
  getById: (id: string) => api.get(`/document-nexus/document/${id}`),
  create: (data: any) => api.post('/document-nexus/document', data),
  update: (id: string, data: any) => api.put(`/document-nexus/document/${id}`, data),
  delete: (id: string) => api.delete(`/document-nexus/document/${id}`),
};
