import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'lawyer' | 'admin';
  openAuthModal?: (mode: 'login' | 'register') => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, openAuthModal }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.info('Please login to access this feature', {
        position: 'top-center',
        autoClose: 3000
      });
      // Open modal instead of navigating
      if (openAuthModal) {
        openAuthModal('login');
      }
    }
  }, [isLoading, isAuthenticated, openAuthModal]);

  // Auto-redirect admin users (like adityajare2004@gmail.com) to admin dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // If user is admin and trying to access non-admin routes, redirect to admin
      if (user.role === 'admin' && !location.pathname.startsWith('/admin')) {
        // Allow homepage access
        if (location.pathname !== '/') {
          toast.info('Redirecting to Admin Dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, location]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#0b1220' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="spinner-border"
            role="status"
            style={{ color: '#5dd0ff', width: '3rem', height: '3rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (requiredRole === 'admin' && user?.role !== 'admin') {
      toast.error('Access denied: Admin privileges required');
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'lawyer' && !['lawyer', 'admin'].includes(user?.role || '')) {
      toast.error('Access denied: Lawyer privileges required');
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
