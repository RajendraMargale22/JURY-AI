import React, { useState, useEffect } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'lawyer' | 'admin';
  isVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          fetchUsers(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'lawyer': return 'bg-warning text-dark';
      case 'user': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'suspended': return 'bg-danger';
      default: return 'bg-secondary';
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
      {/* Header with Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(93, 208, 255, 0.15), rgba(93, 208, 255, 0.05))',
            border: '1px solid rgba(93, 208, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x mb-2" style={{color: '#5dd0ff'}}></i>
              <h3 style={{color: '#5dd0ff', marginBottom: '0.25rem'}}>{users.length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Total Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(124, 93, 255, 0.15), rgba(124, 93, 255, 0.05))',
            border: '1px solid rgba(124, 93, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-user-check fa-2x mb-2\" style={{color: '#7c5dff'}}></i>
              <h3 style={{color: '#7c5dff', marginBottom: '0.25rem'}}>{users.filter(u => u.status === 'active').length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Active Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-shield-alt fa-2x mb-2\" style={{color: '#22c55e'}}></i>
              <h3 style={{color: '#22c55e', marginBottom: '0.25rem'}}>{users.filter(u => u.isVerified).length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Verified</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-ban fa-2x mb-2\" style={{color: '#ef4444'}}></i>
              <h3 style={{color: '#ef4444', marginBottom: '0.25rem'}}>{users.filter(u => u.status === 'suspended').length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Suspended</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn" 
          style={{
            background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontWeight: 600
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search Users</label>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="roleFilter" className="form-label">Filter by Role</label>
                <select
                  className="form-select"
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="lawyer">Lawyers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                <select
                  className="form-select"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body">
          {users.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div>
                            <strong>{user.username}</strong>
                            <br />
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {user.isVerified ? (
                            <i className="fas fa-check-circle text-success"></i>
                          ) : (
                            <i className="fas fa-times-circle text-danger"></i>
                          )}
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                                title="Change Status"
                              >
                                <i className="fas fa-cog"></i>
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(user._id, 'active')}
                                  >
                                    Set Active
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(user._id, 'inactive')}
                                  >
                                    Set Inactive
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(user._id, 'suspended')}
                                  >
                                    Suspend
                                  </button>
                                </li>
                              </ul>
                            </div>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Users pagination">
                  <ul className="pagination justify-content-center mt-4">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No users found</h5>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
