'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function TrackCheckinPage() {
  const params = useParams();
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckin();
    const interval = setInterval(fetchCheckin, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [params.id]);

  const fetchCheckin = async () => {
    try {
      const response = await fetch(`/api/checkins/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setCheckin(data.checkin);
      }
    } catch (error) {
      console.error('Error fetching check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    );
  }

  if (!checkin) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check-in Not Found</h2>
            <Link href="/my-checkins">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                View All Check-ins
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'in-progress':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStatusStep(checkin.status);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/my-checkins">
            <button className="mb-6 text-green-600 hover:text-green-700 font-semibold">
              ← Back to All Check-ins
            </button>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Appointment</h1>
            <p className="text-gray-600 mb-8">{checkin.salonName}</p>

            {/* Status Timeline */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 h-1 bg-gray-200 top-6"></div>
                <div
                  className="absolute left-0 h-1 bg-green-600 top-6 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>

                {['Pending', 'In Progress', 'Completed'].map((step, index) => (
                  <div key={index} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                        currentStep > index
                          ? 'bg-green-600 text-white'
                          : currentStep === index + 1
                          ? 'bg-green-600 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > index ? '✓' : index + 1}
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${currentStep >= index + 1 ? 'text-green-600' : 'text-gray-500'}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Check-in Details */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                  <p className="text-lg font-bold text-gray-900">{checkin.customerName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="text-lg font-bold text-gray-900">{checkin.phoneNumber}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Check-in Date & Time</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(checkin.checkinDate).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Queue Position</p>
                  <p className="text-lg font-bold text-gray-900">#{checkin.waitingPosition || 'N/A'}</p>
                </div>
              </div>

              {checkin.services && checkin.services.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Services Booked</p>
                  <div className="flex flex-wrap gap-2">
                    {checkin.services.map((service, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {checkin.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Service Completed!</h3>
                  <p className="text-green-700">Thank you for visiting {checkin.salonName}</p>
                </div>
              )}

              {checkin.status !== 'completed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-blue-800 font-semibold mb-2">📍 Current Status: {checkin.status}</p>
                  <p className="text-blue-600">Your appointment is being processed. We'll update you shortly!</p>
                  {checkin.estimatedWaitTime && (
                    <p className="text-blue-600 mt-2">⏱️ Estimated wait time: {checkin.estimatedWaitTime} minutes</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
