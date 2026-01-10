'use client';
import { useState, useEffect } from 'react';
import SalonAdminLayout from '@/components/SalonAdminLayout';
import { useToast } from '@/components/Toast';

export default function StaffPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'stylist',
    specialties: '',
    isActive: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/salon-admin/staff');
      const data = await response.json();
      
      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/salon-admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      const body = editingStaff 
        ? { ...formData, staffId: editingStaff._id, specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean) }
        : { ...formData, specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean) };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingStaff ? 'Staff updated!' : 'Staff member added!');
        setShowModal(false);
        setEditingStaff(null);
        setFormData({ name: '', email: '', phone: '', role: 'stylist', specialties: '', isActive: true });
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to save staff');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Failed to save staff');
    }
  };

  const deleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`/api/salon-admin/staff?id=${staffId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Staff member deleted!');
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const response = await fetch('/api/salon-admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, isActive: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Staff ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone,
      role: member.role,
      specialties: member.specialties?.join(', ') || '',
      isActive: member.isActive
    });
    setShowModal(true);
  };

  const getRoleIcon = (role) => {
    const icons = {
      stylist: '💇',
      barber: '✂️',
      receptionist: '📋',
      manager: '👔'
    };
    return icons[role] || '👤';
  };

  const getRoleColor = (role) => {
    const colors = {
      stylist: 'bg-purple-100 text-purple-800',
      barber: 'bg-blue-100 text-blue-800',
      receptionist: 'bg-green-100 text-green-800',
      manager: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <SalonAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
        </div>
      </SalonAdminLayout>
    );
  }

  return (
    <SalonAdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage your salon team members</p>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setFormData({ name: '', email: '', phone: '', role: 'stylist', specialties: '', isActive: true });
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl">+</span>
            Add Staff
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Staff', value: staff.length, color: 'bg-blue-100 text-blue-800', emoji: '👥' },
            { label: 'Active', value: staff.filter(s => s.isActive).length, color: 'bg-green-100 text-green-800', emoji: '✅' },
            { label: 'Stylists', value: staff.filter(s => s.role === 'stylist').length, color: 'bg-purple-100 text-purple-800', emoji: '💇' },
            { label: 'Barbers', value: staff.filter(s => s.role === 'barber').length, color: 'bg-blue-100 text-blue-800', emoji: '✂️' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl ${stat.color}`}>
                  {stat.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Staff List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {staff.length > 0 ? (
            staff.map(member => (
              <div key={member._id} className={`bg-white rounded-lg sm:rounded-xl shadow-sm border-2 p-4 sm:p-6 transition-all ${
                member.isActive ? 'border-green-200 hover:shadow-md' : 'border-gray-200 opacity-60'
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{member.name}</h3>
                      <span className={`inline-block px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)} {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStaffStatus(member._id, member.isActive)}
                    className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Contact Info */}
                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                  <p className="text-gray-600 truncate">📞 {member.phone}</p>
                  {member.email && <p className="text-gray-600 truncate">✉️ {member.email}</p>}
                </div>

                {/* Specialties */}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">SPECIALTIES</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {member.specialties.map((specialty, index) => (
                        <span key={index} className="px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(member.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {member.rating?.toFixed(1) || '0.0'} ({member.totalReviews || 0})
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-1 px-3 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-xs sm:text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStaff(member._id)}
                    className="flex-1 px-3 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">👨‍💼</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No staff members yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Add your first team member to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm sm:text-base"
              >
                Add First Staff Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base text-gray-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base text-gray-900"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base text-gray-900"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base text-gray-900"
                >
                  <option value="stylist">💇 Stylist</option>
                  <option value="barber">✂️ Barber</option>
                  <option value="receptionist">📋 Receptionist</option>
                  <option value="manager">👔 Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Specialties</label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base text-gray-900"
                  placeholder="Haircut, Beard, Coloring (comma separated)"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple specialties with commas</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-xs sm:text-sm font-medium text-gray-700">
                  Active (Available for bookings)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStaff(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base"
                >
                  {editingStaff ? 'Update' : 'Add'} Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SalonAdminLayout>
  );
}
