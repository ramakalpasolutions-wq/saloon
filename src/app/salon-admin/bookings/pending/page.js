'use client';
import { useState, useEffect } from 'react';
import SalonAdminLayout from '@/components/SalonAdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function PendingBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.salonId) {
      fetchPendingBookings();
    }
  }, [user]);

  const fetchPendingBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?salonId=${user.salonId}&status=pending`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (response.ok) {
        alert('Booking confirmed successfully');
        fetchPendingBookings();
      } else {
        alert('Failed to confirm booking');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Error confirming booking');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
      });

      if (response.ok) {
        alert('Booking rejected');
        fetchPendingBookings();
      } else {
        alert('Failed to reject booking');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Error rejecting booking');
    }
  };

  return (
    <SalonAdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pending Bookings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Review and approve customer booking requests</p>
        </div>

        {/* Pending Count */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <p className="text-yellow-800 font-medium text-sm sm:text-base">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading pending bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">✅</div>
            <p className="text-gray-500 text-base sm:text-lg">No pending bookings to review</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-2 border-yellow-200">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">
                        {booking.customerName || 'New Customer'}
                      </h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium w-fit">
                        Pending Approval
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Customer Phone:</span>
                          <p className="text-gray-900 text-base sm:text-lg break-all">📞 {booking.customerPhone}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Appointment:</span>
                          <p className="text-gray-900">📅 {new Date(booking.appointmentDate).toLocaleDateString()}</p>
                          <p className="text-gray-900">🕐 {booking.appointmentTime}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Preferred Staff:</span>
                          <p className="text-gray-900">👨‍💼 {booking.staffName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Queue Position:</span>
                          <p className="text-gray-900">#{booking.queuePosition}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 sm:mb-4">
                      <span className="font-semibold text-gray-900 block mb-2 text-sm sm:text-base">Selected Services:</span>
                      <div className="space-y-2">
                        {booking.services?.map((service, index) => (
                          <div key={index} className="flex items-center justify-between bg-green-50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900 block truncate">{service.name}</span>
                              <span className="text-xs text-gray-600">({service.duration} min)</span>
                            </div>
                            <span className="font-semibold text-green-700 ml-2 flex-shrink-0">₹{service.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                        <span className="font-medium text-gray-700 text-xs sm:text-sm">Customer Notes:</span>
                        <p className="text-gray-600 mt-1 text-xs sm:text-sm break-words">{booking.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>⏱️ Estimated: {booking.estimatedWaitTime} min</span>
                      <span>📝 Booked: {new Date(booking.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-center lg:text-right lg:ml-6">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">₹{booking.totalAmount}</div>
                    <div className="text-xs sm:text-sm text-gray-500">Total Amount</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleConfirm(booking._id)}
                    className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    ✓ Confirm Booking
                  </button>
                  <button
                    onClick={() => handleReject(booking._id)}
                    className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SalonAdminLayout>
  );
}
