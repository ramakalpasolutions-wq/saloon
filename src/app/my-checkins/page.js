'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function MyCheckinsPage() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // ✅ AUTO-LOAD: Check if phone is in URL parameters
  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');
    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
      // Automatically search
      searchCheckins(phoneFromUrl);
    }
  }, [searchParams]);

  // ✅ SEPARATED SEARCH FUNCTION
  const searchCheckins = async (phoneNumber) => {
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      console.log('🔍 Searching for phone:', phoneNumber);
      
      const response = await fetch('/api/queue/my-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
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

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    searchCheckins(phone);
  };

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
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 My Check-ins</h1>
            <p className="text-gray-600">Track all your salon appointments</p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className={`w-full py-3 rounded-xl font-semibold text-white text-lg shadow-lg transition-all ${
                  loading || !phone.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </span>
                ) : (
                  '🔍 View My Check-ins'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your check-ins...</p>
            </div>
          )}

          {!loading && searched && checkins.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Check-ins Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any check-ins for <span className="font-semibold">{phone}</span>
              </p>
              <Link
                href="/find-salon"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Find a Salon to Check In
              </Link>
            </div>
          )}

          {!loading && checkins.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Check-ins ({checkins.length})
                </h2>
                <span className="text-sm text-gray-600">
                  Phone: <span className="font-semibold">{phone}</span>
                </span>
              </div>

              {checkins.map((checkin) => (
                <div
                  key={checkin._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-l-4 border-green-600"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {checkin.salon?.name || 'Salon'}
                      </h3>
                      {checkin.salon?.address && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {checkin.salon.address}, {checkin.salon.city}
                        </p>
                      )}
                    </div>
                    <span className={`px-4 py-2 rounded-full font-semibold text-sm border-2 ${getStatusColor(checkin.status)}`}>
                      {getStatusIcon(checkin.status)} {checkin.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="text-xs text-gray-600">Appointment</p>
                        <p className="font-semibold text-gray-900">
                          {checkin.appointmentDate && checkin.appointmentTime
                            ? `${new Date(checkin.appointmentDate).toLocaleDateString('en-IN')} at ${checkin.appointmentTime}`
                            : new Date(checkin.checkedInAt || checkin.checkInTime).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl">#️⃣</span>
                      <div>
                        <p className="text-xs text-gray-600">Queue Position</p>
                        <p className="font-semibold text-gray-900">#{checkin.position || checkin.queueNumber}</p>
                      </div>
                    </div>
                  </div>

                  {checkin.services && checkin.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {checkin.services.map((service, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            ✂️ {service.name} {service.price && `- ₹${service.price}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/queue/${checkin._id}`}
                    className="block w-full py-2 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg text-center font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8">
            <Link
              href="/find-salon"
              className="block w-full py-3 bg-white text-gray-700 rounded-xl font-semibold text-center border-2 border-gray-200 hover:bg-gray-50 transition-all"
            >
              ← Back to Find Salon
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
