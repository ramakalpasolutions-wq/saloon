'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SalonAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Navigation items
  const navItems = [
    { href: '/salon-admin', icon: '📊', label: 'Dashboard' },
    { href: '/salon-admin/queue', icon: '👥', label: 'Queue Management' },
    { href: '/salon-admin/services', icon: '✂️', label: 'Services' },
    { href: '/salon-admin/staff', icon: '👨‍💼', label: 'Staff' },
    { href: '/salon-admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-600 to-green-700 shadow-xl overflow-y-auto z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl">
              💈
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Salon Admin</h2>
              <p className="text-xs text-green-100">Management Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 bg-green-800 bg-opacity-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.name || 'Admin User'}
                </p>
                <p className="text-xs text-green-200 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                  ${isActive 
                    ? 'bg-white text-green-700 shadow-md' 
                    : 'text-white hover:bg-green-800 hover:bg-opacity-50'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-green-500">
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
      <main className="ml-64 pt-20 p-8">
        {children}
      </main>
    </div>
  );
}
