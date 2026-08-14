import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  const { openLogin } = useAuthModal();

  // Instead of sending the visitor to a dedicated login page, redirect them
  // to the (public) home page and pop the login card open there.
  useEffect(() => {
    if (!loading && !user) {
      openLogin();
    }
  }, [loading, user, openLogin]);

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
