'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function MyCheckinsPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkins, setCheckins] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/checkins/by-phone?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins);
        if (data.checkins.length === 0) {
          setError('No check-ins found for this phone number.');
        }
      } else {
        setError(data.error || 'Failed to fetch check-ins');
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      setError('Error fetching check-ins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">My Check-ins</h1>
            <p className="text-lg text-gray-600">Track all your salon appointments</p>
          </div>

          {/* Phone Number Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Your Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'View My Check-ins'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Check-ins List */}
          {checkins && checkins.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Check-ins ({checkins.length})
              </h2>

              {checkins.map((checkin) => (
                <div key={checkin._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{checkin.salonName}</h3>
                      <p className="text-gray-600">{checkin.salonAddress}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(checkin.status)}`}>
                      {checkin.status.charAt(0).toUpperCase() + checkin.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-semibold text-gray-900">{checkin.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold text-gray-900">{checkin.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-in Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(checkin.checkinDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-in Time</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(checkin.checkinDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {checkin.services && checkin.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {checkin.services.map((service, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkin.waitingPosition && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 font-semibold">
                        🔢 Position in Queue: {checkin.waitingPosition}
                      </p>
                      <p className="text-blue-600 text-sm mt-1">
                        Estimated wait time: {checkin.estimatedWaitTime || '15-20'} minutes
                      </p>
                    </div>
                  )}

                  <Link href={`/track-checkin/${checkin._id}`}>
                    <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      Track This Check-in →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
