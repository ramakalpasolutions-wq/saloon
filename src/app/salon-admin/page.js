'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SalonAdminLayout from '@/components/SalonAdminLayout';

export default function SalonAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQueue: 0,
    averageWait: 0,
    todayCheckIns: 0,
    todayRevenue: 0,
    pendingApprovals: 0 // ✅ NEW
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/salon-admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SalonAdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-base sm:text-lg">Loading dashboard...</p>
          </div>
        </div>
      </SalonAdminLayout>
    );
  }

  return (
    <SalonAdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Welcome to your salon admin panel</p>
        </div>

        {/* ✅ PENDING APPROVALS ALERT */}
        {stats.pendingApprovals > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-yellow-900 mb-1">
                  {stats.pendingApprovals} Booking{stats.pendingApprovals !== 1 ? 's' : ''} Awaiting Approval
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You have pending booking requests that need your approval.
                </p>
                <button
                  onClick={() => router.push('/salon-admin/pending')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-sm transition-all"
                >
                  Review Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* ✅ NEW CARD - Pending Approvals */}
          <div 
            onClick={() => router.push('/salon-admin/pending')}
            className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border-2 border-yellow-200 hover:border-yellow-400 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
                  {stats.pendingApprovals}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Current Queue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalQueue}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Average Wait</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.averageWait}m</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.todayCheckIns}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* ✅ NEW - Pending Approvals Button */}
            <button
              onClick={() => router.push('/salon-admin/pending')}
              className="p-3 sm:p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg hover:border-yellow-500 hover:bg-yellow-100 transition-all text-center relative"
            >
              {stats.pendingApprovals > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {stats.pendingApprovals}
                </span>
              )}
              <div className="text-2xl sm:text-3xl mb-2">⏳</div>
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Pending</div>
            </button>

            <button
              onClick={() => router.push('/salon-admin/queue')}
              className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
            >
              <div className="text-2xl sm:text-3xl mb-2">👥</div>
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Queue</div>
            </button>

            <button
              onClick={() => router.push('/salon-admin/services')}
              className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
            >
              <div className="text-2xl sm:text-3xl mb-2">✂️</div>
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Services</div>
            </button>

            <button
              onClick={() => router.push('/salon-admin/staff')}
              className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
            >
              <div className="text-2xl sm:text-3xl mb-2">👨‍💼</div>
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Staff</div>
            </button>

            <button
              onClick={() => router.push('/salon-admin/profile')}
              className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
            >
              <div className="text-2xl sm:text-3xl mb-2">⚙️</div>
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Settings</div>
            </button>
          </div>
        </div>
      </div>
    </SalonAdminLayout>
  );
}
