'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/admin/settings?t=${Date.now()}`);
      const data = await response.json();
      
      console.log('Header - Fetched settings:', data); // Debug
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const siteName = settings?.siteName || 'Green Saloon';
  const logoUrl = settings?.logo?.url;

  console.log('Header - Logo URL:', logoUrl); // Debug
  console.log('Header - Site Name:', siteName); // Debug

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 w-28 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            {/* Show logo if exists - with cache busting */}
            {logoUrl && (
              <img 
                src={`${logoUrl}?t=${Date.now()}`}
                alt={siteName} 
                className="h-10 w-auto object-contain" 
                onError={(e) => {
                  console.error('Image failed to load:', logoUrl);
                  e.target.style.display = 'none';
                }}
              />
            )}
            {/* Always show site name */}
            <h1 className="text-2xl font-bold text-black">
              {siteName}
            </h1>
          </div>
        </Link>
        <nav className="flex gap-3">
          <Link href="/my-checkins">
            <button className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              My Check-ins
            </button>
          </Link>
          
          {/* ✅ UPDATED: Changed href="/map" to href="/find-salon" */}
          <Link href="/find-salon">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find a Salon
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
