'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function FindSalonPage() {
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.385, 78.4867]); // Default: Hyderabad

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    // Filter salons based on search
    if (searchTerm) {
      const filtered = salons.filter(salon =>
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSalons(filtered);
    } else {
      setFilteredSalons(salons);
    }
  }, [searchTerm, salons]);

  const fetchSalons = async () => {
    try {
      const response = await fetch('/api/salons/public');
      const data = await response.json();

      console.log('📍 Fetched salons:', data);

      if (data.success && data.salons) {
        setSalons(data.salons);
        setFilteredSalons(data.salons);
        
        // Set map center to first salon with valid coordinates
        if (data.salons.length > 0) {
          const firstSalon = data.salons.find(s => s.latitude && s.longitude);
          if (firstSalon) {
            setMapCenter([firstSalon.latitude, firstSalon.longitude]);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (salon) => {
    setSelectedSalon(salon);
    const element = document.getElementById(`salon-${salon._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSalonClick = (salon) => {
    setSelectedSalon(salon);
    if (salon.latitude && salon.longitude) {
      setMapCenter([salon.latitude, salon.longitude]);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Finding salons near you...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Salon List */}
          <div className="w-96 bg-white shadow-lg overflow-y-auto">
            {/* Search Bar */}
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search by city, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg
                  className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="text-sm font-semibold text-gray-700">
                {filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {/* Salon List */}
            <div className="divide-y">
              {filteredSalons.length > 0 ? (
                filteredSalons.map((salon) => (
                  <div
                    key={salon._id}
                    id={`salon-${salon._id}`}
                    onClick={() => handleSalonClick(salon)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedSalon?._id === salon._id ? 'bg-green-50 border-l-4 border-green-600' : ''
                    }`}
                  >
                    {/* Logo */}
                    {salon.logo?.url && (
                      <img src={salon.logo.url} alt={salon.name} className="w-16 h-16 object-cover rounded-lg mb-3" />
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{salon.name}</h3>
                      <button className="text-gray-400 hover:text-red-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Address */}
                    {salon.address?.fullAddress && (
                      <p className="text-sm text-gray-600 mb-2">📍 {salon.address.fullAddress}</p>
                    )}

                    {/* Phone */}
                    {salon.phone && (
                      <p className="text-sm text-gray-600 mb-3">📞 {salon.phone}</p>
                    )}

                    {/* Rating */}
                    {salon.rating > 0 && (
                      <div className="text-sm text-yellow-600 mb-3">
                        ⭐ {salon.rating.toFixed(1)} ({salon.totalReviews} reviews)
                      </div>
                    )}

                    {/* Google Maps Link */}
                    {salon.googleMapsLink && (
                      <a
                        href={salon.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 mb-3 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🗺️ Open in Google Maps →
                      </a>
                    )}

                    {/* Check In Button */}
                    <Link href={`/salon/${salon._id}`}>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        Check In
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No salons found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Map */}
          <div className="flex-1 relative">
            {filteredSalons.length > 0 ? (
              <MapView
                salons={filteredSalons}
                center={mapCenter}
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500 text-lg">No salons to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
