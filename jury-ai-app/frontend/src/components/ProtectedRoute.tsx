import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'lawyer' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.info('Please login to access this feature', {
        position: 'top-center',
        autoClose: 3000
      });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
