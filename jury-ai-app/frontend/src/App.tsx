import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Components
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChatPage from './pages/ChatPage';
import ContractReviewPage from './pages/ContractReviewPage';
import TemplatesPage from './pages/TemplatesPage';
import LawyerNetworkPage from './pages/LawyerNetworkPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';

import './App.css';

function App() {
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({
    open: false,
    mode: 'login',
  });

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModal({ open: true, mode });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage openAuthModal={openAuthModal} />} />
            {/* Legacy routes — show homepage and auto-open auth modal */}
            <Route path="/login" element={<HomePage openAuthModal={openAuthModal} autoOpenAuth="login" />} />
            <Route path="/register" element={<HomePage openAuthModal={openAuthModal} autoOpenAuth="register" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute openAuthModal={openAuthModal}>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute openAuthModal={openAuthModal}>
                  <TemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contract-review"
              element={
                <ProtectedRoute openAuthModal={openAuthModal}>
                  <ContractReviewPage />
                </ProtectedRoute>
              }
            />
            <Route path="/lawyers" element={<LawyerNetworkPage />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin" openAuthModal={openAuthModal}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Auth Modal */}
          <AuthModal
            isOpen={authModal.open}
            onClose={closeAuthModal}
            initialMode={authModal.mode}
          />

          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
