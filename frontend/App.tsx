/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DeviceProvider } from './context/DeviceContext';
import { ScaleProvider } from './providers/ScaleProvider';
import Navbar from './components/ui/Navbar';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Sidebar from './components/ui/Sidebar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ListingDashboard from './pages/ListingDashboard';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
import ListingEditor from './pages/ListingEditor';
import ListingReader from './pages/ListingReader';
import DocumentWorkspace from './pages/DocumentWorkspace';
import ContentPage from './pages/ContentPage';

// Additional Pages
import PublicContentPage from './pages/PublicContentPage';
import BookmarksPage from './pages/BookmarksPage';
import DocumentNexusReader from './pages/DocumentNexusReader';
import DocumentNexusBookmarkReader from './pages/DocumentNexusBookmarkReader';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  const publicPaths = ['/', '/login', '/signup'];
  const isPublic = publicPaths.includes(location.pathname) || location.pathname.startsWith('/content/');

  const showSidebar = user && !['/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-[#0f1115] dark:text-slate-200 transition-colors duration-300 font-sans selection:bg-black dark:selection:bg-[#eee1ba] selection:text-white dark:selection:text-black">
      <Navbar />
      <div className="flex pt-14 sm:pt-16">
        {showSidebar && <Sidebar />}
        <main className="flex-grow min-w-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/content/:slug" element={<ContentPage />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <WorkspaceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace/:workspaceId"
              element={
                <ProtectedRoute>
                  <ListingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listing/edit/:id"
              element={
                <ProtectedRoute>
                  <ListingEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listing/read/:id"
              element={
                <ListingReader />
              }
            />
            <Route
              path="/document"
              element={
                <ProtectedRoute>
                  <DocumentWorkspace />
                </ProtectedRoute>
              }
            />

            {/* New Public Explorer Pages */}
            <Route
              path="/public-content"
              element={
                <PublicContentPage />
              }
            />
            <Route
              path="/nexus/read/:id"
              element={
                <DocumentNexusReader />
              }
            />
            <Route
              path="/nexus/bookmark/read/:projectId"
              element={
                <DocumentNexusBookmarkReader />
              }
            />
            <Route
              path="/nexus/bookmark/read/:projectId/:pageId"
              element={
                <DocumentNexusBookmarkReader />
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <BookmarksPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <DeviceProvider>
          <ScaleProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ScaleProvider>
        </DeviceProvider>
      </ThemeProvider>
    </Router>
  );
}
