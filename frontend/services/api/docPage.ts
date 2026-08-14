import api from './client';

/**
 * Document Nexus "page content" resource (the "/content/page" namespace).
 * Extracted out of DocumentWorkspace.tsx so this large page component no
 * longer owns network-call definitions alongside its UI logic (SRP).
 */
export const docPageService = {
  getAll: () => api.get('/content/page'),
  getById: (id: string) => api.get(`/content/page/${id}`),
  create: (data: any) => api.post('/content/page', data),
  update: (id: string, data: any) => api.put(`/content/page/${id}`, data),
  delete: (id: string) => api.delete(`/content/page/${id}`),
};
