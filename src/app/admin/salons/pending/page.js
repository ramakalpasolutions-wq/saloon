'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

export default function PendingSalonsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSalons();
  }, []);

  const fetchPendingSalons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/salons');
      const data = await response.json();
      
      if (data.salons) {
        // Filter only pending salons
        const pending = data.salons.filter(salon => salon.status === 'pending');
        setSalons(pending);
      }
    } catch (error) {
      console.error('Failed to fetch salons:', error);
      toast.error('Failed to load pending salons');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (salonId, newStatus, salonName) => {
    const action = newStatus === 'approved' ? 'approve' : 'reject';
    
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Salon`,
      message: `Are you sure you want to ${action} "${salonName}"?`,
      confirmText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelText: 'Cancel',
      type: newStatus === 'approved' ? 'warning' : 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/salons/${salonId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Salon ${action}d successfully`);
        fetchPendingSalons(); // Refresh list
      } else {
        toast.error(`Failed to ${action} salon`);
      }
    } catch (error) {
      console.error(`Error ${action}ing salon:`, error);
      toast.error(`Error ${action}ing salon`);
    }
  };

  if (loading) {
    return (
      <AdminLayout requiredRole="main-admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Salon Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve new salon registrations</p>
        </div>

        {/* Pending Count Alert */}
        {salons.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              ⏳ {salons.length} salon{salons.length !== 1 ? 's' : ''} waiting for approval
            </p>
          </div>
        )}

        {/* Salons List */}
        {salons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending salon approvals at the moment</p>
            <Link href="/admin/salons">
              <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                View All Salons
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {salons.map((salon) => (
              <div
                key={salon._id}
                className="bg-white rounded-lg shadow-sm border-2 border-yellow-200 p-6 hover:shadow-md transition-shadow"
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
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">{salon.name}</h3>
                    
                    {salon.description && (
                      <p className="text-gray-600 mb-3">{salon.description}</p>
                    )}

                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-gray-700">Address:</span>
                        <p className="text-gray-600">
                          {salon.address?.street && `${salon.address.street}, `}
                          {salon.address?.city && `${salon.address.city}, `}
                          {salon.address?.state && `${salon.address.state} `}
                          {salon.address?.zipCode}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <div className="flex items-center gap-4 text-gray-600">
                          <span>📞 {salon.phone}</span>
                          <span>📧 {salon.email}</span>
                        </div>
                      </div>

                      {salon.adminId && (
                        <div className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
                          <span className="font-semibold text-blue-900">Admin Details:</span>
                          <p className="text-blue-700 text-sm">
                            {salon.adminId.name} - {salon.adminId.email}
                            {salon.adminId.phone && ` - ${salon.adminId.phone}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <Link href={`/admin/salons/${salon._id}`}>
                      <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        View Full Details
                      </button>
                    </Link>

                    <button
                      onClick={() => handleStatusChange(salon._id, 'approved', salon.name)}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      ✓ Approve Salon
                    </button>

                    <button
                      onClick={() => handleStatusChange(salon._id, 'rejected', salon.name)}
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
