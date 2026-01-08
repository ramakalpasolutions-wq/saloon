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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading queue status...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !queueEntry) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Queue Entry Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/find-salon" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold inline-block">
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{getStatusIcon(queueEntry.status)}</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Status</h1>
              <span className={`inline-block px-4 py-2 rounded-full font-semibold border-2 ${getStatusColor(queueEntry.status)}`}>
                {queueEntry.status.toUpperCase()}
              </span>
            </div>

            {queueEntry.status === 'waiting' && (
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white text-center mb-6">
                <p className="text-lg mb-2">Your Position</p>
                <p className="text-6xl font-bold mb-2">#{queueEntry.queueNumber || queueEntry.position}</p>
                <p className="text-lg">Estimated Wait: <span className="font-bold">{queueEntry.estimatedWaitTime} minutes</span></p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Salon Info */}
              {queueEntry.salon && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                  <span className="text-2xl">💈</span>
                  <div>
                    <p className="text-sm text-gray-600">Salon</p>
                    <p className="font-bold text-gray-900 text-lg">{queueEntry.salon.name}</p>
                    {queueEntry.salon.address && (
                      <p className="text-sm text-gray-600">📍 {queueEntry.salon.address}, {queueEntry.salon.city}</p>
                    )}
                    {queueEntry.salon.phone && (
                      <p className="text-sm text-gray-600">📞 {queueEntry.salon.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-bold text-gray-900">{queueEntry.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-bold text-gray-900">{queueEntry.customerPhone}</p>
                </div>
              </div>

              {/* ✅ STAFF DISPLAY */}
              {queueEntry.staff && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="text-2xl">👨‍💼</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Assigned Staff</p>
                    <p className="font-bold text-gray-900 text-lg">{queueEntry.staff.name}</p>
                    {queueEntry.staff.specialization && (
                      <p className="text-sm text-gray-600">🎯 {queueEntry.staff.specialization}</p>
                    )}
                    {queueEntry.staff.experience && (
                      <p className="text-xs text-gray-500">⭐ {queueEntry.staff.experience} years experience</p>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment Date & Time */}
              {queueEntry.appointmentDate && queueEntry.appointmentTime && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-sm text-gray-600">Appointment</p>
                    <p className="font-bold text-gray-900">
                      {new Date(queueEntry.appointmentDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="font-bold text-green-600 text-lg">
                      🕐 {queueEntry.appointmentTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Check-in Time */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="text-sm text-gray-600">Checked In At</p>
                  <p className="font-bold text-gray-900">
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
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✂️</span>
                  Selected Services
                </h3>
                <div className="space-y-2">
                  {queueEntry.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <span className="font-medium text-gray-900">{service.name || `Service ${index + 1}`}</span>
                        {service.duration && (
                          <span className="text-sm text-gray-600 ml-2">⏱️ {service.duration} min</span>
                        )}
                      </div>
                      {service.price && (
                        <span className="font-bold text-green-600">₹{service.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            {queueEntry.amount > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-gray-900 text-2xl">₹{queueEntry.amount}</p>
                  </div>
                  <div>
                    <span className={`px-4 py-2 rounded-full font-semibold text-sm ${queueEntry.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {queueEntry.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-refresh notice */}
            {queueEntry.status === 'waiting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Auto-refreshing</span> - Your status will update automatically every 30 seconds
                </p>
              </div>
            )}

            {/* Completion message */}
            {queueEntry.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-semibold mb-2">🎉 Service Completed!</p>
                <p className="text-sm text-gray-600">Thank you for visiting. We hope to see you again!</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={fetchQueueStatus}
              className="w-full py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              🔄 Refresh Status
            </button>

            {/* ✅ UPDATED: Pass phone number */}
            <Link
              href={`/my-checkins?phone=${encodeURIComponent(queueEntry.customerPhone)}`}
              className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              📋 View All My Check-ins
            </Link>

            <Link
              href="/find-salon"
              className="block w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-center hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
            >
              🔍 Find Another Salon
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
