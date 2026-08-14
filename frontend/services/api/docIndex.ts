import api from './client';

/**
 * Document Nexus TOC/index resource (the "/index" namespace). Extracted out
 * of DocumentWorkspace.tsx for the same reason as docPage.ts (SRP).
 */
export const docIndexService = {
  getAll: () => api.get('/index'),
  getById: (id: string) => api.get(`/index/${id}`),
  create: (data: any) => api.post('/index', data),
  update: (id: string, data: any) => api.put(`/index/${id}`, data),
  delete: (id: string) => api.delete(`/index/${id}`),
};
