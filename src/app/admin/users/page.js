'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

export default function UsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleCount = (role) => {
    if (role === 'all') return users.length;
    return users.filter(user => user.role === role).length;
  };

  const getRoleBadge = (role) => {
    const badges = {
      'main-admin': 'bg-purple-100 text-purple-800',
      'salon-admin': 'bg-blue-100 text-blue-800',
      'customer': 'bg-green-100 text-green-800',
      'staff': 'bg-yellow-100 text-yellow-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'main-admin': 'Main Admin',
      'salon-admin': 'Salon Admin',
      'customer': 'Customer',
      'staff': 'Staff',
    };
    return labels[role] || role;
  };

  const handleEdit = (user) => {
    setEditingUser({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user');
    }
  };

  const handleDelete = async (userId, userName) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus, userName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} "${userName}"?`,
      confirmText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        toast.success(`User ${action}d successfully`);
        fetchUsers();
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Error ${action}ing user`);
    }
  };

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage all registered users and their permissions</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 pl-10 sm:pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
            />
            <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm sm:text-base"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Role Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'main-admin', 'salon-admin', 'customer', 'staff'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                  roleFilter === role
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All' : getRoleLabel(role).split(' ')[0]} ({getRoleCount(role)})
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-base sm:text-lg mb-4">
              {searchQuery 
                ? `No users found matching "${searchQuery}"`
                : roleFilter !== 'all'
                ? `No ${getRoleLabel(roleFilter)} users found`
                : 'No users found'}
            </p>
            {(searchQuery || roleFilter !== 'all') && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
                  >
                    Clear Search
                  </button>
                )}
                {roleFilter !== 'all' && (
                  <button
                    onClick={() => setRoleFilter('all')}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                  >
                    Show All Users
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
                {roleFilter !== 'all' && <span className="font-medium hidden sm:inline"> • Filtered by: {getRoleLabel(roleFilter)}</span>}
              </div>
              {(searchQuery || roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">ID: {user._id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.salonId ? (
                            <div>
                              <div className="font-medium text-gray-900">{user.salonId.name}</div>
                              <div className="text-xs">{user.salonId.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No salon</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 min-w-[120px]">
                            <button onClick={() => handleEdit(user)} className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition-colors">
                              Edit
                            </button>
                            <button onClick={() => toggleUserStatus(user._id, user.isActive, user.name)} className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                user.isActive ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-green-600 text-white hover:bg-green-700'
                              }`}>
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => handleDelete(user._id, user.name)} className="w-full px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (shown on mobile/tablet) */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {filteredUsers.map((user) => (
                <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-lg sm:text-xl">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 break-all">{user.email}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{user.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Role:</span>
                      <span className={`ml-2 px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {user.salonId && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Salon:</span>
                        <span className="ml-2 text-gray-900">{user.salonId.name}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium">Joined:</span>
                      <span className="ml-2 text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleEdit(user)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm font-medium">
                      Edit
                    </button>
                    <button onClick={() => toggleUserStatus(user._id, user.isActive, user.name)} className={`px-3 py-2 rounded text-xs sm:text-sm font-medium ${
                        user.isActive ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-green-600 text-white hover:bg-green-700'
                      }`}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(user._id, user.name)} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Edit User</h2>
              
              <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                  >
                    <option value="customer">Customer</option>
                    <option value="salon-admin">Salon Admin</option>
                    <option value="staff">Staff</option>
                    <option value="main-admin">Main Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <label className="text-xs sm:text-sm text-gray-700">Active</label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
