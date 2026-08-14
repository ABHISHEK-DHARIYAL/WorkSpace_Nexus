/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DeviceProvider } from './context/DeviceContext';
import { ScaleProvider } from './providers/ScaleProvider';
import { NotificationProvider } from './context/NotificationContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { SafeGuard } from './components/ui/SafeGuard';
import Navbar from './components/ui/Navbar';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Sidebar from './components/ui/Sidebar';
import AuthModal from './components/ui/AuthModal';
import FirestoreSyncManager from './components/FirestoreSyncManager';

// Pages
import Home from './pages/Home';
import ListingDashboard from './pages/ListingDashboard';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
import ListingEditor from './pages/ListingEditor';
import ListingReader from './pages/ListingReader';
import DocumentWorkspace from './pages/DocumentWorkspace';
import ContentPage from './pages/ContentPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Additional Pages
import PublicContentPage from './pages/PublicContentPage';
import BookmarksPage from './pages/BookmarksPage';
import DocumentNexusReader from './pages/DocumentNexusReader';
import DocumentNexusBookmarkReader from './pages/DocumentNexusBookmarkReader';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [isImmersive, setIsImmersive] = useState(false);

  React.useEffect(() => {
    const handleImmersiveChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsImmersive(!!customEvent.detail?.active);
    };
    window.addEventListener('immersive-mode-change', handleImmersiveChange);
    return () => {
      window.removeEventListener('immersive-mode-change', handleImmersiveChange);
    };
  }, []);

  // Save the current authenticated private URL for persistent path restoration across refreshes
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('last_private_url', location.pathname + location.search + location.hash);
    }
  }, [location, user]);

  // Restore scroll positions across route transitions and page refreshes
  React.useEffect(() => {
    const key = `scroll_pos:${location.pathname}${location.search}`;
    const savedScrollPos = localStorage.getItem(key);
    
    // Smooth/instant restoration of previous scroll state post render frame
    const timer = setTimeout(() => {
      if (savedScrollPos) {
        window.scrollTo({ top: parseInt(savedScrollPos, 10), behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }, 150);

    const handleScroll = () => {
      localStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, location.search]);

  const showSidebar = !!user;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-[#0f1115] dark:text-slate-200 transition-colors duration-300 font-sans selection:bg-black dark:selection:bg-[#eee1ba] selection:text-white dark:selection:text-black">
      <FirestoreSyncManager />
      {!isImmersive && <Navbar />}
      <div className={`flex ${isImmersive ? 'pt-0' : 'pt-14 sm:pt-16'}`}>
        {showSidebar && !isImmersive && <Sidebar />}
        <main className="flex-grow min-w-0">
          <Routes>
            {/* Home is public — Login/Signup are popup-only (see AuthModal), never a dedicated page */}
            <Route path="/" element={<Home />} />

            {/* Old bookmarked/shared links to the removed dedicated auth pages still work */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />

            <Route path="/content/:slug" element={<ContentPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <WorkspaceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
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
                <ProtectedRoute>
                  <ListingReader />
                </ProtectedRoute>
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

            {/* Explorer / Nexus Pages -- now behind login too */}
            <Route
              path="/public-content"
              element={
                <ProtectedRoute>
                  <PublicContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nexus/read/:id"
              element={
                <ProtectedRoute>
                  <DocumentNexusReader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nexus/bookmark/read/:projectId"
              element={
                <ProtectedRoute>
                  <DocumentNexusBookmarkReader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nexus/bookmark/read/:projectId/:pageId"
              element={
                <ProtectedRoute>
                  <DocumentNexusBookmarkReader />
                </ProtectedRoute>
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
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SafeGuard>
        <ThemeProvider>
          <DeviceProvider>
            <ScaleProvider>
              <NotificationProvider>
                <AuthProvider>
                  <AuthModalProvider>
                    <AppContent />
                  </AuthModalProvider>
                </AuthProvider>
              </NotificationProvider>
            </ScaleProvider>
          </DeviceProvider>
        </ThemeProvider>
      </SafeGuard>
    </Router>
  );
}
