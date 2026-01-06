'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SalonAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    todayBookings: 0,
    totalStaff: 0,
    totalServices: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.salonId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch salon details
      const salonRes = await fetch(`/api/salons/${user.salonId}`);
      const salonData = await salonRes.json();
      setSalon(salonData.salon);

      // Fetch bookings
      const bookingsRes = await fetch(`/api/bookings?salonId=${user.salonId}`);
      const bookingsData = await bookingsRes.json();
      const bookings = bookingsData.bookings || [];

      // Calculate stats
      const today = new Date().toDateString();
      const todayBookings = bookings.filter(b => 
        new Date(b.appointmentDate).toDateString() === today
      ).length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const revenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      setStats({
        totalBookings: bookings.length,
        pendingBookings,
        todayBookings,
        totalStaff: salonData.salon?.staff?.length || 0,
        totalServices: salonData.salon?.services?.length || 0,
        revenue,
      });

      // Get recent bookings
      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Today\'s Bookings',
      value: stats.todayBookings,
      icon: '📅',
      color: 'blue',
      link: '/salon-admin/bookings',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingBookings,
      icon: '⏳',
      color: 'yellow',
      link: '/salon-admin/bookings/pending',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: '📊',
      color: 'green',
      link: '/salon-admin/bookings',
    },
    {
      title: 'Staff Members',
      value: stats.totalStaff,
      icon: '👨‍💼',
      color: 'purple',
      link: '/salon-admin/staff',
    },
    {
      title: 'Services',
      value: stats.totalServices,
      icon: '✂️',
      color: 'pink',
      link: '/salon-admin/services',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: '💰',
      color: 'green',
      link: '/salon-admin/bookings',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    pink: 'bg-pink-50 text-pink-700',
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout requiredRole="salon-admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {salon?.name || 'Salon Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">Manage your salon operations and bookings</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/salon-admin/bookings">
              <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                View All →
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {booking.customerName || booking.customerPhone}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📞 {booking.customerPhone}</span>
                        <span>👨‍💼 {booking.staffName}</span>
                        <span>📅 {new Date(booking.appointmentDate).toLocaleDateString()}</span>
                        <span>🕐 {booking.appointmentTime}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Services: {booking.services?.map(s => s.name).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{booking.totalAmount}</div>
                      {booking.status === 'pending' && (
                        <Link href={`/salon-admin/bookings/pending`}>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Review →
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/salon-admin/bookings/pending">
              <button className="w-full px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex flex-col items-center gap-2">
                <span className="text-2xl">⏳</span>
                <span className="font-medium">Review Bookings</span>
              </button>
            </Link>
            <Link href="/salon-admin/staff">
              <button className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center gap-2">
                <span className="text-2xl">👨‍💼</span>
                <span className="font-medium">Manage Staff</span>
              </button>
            </Link>
            <Link href="/salon-admin/services">
              <button className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center gap-2">
                <span className="text-2xl">✂️</span>
                <span className="font-medium">Manage Services</span>
              </button>
            </Link>
            <Link href="/salon-admin/profile">
              <button className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <span className="font-medium">Salon Profile</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
