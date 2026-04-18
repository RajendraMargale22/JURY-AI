import React, { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalLawyers: number;
  pendingVerifications: number;
  totalChats: number;
  totalTemplates: number;
  totalDocuments: number;
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalLawyers: 0,
    pendingVerifications: 0,
    totalChats: 0,
    totalTemplates: 0,
    totalDocuments: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/admin/dashboard', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalLawyers: data.totalLawyers || 0,
          pendingVerifications: data.pendingVerifications || 0,
          totalChats: data.totalChats || 0,
          totalTemplates: data.totalTemplates || 0,
          totalDocuments: data.totalDocuments || 0,
          recentActivity: data.recentActivity || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ 
          color: 'rgba(255, 255, 255, 0.95)',
          background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Dashboard Overview</h2>
        <button 
          className="btn" 
          onClick={fetchDashboardStats}
          style={{
            background: 'rgba(93, 208, 255, 0.1)',
            border: '1px solid rgba(93, 208, 255, 0.3)',
            color: '#5dd0ff',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(93, 208, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(93, 208, 255, 0.1)'}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, rgba(93, 208, 255, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(93, 208, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>Total Users</h6>
                  <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalUsers}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-users fa-2x" style={{ opacity: 0.5 }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>Total Lawyers</h6>
                  <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalLawyers}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-balance-scale fa-2x" style={{ opacity: 0.5 }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>Pending Verifications</h6>
                  <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.pendingVerifications}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-clock fa-2x" style={{ opacity: 0.5 }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, rgba(124, 93, 255, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid rgba(124, 93, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>Total Chats</h6>
                  <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalChats}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-comments fa-2x" style={{ opacity: 0.5 }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-file-alt fa-3x mb-3" style={{ color: '#5dd0ff' }}></i>
              <h4 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '2rem', fontWeight: 700 }}>{stats.totalTemplates}</h4>
              <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Legal Templates</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-folder fa-3x mb-3" style={{ color: '#7c5dff' }}></i>
              <h4 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '2rem', fontWeight: 700 }}>{stats.totalDocuments}</h4>
              <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="card-header" style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <h5 className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Recent Activity</h5>
        </div>
        <div className="card-body">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="list-group list-group-flush">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="list-group-item d-flex justify-content-between align-items-start" style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: index < stats.recentActivity.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  padding: '1rem 0'
                }}>
                  <div className="ms-2 me-auto">
                    <div className="fw-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{activity.type}</div>
                    <p className="mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{activity.description}</p>
                  </div>
                  <small style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center mb-0" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
