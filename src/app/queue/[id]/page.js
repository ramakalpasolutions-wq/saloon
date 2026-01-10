'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function QueueStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [queueEntry, setQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchQueueStatus();
      const interval = setInterval(fetchQueueStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`/api/queue/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setQueueEntry(data.queueEntry);
      } else {
        setError(data.error || 'Queue entry not found');
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
      setError('Failed to load queue status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 sm:pt-20 px-3">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Loading queue status...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !queueEntry) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 sm:pt-20 px-3">
          <div className="text-center max-w-md mx-auto p-6 sm:p-8">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Queue Entry Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
            <Link href="/find-salon" className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold inline-block text-sm sm:text-base">
              Find Another Salon
            </Link>
          </div>
        </div>
      </>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'in-progress': return '✂️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'no-show': return '😕';
      default: return '📋';
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-2xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            {/* Status Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{getStatusIcon(queueEntry.status)}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Queue Status</h1>
              <span className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold border-2 text-sm sm:text-base ${getStatusColor(queueEntry.status)}`}>
                {queueEntry.status.toUpperCase()}
              </span>
            </div>

            {/* Queue Position Card - Only for waiting */}
            {queueEntry.status === 'waiting' && (
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg sm:rounded-xl p-6 sm:p-8 text-white text-center mb-4 sm:mb-6">
                <p className="text-base sm:text-lg mb-2">Your Position</p>
                <p className="text-5xl sm:text-6xl font-bold mb-2">#{queueEntry.queueNumber || queueEntry.position}</p>
                <p className="text-base sm:text-lg">
                  Wait: <span className="font-bold">{queueEntry.estimatedWaitTime} min</span>
                </p>
              </div>
            )}

            {/* Info Cards */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {/* Salon Info */}
              {queueEntry.salon && (
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                  <span className="text-xl sm:text-2xl flex-shrink-0">💈</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Salon</p>
                    <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{queueEntry.salon.name}</p>
                    {queueEntry.salon.address && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">📍 {queueEntry.salon.address}, {queueEntry.salon.city}</p>
                    )}
                    {queueEntry.salon.phone && (
                      <p className="text-xs sm:text-sm text-gray-600">📞 {queueEntry.salon.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Name */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <span className="text-xl sm:text-2xl">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Customer Name</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900 truncate">{queueEntry.customerName}</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <span className="text-xl sm:text-2xl">📞</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Phone Number</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900">{queueEntry.customerPhone}</p>
                </div>
              </div>

              {/* Staff Display */}
              {queueEntry.staff && (
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="text-xl sm:text-2xl flex-shrink-0">👨‍💼</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Assigned Staff</p>
                    <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{queueEntry.staff.name}</p>
                    {queueEntry.staff.specialization && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">🎯 {queueEntry.staff.specialization}</p>
                    )}
                    {queueEntry.staff.experience && (
                      <p className="text-xs text-gray-500">⭐ {queueEntry.staff.experience} years exp</p>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment Date & Time */}
              {queueEntry.appointmentDate && queueEntry.appointmentTime && (
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-xl sm:text-2xl flex-shrink-0">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Appointment</p>
                    <p className="font-bold text-sm sm:text-base text-gray-900">
                      {new Date(queueEntry.appointmentDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="font-bold text-green-600 text-base sm:text-lg">
                      🕐 {queueEntry.appointmentTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Check-in Time */}
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <span className="text-xl sm:text-2xl flex-shrink-0">🕐</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Checked In At</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900">
                    {new Date(queueEntry.checkInTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            {queueEntry.services && queueEntry.services.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">✂️</span>
                  Selected Services
                </h3>
                <div className="space-y-2">
                  {queueEntry.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base text-gray-900 block truncate">
                          {service.name || `Service ${index + 1}`}
                        </span>
                        {service.duration && (
                          <span className="text-xs sm:text-sm text-gray-600">⏱️ {service.duration} min</span>
                        )}
                      </div>
                      {service.price && (
                        <span className="font-bold text-sm sm:text-base text-green-600 flex-shrink-0">₹{service.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            {queueEntry.amount > 0 && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-gray-900 text-xl sm:text-2xl">₹{queueEntry.amount}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm ${
                      queueEntry.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {queueEntry.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {queueEntry.status === 'waiting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-blue-800">
                  <span className="font-semibold">Auto-refreshing</span> - Updates every 30 seconds
                </p>
              </div>
            )}

            {queueEntry.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-green-800 font-semibold mb-1 text-sm sm:text-base">🎉 Service Completed!</p>
                <p className="text-xs sm:text-sm text-gray-600">Thank you for visiting. We hope to see you again!</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 sm:space-y-3">
            <button
              onClick={fetchQueueStatus}
              className="w-full py-2.5 sm:py-3 bg-white text-gray-700 rounded-lg sm:rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              🔄 Refresh Status
            </button>

            <Link
              href={`/my-checkins?phone=${encodeURIComponent(queueEntry.customerPhone)}`}
              className="block w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold text-center hover:bg-blue-700 transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              📋 View All My Check-ins
            </Link>

            <Link
              href="/find-salon"
              className="block w-full py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl font-semibold text-center hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              🔍 Find Another Salon
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
