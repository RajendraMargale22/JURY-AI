import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsers from './AdminUsers';
import AdminLawyers from './AdminLawyers';
import AdminTemplates from './AdminTemplates';
import AdminSettings from './AdminSettings';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: 'fas fa-users', label: 'User Management' },
    { path: '/admin/lawyers', icon: 'fas fa-user-tie', label: 'Lawyer Management' },
    { path: '/admin/templates', icon: 'fas fa-file-alt', label: 'Template Management' },
    { path: '/admin/settings', icon: 'fas fa-cog', label: 'Settings' }
  ];

  const isActiveRoute = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => 
      item.exact ? currentPath === item.path : currentPath.startsWith(item.path)
    );
    return menuItem?.label || 'Dashboard';
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <nav className={`bg-dark text-white ${sidebarCollapsed ? 'collapsed-sidebar' : 'sidebar'}`}>
        <div className="sidebar-header p-3 border-bottom border-secondary">
          <Link to="/admin" className="text-decoration-none text-white">
            <div className="d-flex align-items-center">
              <i className="fas fa-balance-scale fs-3 me-2"></i>
              <div className={sidebarCollapsed ? 'd-none' : ''}>
                <h5 className="mb-0">Jury AI Admin</h5>
                <small className="text-muted">Control Panel</small>
              </div>
            </div>
          </Link>
        </div>

        <div className="sidebar-nav flex-grow-1">
          <ul className="nav flex-column py-3">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link text-white d-flex align-items-center px-3 py-2 ${
                    isActiveRoute(item.path, item.exact) ? 'bg-primary' : ''
                  }`}
                  style={{ transition: 'all 0.3s' }}
                >
                  <i className={`${item.icon} me-3`}></i>
                  <span className={sidebarCollapsed ? 'd-none' : ''}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer border-top border-secondary p-3">
          <Link
            to="/"
            className="nav-link text-white d-flex align-items-center px-0 py-2"
            title="Back to Main Site"
          >
            <i className="fas fa-arrow-left me-3"></i>
            <span className={sidebarCollapsed ? 'd-none' : ''}>Back to Site</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Header */}
        <header className="bg-white border-bottom px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title="Toggle Sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="mb-0 text-dark">{getPageTitle()}</h2>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="me-3">
                <span className="badge bg-danger">5</span>
                <i className="fas fa-bell ms-1 text-muted"></i>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                     style={{ width: '32px', height: '32px' }}>
                  <i className="fas fa-user"></i>
                </div>
                <span className="text-dark">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<AdminDashboardHome />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/lawyers" element={<AdminLawyers />} />
            <Route path="/templates" element={<AdminTemplates />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>

      <style>{`
        .sidebar {
          width: 250px;
          transition: all 0.3s;
        }
        .collapsed-sidebar {
          width: 70px;
          transition: all 0.3s;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
