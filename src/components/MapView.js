'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView({ salons, center, zoom = 12, onMarkerClick }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {salons.map((salon) => {
        // Check if salon has valid coordinates
        if (salon.latitude && salon.longitude) {
          return (
            <Marker
              key={salon._id}
              position={[salon.latitude, salon.longitude]}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(salon),
              }}
            >
              <Popup>
                <div className="text-center min-w-[200px]">
                  {salon.logo?.url && (
                    <img src={salon.logo.url} alt={salon.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  )}
                  <h3 className="font-bold text-lg mb-1">{salon.name}</h3>
                  {salon.address?.fullAddress && (
                    <p className="text-sm text-gray-600 mb-2">{salon.address.fullAddress}</p>
                  )}
                  {salon.phone && (
                    <p className="text-sm text-gray-600 mb-3">📞 {salon.phone}</p>
                  )}
                  <button
                    onClick={() => window.location.href = `/salon/${salon._id}`}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                  >
                    Check In
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
}
