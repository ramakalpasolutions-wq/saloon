'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function AllSalonsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Filter state
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [salons, searchQuery, statusFilter]);

  const fetchSalons = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching salons...');

      // ✅ CHANGE THIS LINE - Use admin API instead
      const response = await fetch('/api/admin/salons');
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);

        if (response.status === 401) {
          toast.error('Unauthorized. Please login as main admin.');
        } else {
          toast.error(errorData.error || 'Failed to load salons');
        }
        setSalons([]);
        setFilteredSalons([]);
        return;
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      console.log('📊 Total salons:', data.total);

      if (data.salons && Array.isArray(data.salons)) {
        console.log('✅ Setting salons:', data.salons.length);
        // Log status of each salon
        data.salons.forEach(s => {
          console.log(`  - ${s.name}: ${s.status}`);
        });
        setSalons(data.salons);
      } else {
        console.log('⚠️ No salons array in response');
        setSalons([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch salons:', error);
      toast.error('Failed to load salons: ' + error.message);
      setSalons([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };


  const applyFilters = () => {
    let filtered = [...salons];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(salon => salon.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(salon =>
        salon.name?.toLowerCase().includes(query) ||
        salon.email?.toLowerCase().includes(query) ||
        salon.phone?.includes(query) ||
        salon.address?.city?.toLowerCase().includes(query) ||
        salon.address?.state?.toLowerCase().includes(query) ||
        salon.adminId?.name?.toLowerCase().includes(query) ||
        salon.adminId?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredSalons(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      suspended: 'Suspended',
    };
    return labels[status] || status;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return salons.length;
    return salons.filter(salon => salon.status === status).length;
  };

  const handleStatusChange = async (salonId, newStatus, salonName) => {
    const confirmed = await confirm({
      title: `Change Status to ${getStatusLabel(newStatus)}`,
      message: `Are you sure you want to change "${salonName}" status to ${getStatusLabel(newStatus)}?`,
      confirmText: 'Yes, Change',
      cancelText: 'Cancel',
      type: newStatus === 'rejected' || newStatus === 'suspended' ? 'danger' : 'warning',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/salons/${salonId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status changed to ${getStatusLabel(newStatus)}`);
        fetchSalons();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to change status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error changing status');
    }
  };

  const handleDelete = async (salonId, salonName) => {
    const confirmed = await confirm({
      title: 'Delete Salon',
      message: `Are you sure you want to delete "${salonName}"? This will also delete the admin account, staff, services, and all associated data. This action cannot be undone.`,
      confirmText: 'Yes, Delete Everything',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/salons/${salonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Salon and all associated data deleted successfully');
        fetchSalons();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete salon');
      }
    } catch (error) {
      console.error('Error deleting salon:', error);
      toast.error('Error deleting salon');
    }
  };

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Salons</h1>
            <p className="text-gray-600 mt-2">Manage and monitor all registered salons</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/salons/bulk-upload">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                <span className="text-xl">📤</span>
                Bulk Upload
              </button>
            </Link>
            <Link href="/admin/salons/new">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                <span className="text-xl">+</span>
                Add New Salon
              </button>
            </Link>
          </div>
        </div>

        {/* Search and View Mode */}
        <div className="bg-white rounded-lg text-black shadow-sm p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Search by name, email, phone, city, or admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'list'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'map'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                🗺️ Map
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'all'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All ({getStatusCount('all')})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'approved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
            >
              ✅ Approved ({getStatusCount('approved')})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
            >
              ⏳ Pending ({getStatusCount('pending')})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'suspended'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ⏸️ Suspended ({getStatusCount('suspended')})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
            >
              ❌ Rejected ({getStatusCount('rejected')})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900">{salons.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Salons</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">
              {salons.filter(s => s.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Approved</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-600">
              {salons.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">
              {salons.filter(s => s.status === 'rejected' || s.status === 'suspended').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Rejected/Suspended</div>
          </div>
        </div>

        {/* Salons List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading salons...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery
                ? `No salons found matching "${searchQuery}"`
                : statusFilter !== 'all'
                  ? `No ${statusFilter} salons found`
                  : 'No salons registered yet'}
            </p>
            <div className="flex gap-3 justify-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Search
                </button>
              )}
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Show All Salons
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredSalons.length} of {salons.length} salons
                {statusFilter !== 'all' && <span className="font-medium"> • Filtered by: {getStatusLabel(statusFilter)}</span>}
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredSalons.map((salon) => (
                <div
                  key={salon._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-6">
                    {/* Salon Logo */}
                    <div className="flex-shrink-0">
                      {salon.logo?.url ? (
                        <img
                          src={salon.logo.url}
                          alt={salon.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">🏪</span>
                        </div>
                      )}
                    </div>

                    {/* Salon Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                            {salon.name}
                          </h3>
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(salon.status)}`}>
                            {getStatusLabel(salon.status)}
                          </span>
                        </div>
                      </div>

                      {salon.description && (
                        <p className="text-gray-600 mb-3">{salon.description}</p>
                      )}

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium mb-1">📍 Address</p>
                          <p className="text-gray-700">
                            {salon.address?.street && `${salon.address.street}, `}
                            {salon.address?.city && `${salon.address.city}, `}
                            {salon.address?.state && `${salon.address.state} `}
                            {salon.address?.zipCode}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 font-medium mb-1">📞 Contact</p>
                          <p className="text-gray-700">{salon.phone}</p>
                          <p className="text-gray-700">{salon.email}</p>
                        </div>

                        {salon.adminId && (
                          <div>
                            <p className="text-gray-500 font-medium mb-1">👤 Admin</p>
                            <p className="text-gray-700">{salon.adminId.name}</p>
                            <p className="text-gray-700 text-xs">{salon.adminId.email}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-gray-500 font-medium mb-1">📊 Stats</p>
                          <p className="text-gray-700">
                            👥 {salon.staff?.length || 0} Staff •
                            ✂️ {salon.services?.length || 0} Services
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <Link href={`/admin/salons/${salon._id}`}>
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          View Details
                        </button>
                      </Link>

                      {/* Status Change Dropdown */}
                      <select
                        value={salon.status}
                        onChange={(e) => handleStatusChange(salon._id, e.target.value, salon.name)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-green-500"
                      >
                        <option value="approved">✅ Approved</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="suspended">⏸️ Suspended</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>

                      <button
                        onClick={() => handleDelete(salon._id, salon.name)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MAP VIEW */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Showing {filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''} on map
              </h3>
              <p className="text-sm text-gray-600">Click on any marker to view salon details</p>
            </div>

            <div className="h-[600px] rounded-lg overflow-hidden border-2 border-gray-200">
              <MapView
                salons={filteredSalons}
                center={[20.5937, 78.9629]}
                zoom={5}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
