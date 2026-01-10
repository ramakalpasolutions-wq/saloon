'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SalonAdminLayout from '@/components/SalonAdminLayout';
import { useToast } from '@/components/Toast';

export default function PendingApprovalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingBookings();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingBookings = async () => {
    try {
      // ✅ No need for salonId - API gets it from auth
      const response = await fetch('/api/queue/pending');
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error('Failed to load bookings: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (queueId) => {
    try {
      toast.info('Approving booking...');

      const response = await fetch('/api/queue/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Booking approved successfully!');
        fetchPendingBookings(); // Refresh list
      } else {
        toast.error('Failed to approve: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error approving booking');
    }
  };

  const handleReject = async (queueId) => {
    const reason = prompt('Rejection reason (optional):');
    
    if (reason === null) return; // User cancelled
    
    try {
      toast.info('Rejecting booking...');

      const response = await fetch('/api/queue/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId,
          action: 'reject',
          rejectionReason: reason || 'No slots available',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.warning('Booking rejected');
        fetchPendingBookings(); // Refresh list
      } else {
        toast.error('Failed to reject: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error rejecting booking');
    }
  };

  if (loading) {
    return (
      <SalonAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending bookings...</p>
          </div>
        </div>
      </SalonAdminLayout>
    );
  }

  return (
    <SalonAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Pending Approvals ({bookings.length})
            </h1>
            <p className="text-gray-600 mt-1">Review and approve/reject booking requests</p>
          </div>
          <button
            onClick={fetchPendingBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
            <p className="text-gray-600">No pending bookings to approve</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                  <div className="flex-1 w-full">
                    {/* Customer Info */}
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {booking.customerName}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">📞 {booking.customerPhone}</p>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Date & Time</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">
                          📅 {new Date(booking.appointmentDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="font-semibold text-sm sm:text-base text-blue-600">
                          🕐 {booking.appointmentTime}
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Payment</p>
                        <p className="font-bold text-green-600 text-base sm:text-lg">
                          ₹{booking.amount}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Services */}
                    {booking.services && booking.services.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.services.map((service) => (
                            <span
                              key={service._id}
                              className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm"
                            >
                              ✂️ {service.name} - ₹{service.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staff */}
                    {booking.staff && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">
                        👨‍💼 Staff: <span className="font-semibold">{booking.staff.name}</span>
                      </p>
                    )}

                    {/* Booking Time */}
                    <p className="text-xs text-gray-500">
                      Booked: {new Date(booking.checkInTime).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => handleApprove(booking._id)}
                      className="flex-1 lg:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md text-sm sm:text-base whitespace-nowrap"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking._id)}
                      className="flex-1 lg:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md text-sm sm:text-base whitespace-nowrap"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SalonAdminLayout>
  );
}
