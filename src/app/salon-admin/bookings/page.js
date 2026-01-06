'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.salonId) {
      fetchBookings();
    }
  }, [user, filter]);

  const fetchBookings = async () => {
    try {
      const url = filter === 'all' 
        ? `/api/bookings?salonId=${user.salonId}`
        : `/api/bookings?salonId=${user.salonId}&status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus, rejectionReason = '') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejectionReason }),
      });

      if (response.ok) {
        alert(`Booking ${newStatus} successfully`);
        fetchBookings();
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout requiredRole="salon-admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-600 mt-2">Manage and track customer bookings</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.customerName || 'Customer'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                      {booking.queuePosition && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Queue #{booking.queuePosition}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Contact:</span> {booking.customerPhone}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(booking.appointmentDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {booking.appointmentTime}
                      </div>
                      <div>
                        <span className="font-medium">Staff:</span> {booking.staffName}
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="font-medium text-sm text-gray-700">Services:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {booking.services?.map((service, index) => (
                          <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                            {service.name} - ₹{service.price} ({service.duration}min)
                          </span>
                        ))}
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 mb-2">₹{booking.totalAmount}</div>
                    <div className="text-sm text-gray-500">{booking.estimatedWaitTime} min</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) handleStatusChange(booking._id, 'rejected', reason);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking._id, 'in-progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Start Service
                    </button>
                  )}
                  {booking.status === 'in-progress' && (
                    <button
                      onClick={() => handleStatusChange(booking._id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
