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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; description: string; timestamp: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/admin/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return;
        const payload = await response.json();
        const activities = payload?.data?.recentActivity || payload?.recentActivity || [];
        setRecentActivity(activities);

        const lastSeenRaw = localStorage.getItem('adminNotificationsLastSeenAt');
        const lastSeenTs = lastSeenRaw ? Date.parse(lastSeenRaw) : 0;
        const unread = activities.filter((item: { timestamp: string }) => Date.parse(item.timestamp) > lastSeenTs).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
      }
    };

    fetchNotifications();
  }, [location.pathname]);

  const markNotificationsAsRead = () => {
    localStorage.setItem('adminNotificationsLastSeenAt', new Date().toISOString());
    setUnreadCount(0);
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
                <button
                  className="btn p-0 border-0 bg-transparent"
                  onClick={() => {
                    const next = !notificationsOpen;
                    setNotificationsOpen(next);
                    if (next) {
                      markNotificationsAsRead();
                    }
                  }}
                  title="Notifications"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <i className="fas fa-bell ms-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem' }}></i>
                </button>
                {unreadCount > 0 && (
                  <span className="badge" style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-8px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                    fontSize: '0.7rem'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}

                {notificationsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: '320px',
                      maxHeight: '360px',
                      overflowY: 'auto',
                      zIndex: 2000,
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '1px solid rgba(93, 208, 255, 0.25)',
                      borderRadius: '10px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                    }}
                  >
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontWeight: 600 }}>
                      Notifications
                    </div>
                    {recentActivity.length === 0 ? (
                      <div style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>No notifications yet.</div>
                    ) : (
                      recentActivity.slice(0, 10).map((item, index) => (
                        <div key={`${item.timestamp}-${index}`} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>{item.type}</div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{item.description}</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 4 }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
