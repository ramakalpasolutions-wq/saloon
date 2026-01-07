'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export default function MainAdminDashboard() {
  const [stats, setStats] = useState({
    totalSalons: 0,
    pendingSalons: 0,
    activeSalons: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // ✅ CHANGE THIS LINE - Use admin API
      const salonsRes = await fetch('/api/admin/salons');
      const salonsData = await salonsRes.json();

      console.log('📊 Dashboard - Fetching stats');
      console.log('📊 Total salons:', salonsData.salons?.length || 0);

      const totalSalons = salonsData.salons?.length || 0;
      const pendingSalons = salonsData.salons?.filter(s => s.status === 'pending').length || 0;
      const activeSalons = salonsData.salons?.filter(s => s.status === 'approved').length || 0;

      // Fetch bookings stats
      const bookingsRes = await fetch('/api/bookings');
      const bookingsData = await bookingsRes.json();
      const totalBookings = bookingsData.bookings?.length || 0;

      setStats({
        totalSalons,
        pendingSalons,
        activeSalons,
        totalBookings,
      });

      console.log('✅ Dashboard stats updated:', {
        totalSalons,
        pendingSalons,
        activeSalons,
        totalBookings
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };


  const statCards = [
    {
      title: 'Total Salons',
      value: stats.totalSalons,
      icon: '🏪',
      color: 'blue',
      link: '/admin/salons',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingSalons,
      icon: '⏳',
      color: 'yellow',
      link: '/admin/salons/pending',
    },
    {
      title: 'Active Salons',
      value: stats.activeSalons,
      icon: '✅',
      color: 'green',
      link: '/admin/salons',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: '📅',
      color: 'purple',
      link: '/admin/bookings',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Main Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage all salons and system settings</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <Link href={stat.link} key={stat.title}>
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-4xl p-3 rounded-lg ${colorClasses[stat.color]}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/salons/new">
              <button className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <span className="text-xl">➕</span>
                <span className="font-medium">Add New Salon</span>
              </button>
            </Link>
            <Link href="/admin/salons/pending">
              <button className="w-full px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2">
                <span className="text-xl">⏳</span>
                <span className="font-medium">Review Pending</span>
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <span className="text-xl">👥</span>
                <span className="font-medium">Manage Users</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
