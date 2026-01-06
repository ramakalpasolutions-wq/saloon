'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInData, setCheckInData] = useState({
    customerName: '',
    phoneNumber: '',
    services: [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSalon();
  }, [params.id]);

  const fetchSalon = async () => {
    try {
      const response = await fetch(`/api/salons/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setSalon(data.salon);
      }
    } catch (error) {
      console.error('Error fetching salon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/checkins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkInData,
          salonId: salon._id,
          salonName: salon.name,
          salonAddress: salon.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Check-in successful!');
        router.push(`/track-checkin/${data.checkin._id}`);
      } else {
        alert(data.error || 'Failed to check in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error creating check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    );
  }

  if (!salon) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Salon Not Found</h2>
            <Link href="/map">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                Browse All Salons
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/map">
            <button className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Salons
            </button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Salon Info */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{salon.name}</h1>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p className="text-gray-600">{salon.address}, {salon.city}</p>
                  </div>
                </div>

                {salon.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <p className="text-gray-600">{salon.phone}</p>
                    </div>
                  </div>
                )}

                {salon.services && salon.services.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Available Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {salon.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Check In Now</h2>

              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={checkInData.customerName}
                    onChange={(e) => setCheckInData({ ...checkInData, customerName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={checkInData.phoneNumber}
                    onChange={(e) => setCheckInData({ ...checkInData, phoneNumber: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Services (Optional)</label>
                  {salon.services && salon.services.map((service, idx) => (
                    <label key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        value={service}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckInData({
                              ...checkInData,
                              services: [...checkInData.services, service]
                            });
                          } else {
                            setCheckInData({
                              ...checkInData,
                              services: checkInData.services.filter(s => s !== service)
                            });
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:bg-gray-400 text-lg"
                >
                  {submitting ? 'Checking In...' : 'Complete Check-In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
