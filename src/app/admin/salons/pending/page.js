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
      console.log('🔄 Fetching all salons for pending filter...');
      
      const response = await fetch('/api/admin/salons');
      const data = await response.json();
      
      console.log('📊 Total salons received:', data.salons?.length || 0);
      
      if (data.salons) {
        console.log('📋 All salon statuses:', data.salons.map(s => ({
          name: s.name,
          status: s.status,
          id: s._id
        })));
        
        const pending = data.salons.filter(salon => salon.status === 'pending');
        console.log('⏳ Pending salons found:', pending.length);
        
        if (pending.length > 0) {
          console.log('📝 Pending salons:', pending.map(s => s.name));
        }
        
        setSalons(pending);
      } else {
        console.log('⚠️ No salons in response');
        setSalons([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch salons:', error);
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
      console.log('🔄 Changing status:', { salonId, newStatus, salonName });
      
      const response = await fetch(`/api/salons/${salonId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('📡 Status change response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status change result:', result);
        toast.success(`Salon ${action}d successfully`);
        fetchPendingSalons();
      } else {
        const errorData = await response.json();
        console.error('❌ Status change failed:', errorData);
        toast.error(`Failed to ${action} salon`);
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing salon:`, error);
      toast.error(`Error ${action}ing salon`);
    }
  };

  if (loading) {
    return (
      <AdminLayout requiredRole="main-admin">
        <div className="flex flex-col items-center justify-center h-64 px-3">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
          <p className="ml-4 text-gray-600 text-sm sm:text-base mt-3">Loading pending salons...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pending Salon Approvals</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Review and approve new salon registrations</p>
        </div>

        {/* Pending Count Alert */}
        {salons.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <p className="text-yellow-800 font-medium text-sm sm:text-base">
              ⏳ {salons.length} salon{salons.length !== 1 ? 's' : ''} waiting for approval
            </p>
          </div>
        )}

        {/* Salons List */}
        {salons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">✅</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-sm sm:text-base text-gray-600">No pending salon approvals at the moment</p>
            <Link href="/admin/salons">
              <button className="mt-4 px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base">
                View All Salons
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {salons.map((salon) => (
              <div
                key={salon._id}
                className="bg-white rounded-lg shadow-sm border-2 border-yellow-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                  {/* Salon Logo */}
                  <div className="flex-shrink-0 mx-auto lg:mx-0">
                    {salon.logo?.url ? (
                      <img
                        src={salon.logo.url}
                        alt={salon.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl">🏪</span>
                      </div>
                    )}
                  </div>

                  {/* Salon Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 break-words">{salon.name}</h3>
                    
                    {salon.description && (
                      <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-2">{salon.description}</p>
                    )}

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Address:</span>
                        <p className="text-gray-600 break-words">
                          {salon.address?.street && `${salon.address.street}, `}
                          {salon.address?.city && `${salon.address.city}, `}
                          {salon.address?.state && `${salon.address.state} `}
                          {salon.address?.zipCode}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-gray-600">
                          <span className="break-all">📞 {salon.phone}</span>
                          <span className="break-all">📧 {salon.email}</span>
                        </div>
                      </div>

                      {salon.adminId && (
                        <div className="bg-blue-50 rounded-lg p-2 sm:p-3 mt-3 border border-blue-200">
                          <span className="font-semibold text-blue-900 text-xs sm:text-sm">Admin Details:</span>
                          <p className="text-blue-700 text-xs sm:text-sm break-all">
                            {salon.adminId.name} - {salon.adminId.email}
                            {salon.adminId.phone && ` - ${salon.adminId.phone}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:gap-3 lg:min-w-[200px]">
                    <Link href={`/admin/salons/${salon._id}`}>
                      <button className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base">
                        View Full Details
                      </button>
                    </Link>

                    <button
                      onClick={() => handleStatusChange(salon._id, 'approved', salon.name)}
                      className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      ✓ Approve Salon
                    </button>

                    <button
                      onClick={() => handleStatusChange(salon._id, 'rejected', salon.name)}
                      className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
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
