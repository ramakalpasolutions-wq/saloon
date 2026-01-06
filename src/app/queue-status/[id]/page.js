'use client';
import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function QueueStatus({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const phone = searchParams.get('phone');
  const [position, setPosition] = useState(3);
  const [estimatedTime, setEstimatedTime] = useState('15 min');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => Math.max(1, prev - 1));
      setEstimatedTime(prev => {
        const mins = parseInt(prev) - 5;
        return mins > 0 ? `${mins} min` : '0 min';
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="h-10 w-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check-In Successful!
          </h1>
          <p className="text-gray-600">
            You're in the queue at Green Salon & Spa
          </p>
        </div>

        {/* Queue Position Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Your Position</div>
            <div className="text-6xl font-bold text-blue-600 mb-4">#{position}</div>
            <div className="text-sm text-gray-600 mb-6">in the queue</div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Estimated Wait Time</div>
              <div className="text-2xl font-bold text-gray-900">{estimatedTime}</div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SMS Updates</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We'll send updates to {phone}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Be Ready</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please arrive 5 minutes before your turn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mb-3"
        >
          Back to Home
        </button>
        
        <button
          className="w-full py-3 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-semibold rounded-lg transition-colors"
        >
          Cancel Check-In
        </button>
      </div>
    </main>
  );
}
