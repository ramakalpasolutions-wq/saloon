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
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.385, 78.4867]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // ✅ IMPROVED: Better geolocation with fallback
  const getCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      setLocationError('Location not supported on this device');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    
    // ✅ Try high accuracy first, fallback to low accuracy
    const tryGetLocation = (useHighAccuracy) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const newCenter = [latitude, longitude];
            
            setUserLocation(newCenter);
            setMapCenter(newCenter);
            setLocationError(null);
            
            console.log('✅ Location found:', newCenter);
            setLocationLoading(false);
          } catch (error) {
            console.error('❌ Position error:', error);
            setLocationLoading(false);
          }
        },
        (error) => {
          // ✅ If high accuracy fails, try low accuracy
          if (useHighAccuracy && error.code === 3) {
            console.log('⚠️ High accuracy timeout, trying low accuracy...');
            tryGetLocation(false);
            return;
          }
          
          setLocationLoading(false);
          
          let message = '';
          if (error.code === 1) {
            message = 'Location access denied. Please enable location permissions.';
            console.log('❌ User denied location permission');
          } else if (error.code === 2) {
            message = 'Location unavailable. Please check your device settings.';
            console.log('❌ Location information unavailable');
          } else if (error.code === 3) {
            message = 'Location timeout. Showing all salons.';
            console.log('⚠️ Location timeout - continuing without location');
          }
          
          setLocationError(message);
          console.log(`⚠️ Geolocation: ${message}`);
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: useHighAccuracy ? 8000 : 5000,
          maximumAge: 300000
        }
      );
    };
    
    tryGetLocation(true);
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch salons once on mount
  useEffect(() => {
    fetchSalons();
  }, []);

  // Auto-fetch location once on mount (with delay for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      getCurrentLocation();
    }, 1000); // ✅ Increased delay to let page fully load

    return () => clearTimeout(timer);
  }, []);

  // Sort by distance when location changes
  useEffect(() => {
    if (userLocation && salons.length > 0) {
      const sorted = salons.map(salon => {
        if (!salon.latitude || !salon.longitude) return { ...salon, distance: null };
        const distance = getDistance(
          userLocation[0], userLocation[1],
          salon.latitude, salon.longitude
        );
        return { ...salon, distance };
      }).sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });
      setFilteredSalons(sorted);
    }
  }, [userLocation]);

  // Filter by search term
  useEffect(() => {
    let filtered = salons;
    
    if (searchTerm) {
      filtered = salons.filter(salon =>
        salon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (userLocation && filtered.length > 0) {
      filtered = filtered.map(salon => {
        if (!salon.latitude || !salon.longitude) return { ...salon, distance: null };
        const distance = getDistance(
          userLocation[0], userLocation[1],
          salon.latitude, salon.longitude
        );
        return { ...salon, distance };
      }).sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });
    }
    
    setFilteredSalons(filtered);
  }, [searchTerm]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/salons/public');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API returned ${response.status}`);
      }

      if (data.success && data.salons) {
        const salonsWithWaitTime = data.salons.map(salon => ({
          ...salon,
          estimatedWaitTime: Math.floor(Math.random() * 45)
        }));
        
        setSalons(salonsWithWaitTime);
        setFilteredSalons(salonsWithWaitTime);
        
        if (salonsWithWaitTime.length > 0) {
          const firstSalon = salonsWithWaitTime.find(s => s.latitude && s.longitude);
          if (firstSalon) {
            setMapCenter([firstSalon.latitude, firstSalon.longitude]);
          }
        }
      } else {
        setError('No salons available');
        setSalons([]);
        setFilteredSalons([]);
      }
    } catch (error) {
      console.error('❌ Error fetching salons:', error);
      setError(error.message || 'Failed to load salons');
      setSalons([]);
      setFilteredSalons([]);
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 sm:pt-20 px-3">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Finding salons near you...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 sm:pt-20 px-3">
          <div className="text-center max-w-md mx-auto p-6 sm:p-8">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Unable to Load Salons</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchSalons}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-14 sm:pt-16 lg:pt-20 h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className={`w-full lg:w-80 xl:w-96 2xl:w-[28rem] bg-white shadow-lg overflow-y-auto ${showMap ? 'hidden lg:block' : 'block'}`}>
            <div className="p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search by city, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 border-2 border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                />
                <svg className="absolute right-3 top-2.5 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md sm:shadow-lg mb-3 text-sm sm:text-base"
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Finding...</span>
                  </>
                ) : userLocation ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>📍 Located!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Use My Location</span>
                  </>
                )}
              </button>

              {/* ✅ Location Error Message */}
              {locationError && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">{locationError}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs sm:text-sm font-semibold text-gray-700 flex-1">
                  {filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''}
                  {userLocation && filteredSalons[0]?.distance && (
                    <span className="text-blue-600 ml-2">
                      📍 {filteredSalons[0].distance.toFixed(1)}km
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="lg:hidden px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold"
                >
                  {showMap ? '📋 List' : '🗺️ Map'}
                </button>
              </div>
            </div>

            <div className="divide-y">
              {filteredSalons.length > 0 ? (
                filteredSalons.map((salon) => (
                  <div
                    key={salon._id}
                    id={`salon-${salon._id}`}
                    onClick={() => handleSalonClick(salon)}
                    className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-all ${
                      selectedSalon?._id === salon._id ? 'bg-green-50 border-l-4 border-green-600' : ''
                    }`}
                  >
                    {salon.logo?.url ? (
                      <img src={salon.logo.url} alt={salon.name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg mb-3 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
                        <span className="text-white font-bold text-base sm:text-lg">💈</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 flex-1 line-clamp-1">{salon.name}</h3>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(salon.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {salon.address?.fullAddress && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">📍 {salon.address.fullAddress}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {salon.distance && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          🏃 {salon.distance < 1 ? '<1km' : `${salon.distance.toFixed(1)}km`}
                        </span>
                      )}
                      
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        salon.estimatedWaitTime === 0 ? 'bg-green-100 text-green-800' :
                        salon.estimatedWaitTime <= 15 ? 'bg-green-100 text-green-800' :
                        salon.estimatedWaitTime <= 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {salon.estimatedWaitTime === 0 ? '📱 Walk-in' : `⏳ ${salon.estimatedWaitTime}'`}
                      </span>
                    </div>

                    {salon.phone && (
                      <p className="text-xs text-gray-500 mb-3">📞 {salon.phone}</p>
                    )}

                    <Link 
                      href={`/salon/${salon._id}`} 
                      className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-2 rounded-lg text-center font-semibold text-sm transition-all shadow-md"
                    >
                      Check In →
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No salons found</h3>
                  <button onClick={fetchSalons} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`flex-1 ${showMap ? 'block' : 'hidden'} lg:block`}>
            {filteredSalons.length > 0 ? (
              <MapView 
                key={`map-${userLocation ? userLocation.join('-') : 'default'}`}
                salons={filteredSalons} 
                center={mapCenter} 
                onMarkerClick={handleMarkerClick} 
                userLocation={userLocation} 
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                  <div className="text-3xl mb-4">🗺️</div>
                  <p className="text-gray-500">No salons to display</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
