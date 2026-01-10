'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SalonAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok || !data.user) {
        router.push('/login');
        return;
      }

      if (data.user.role !== 'salon-admin') {
        router.push('/login');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/salon-admin', icon: '📊', label: 'Dashboard' },
    { href: '/salon-admin/queue', icon: '👥', label: 'Queue Management' },
    { href: '/salon-admin/bookings', icon: '📅', label: 'All Bookings' },
    { href: '/salon-admin/bookings/pending', icon: '⏳', label: 'Pending Bookings' },
    { href: '/salon-admin/services', icon: '✂️', label: 'Services' },
    { href: '/salon-admin/staff', icon: '👨‍💼', label: 'Staff' },
    { href: '/salon-admin/profile', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-700 shadow-lg z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-white hover:bg-green-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xl">💈</div>
            <h2 className="text-lg font-bold text-white">Salon Admin</h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-600 to-green-700 shadow-xl overflow-y-auto z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Desktop Logo Section */}
        <div className="hidden lg:block p-6 border-b border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl">💈</div>
            <div>
              <h2 className="text-xl font-bold text-white">Salon Admin</h2>
              <p className="text-xs text-green-100">Management Panel</p>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-green-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xl">💈</div>
            <div>
              <h2 className="text-base font-bold text-white">Salon Admin</h2>
              <p className="text-xs text-green-100">Management Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-white hover:bg-green-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-800 bg-opacity-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-sm sm:text-base">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name || 'Admin User'}</p>
                <p className="text-xs text-green-200 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="px-3 py-4 sm:py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  isActive 
                    ? 'bg-white text-green-700 shadow-md' 
                    : 'text-white hover:bg-green-800 hover:bg-opacity-50'
                }`}
              >
                <span className="text-lg sm:text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout Button (Desktop) */}
          <div className="hidden lg:block pt-4 mt-4 border-t border-green-500">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-white hover:bg-red-600 hover:bg-opacity-80 transition-all"
            >
              <span className="text-xl">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-20 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
