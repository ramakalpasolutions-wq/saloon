'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function PendingBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchPendingBookings();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingBookings = async () => {
    try {
      // Replace with your salon ID logic
      const salonId = localStorage.getItem('salonId');
      const response = await fetch(`/api/queue/pending?salonId=${salonId}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
      toast.error('Error approving booking');
    }
  };

  const handleReject = async (queueId) => {
    const reason = prompt('Rejection reason (optional):');
    
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
      toast.error('Error rejecting booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Pending Bookings ({bookings.length})
          </h1>
          <button
            onClick={fetchPendingBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {/* Customer Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {booking.customerName}
                      </h3>
                      <p className="text-gray-600">📞 {booking.customerPhone}</p>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-semibold text-gray-900">
                          📅 {new Date(booking.appointmentDate).toLocaleDateString()}
                        </p>
                        <p className="font-semibold text-blue-600">
                          🕐 {booking.appointmentTime}
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Payment</p>
                        <p className="font-bold text-green-600 text-lg">
                          ₹{booking.amount}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.services?.map((service) => (
                          <span
                            key={service._id}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                          >
                            ✂️ {service.name} - ₹{service.price}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Staff */}
                    {booking.staff && (
                      <p className="text-sm text-gray-600">
                        👨‍💼 Staff: <span className="font-semibold">{booking.staff.name}</span>
                      </p>
                    )}

                    {/* Booking Time */}
                    <p className="text-xs text-gray-500 mt-2">
                      Booked: {new Date(booking.checkInTime).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(booking._id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking._id)}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md"
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
    </div>
  );
}
