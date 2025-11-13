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
      const response = await fetch('/api/admin/dashboard', {
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
        <h2>Dashboard Overview</h2>
        <button className="btn btn-outline-primary" onClick={fetchDashboardStats}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Users</h6>
                  <h2 className="mb-0">{stats.totalUsers}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-users fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Lawyers</h6>
                  <h2 className="mb-0">{stats.totalLawyers}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-balance-scale fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Pending Verifications</h6>
                  <h2 className="mb-0">{stats.pendingVerifications}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-clock fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Chats</h6>
                  <h2 className="mb-0">{stats.totalChats}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-comments fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="fas fa-file-alt fa-3x text-success mb-3"></i>
              <h4>{stats.totalTemplates}</h4>
              <p className="text-muted mb-0">Legal Templates</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <i className="fas fa-folder fa-3x text-warning mb-3"></i>
              <h4>{stats.totalDocuments}</h4>
              <p className="text-muted mb-0">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Recent Activity</h5>
        </div>
        <div className="card-body">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="list-group list-group-flush">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="list-group-item d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{activity.type}</div>
                    <p className="mb-1">{activity.description}</p>
                  </div>
                  <small className="text-muted">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center mb-0">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
