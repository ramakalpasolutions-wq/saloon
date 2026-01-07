'use client';
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import L from 'leaflet';
import Link from 'next/link';

// Fix Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Dynamic imports
const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });

export default function MapView({ salons = [], center = [17.385, 78.4867], onMarkerClick, userLocation }) {
  // 🎨 Wait time color-coded markers
  const getWaitTimeIcon = (salon) => {
    const waitMinutes = salon.estimatedWaitTime || 0;
    let color, emoji, label;
    
    if (waitMinutes === 0) {
      color = '#10b981';
      emoji = '📱';
      label = '';
    } else if (waitMinutes <= 15) {
      color = '#10b981';
      emoji = waitMinutes;
      label = '';
    } else if (waitMinutes <= 30) {
      color = '#f59e0b';
      emoji = waitMinutes;
      label = '';
    } else {
      color = '#ef4444';
      emoji = waitMinutes;
      label = '';
    }
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: ${waitMinutes === 0 ? '18px' : '13px'}; 
          font-weight: bold; 
          color: white;
          cursor: pointer; 
          transition: transform 0.2s;
          font-family: system-ui;
        " onmouseover="this.style.transform='scale(1.15)'"
           onmouseout="this.style.transform='scale(1)'">
          ${waitMinutes === 0 ? emoji : emoji + "'"}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44]
    });
  };

  const validSalons = salons.filter(salon => 
    salon.latitude && salon.longitude &&
    typeof salon.latitude === 'number' &&
    typeof salon.longitude === 'number'
  );

  const handleMarkerClick = useCallback((salon) => {
    if (onMarkerClick) onMarkerClick(salon);
  }, [onMarkerClick]);

  if (!MapContainer || !TileLayer) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-lg text-gray-600 animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {/* User Location */}
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>
            <div className="text-center p-2">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-bold text-lg text-blue-600">You are here</div>
              <p className="text-sm text-gray-600 mt-1">Click nearby salons for details</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Salon Markers */}
      {validSalons.map((salon) => (
        <Marker
          key={salon._id}
          position={[salon.latitude, salon.longitude]}
          icon={getWaitTimeIcon(salon)}
          eventHandlers={{
            click: () => handleMarkerClick(salon),
          }}
        >
          <Popup maxWidth={350} className="salon-popup">
            <div className="p-4 min-w-[320px]">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {salon.logo?.url ? (
                  <img 
                    src={salon.logo.url} 
                    alt={salon.name} 
                    className="w-16 h-16 rounded-xl object-cover shadow-lg flex-shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white font-bold text-2xl">💈</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight">{salon.name}</h3>
                  
                  {/* Wait Time Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                    salon.estimatedWaitTime === 0 ? 'bg-green-500 text-white' :
                    salon.estimatedWaitTime <= 15 ? 'bg-green-400 text-white' :
                    salon.estimatedWaitTime <= 30 ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {salon.estimatedWaitTime === 0 ? '📱 Walk-in Ready' : `⏳ ${salon.estimatedWaitTime} min wait`}
                  </div>
                </div>
              </div>

              {/* Address */}
              {salon.address?.fullAddress && (
                <div className="bg-gray-50 p-3 rounded-xl mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">📍</span>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{salon.address.fullAddress}</p>
                  </div>
                </div>
              )}

              {/* Rating */}
              {salon.rating > 0 && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-yellow-50 rounded-xl">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < Math.floor(salon.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {salon.rating.toFixed(1)} ({salon.totalReviews || 0} reviews)
                  </span>
                </div>
              )}

              {/* Phone */}
              {salon.phone && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 mb-0.5">Call Now</p>
                    <a href={`tel:${salon.phone}`} className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                      {salon.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Distance */}
              {salon.distance && (
                <div className="bg-blue-50 px-3 py-2 rounded-xl mb-4 text-center">
                  <span className="text-sm font-semibold text-blue-800">
                    🏃 {salon.distance < 1 ? 'Less than 1km away' : `${salon.distance.toFixed(1)}km away`}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {salon.googleMapsLink && (
                  <a 
                    href={salon.googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl text-center font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    🗺️ Directions
                  </a>
                )}
                <Link 
                  href={`/salon/${salon._id}`}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl text-center font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  Check In →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
