'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function MyCheckInsPage() {
  const [phone, setPhone] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      console.log('🔍 Searching for phone:', phone);

      // ✅ Use POST method
      const response = await fetch('/api/queue/my-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Check-ins response:', data);

      if (data.success) {
        setCheckins(data.checkins || []);
      } else {
        setError(data.error || 'Failed to fetch check-ins');
        setCheckins([]);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError(`Failed to load check-ins: ${error.message}`);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-service': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'in-service': return '✂️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">My Check-ins</h1>
            <p className="text-gray-600 text-lg">Track all your salon appointments</p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9010561998"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-all ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </span>
                ) : (
                  'View My Check-ins'
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {searched && !loading && (
            <div>
              {checkins.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {checkins.length} Check-in{checkins.length !== 1 ? 's' : ''} Found
                  </h2>

                  {checkins.map((checkin) => (
                    <Link
                      key={checkin._id}
                      href={`/queue/${checkin._id}`}
                      className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {checkin.salon?.name || 'Unknown Salon'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            📍 {checkin.salon?.address}, {checkin.salon?.city}
                          </p>
                          <p className="text-gray-600 text-sm">
                            🕐 {new Date(checkin.checkedInAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 ${getStatusColor(checkin.status)}`}>
                            {getStatusIcon(checkin.status)}
                            {checkin.status.toUpperCase()}
                          </span>

                          {checkin.status === 'waiting' && (
                            <span className="text-lg font-bold text-green-600">
                              #{checkin.queueNumber || checkin.position}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Services */}
                      {checkin.services && checkin.services.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Services:</p>
                          <div className="flex flex-wrap gap-2">
                            {checkin.services.map((service) => (
                              <span
                                key={service._id}
                                className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                              >
                                {service.name} - ₹{service.price}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Details Link */}
                      <div className="mt-4 text-green-600 font-semibold flex items-center gap-2">
                        View Details
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <div className="text-5xl mb-4">😕</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No check-ins found for this phone number.</h3>
                  <p className="text-gray-600 mb-4">
                    Make sure you entered the correct phone number used during check-in.
                  </p>
                  <Link
                    href="/find-salon"
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Find a Salon
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
