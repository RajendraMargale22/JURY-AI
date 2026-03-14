import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboardHome from './AdminDashboardHome';
import AdminUsers from './AdminUsers';
import AdminLawyers from './AdminLawyers';
import AdminTemplates from './AdminTemplates';
import AdminSettings from './AdminSettings';
import './AdminStyles.css';

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
    <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)' }}>
      {/* Sidebar */}
      <nav className={`text-white ${sidebarCollapsed ? 'collapsed-sidebar' : 'sidebar'}`} style={{ 
        background: 'rgba(255, 255, 255, 0.02)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="sidebar-header p-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
                  className={`nav-link text-white d-flex align-items-center px-3 py-2`}
                  style={{ 
                    transition: 'all 0.3s',
                    background: isActiveRoute(item.path, item.exact) 
                      ? 'linear-gradient(135deg, rgba(93, 208, 255, 0.2), rgba(124, 93, 255, 0.2))' 
                      : 'transparent',
                    borderLeft: isActiveRoute(item.path, item.exact) 
                      ? '3px solid #5dd0ff' 
                      : '3px solid transparent',
                    borderRadius: '0 8px 8px 0'
                  }}
                >
                  <i className={`${item.icon} me-3`}></i>
                  <span className={sidebarCollapsed ? 'd-none' : ''}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer p-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Link
            to="/"
            className="nav-link text-white d-flex align-items-center px-0 py-2"
            title="Back to Main Site"
            style={{ opacity: 0.8 }}
          >
            <i className="fas fa-arrow-left me-3"></i>
            <span className={sidebarCollapsed ? 'd-none' : ''}>Back to Site</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3" style={{ 
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button
                className="btn me-3"
                style={{
                  background: 'rgba(93, 208, 255, 0.1)',
                  border: '1px solid rgba(93, 208, 255, 0.3)',
                  color: '#5dd0ff'
                }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title="Toggle Sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{getPageTitle()}</h2>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ position: 'relative' }}>
                <span className="badge" style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                  fontSize: '0.7rem'
                }}>5</span>
                <i className="fas fa-bell ms-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem' }}></i>
              </div>
              <div className="d-flex align-items-center">
                <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                     style={{ 
                       width: '36px', 
                       height: '36px',
                       background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)'
                     }}>
                  <i className="fas fa-user"></i>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{user?.name}</span>
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
          background: rgba(93, 208, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
