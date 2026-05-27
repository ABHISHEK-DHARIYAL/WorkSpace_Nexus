import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isPublicPath = (pathname: string): boolean => {
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  const publicPaths = ['/', '/login', '/signup', '/public-content'];
  if (publicPaths.includes(cleanPath)) return true;
  if (
    cleanPath.startsWith('/content/') ||
    cleanPath.startsWith('/nexus/read/') ||
    cleanPath.startsWith('/nexus/bookmark/read/') ||
    cleanPath.startsWith('/listing/read/')
  ) {
    return true;
  }
  return false;
};

api.interceptors.response.use(
  (response) => {
    // Save successful GET requests to local storage cache for offline support and durability
    if (response.config && response.config.method?.toLowerCase() === 'get' && response.data) {
      try {
        localStorage.setItem(`api_cache:${response.config.url}`, JSON.stringify(response.data));
      } catch (e) {
        console.warn('LocalStorage limit reached or disabled, unable to write API cache:', e);
      }
    }
    return response;
  },
  (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url || '';
    const currentPath = window.location.pathname;
    
    // Check if the endpoint is an auth/verification endpoint (case insensitive and relaxed)
    const urlLower = url.toLowerCase();
    const isAuth = urlLower.includes('auth/login') || urlLower.includes('auth/signup') || urlLower.includes('auth/me') || urlLower.includes('/me');

    // Always elevate server error message to error.message for better display fallback
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    // Local persistence caching / Offline Support
    // Resolve with cached values if we hit a network error (no response) or server error (status >= 500) or browser is offline
    if (config && config.method?.toLowerCase() === 'get' && (!error.response || status >= 500 || !navigator.onLine)) {
      try {
        const cached = localStorage.getItem(`api_cache:${config.url}`);
        if (cached) {
          console.warn(`[Offline Mode] Intercepted connection error. Serving cached data for ${config.url}`);
          return Promise.resolve({
            ...error.response,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            data: JSON.parse(cached),
          });
        }
      } catch (cacheErr) {
        console.error('Failed to read response from local cache fallback:', cacheErr);
      }
    }

    if (status === 401) {
      // Clear token and user from local storage quietly since they are invalid/expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];

      // If we are on an auth endpoint or a public page, do NOT intercept or append session expired message
      if (isAuth || isPublicPath(currentPath)) {
        return Promise.reject(error);
      }

      // For authenticated private pages, enrich the error message
      const friendlyMessage = 'Your session has expired or you are unauthenticated. Please log in to continue.';
      if (error.response) {
        if (!error.response.data) {
          error.response.data = {};
        }
        error.response.data.message = friendlyMessage;
      }
      error.message = friendlyMessage;

      // Soft redirect to login for private pages
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    } else {
      // Log other non-401 connection/server errors
      if (status !== 401) {
        console.error('API Error:', {
          status,
          message: error.response?.data?.message || error.message,
          url
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
